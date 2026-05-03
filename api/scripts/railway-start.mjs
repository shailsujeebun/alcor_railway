import { spawn } from 'node:child_process';
import { Client } from 'pg';

function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} ${args.join(' ')} exited via signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
        return;
      }

      resolve();
    });
  });
}

async function getSeedState() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const usersExists = await client.query(
      "select to_regclass('public.user') as table_name",
    );
    const marketplaceExists = await client.query(
      "select to_regclass('public.marketplace') as table_name",
    );

    if (!usersExists.rows[0]?.table_name || !marketplaceExists.rows[0]?.table_name) {
      return { hasSchema: false, isSeeded: false, summary: 'schema tables missing' };
    }

    const [
      { rows: userRows },
      { rows: marketplaceRows },
      { rows: activeMarketplaceRows },
      { rows: categoryRows },
      { rows: templateRows },
      { rows: brandRows },
      { rows: companyRows },
      { rows: listingRows },
    ] =
      await Promise.all([
        client.query('select count(*)::int as count from "user"'),
        client.query('select count(*)::int as count from marketplace'),
        client.query('select count(*)::int as count from marketplace where is_active = true'),
        client.query('select count(*)::int as count from category'),
        client.query('select count(*)::int as count from form_template'),
        client.query('select count(*)::int as count from brand'),
        client.query('select count(*)::int as count from company'),
        client.query('select count(*)::int as count from listing'),
      ]);

    const users = userRows[0]?.count ?? 0;
    const marketplaces = marketplaceRows[0]?.count ?? 0;
    const activeMarketplaces = activeMarketplaceRows[0]?.count ?? 0;
    const categories = categoryRows[0]?.count ?? 0;
    const templates = templateRows[0]?.count ?? 0;
    const brands = brandRows[0]?.count ?? 0;
    const companies = companyRows[0]?.count ?? 0;
    const listings = listingRows[0]?.count ?? 0;

    return {
      hasSchema: true,
      isSeeded:
        users >= 5 &&
        activeMarketplaces >= 3 &&
        categories >= 15 &&
        templates >= 10 &&
        brands >= 8 &&
        companies >= 3 &&
        listings >= 4,
      summary:
        `users=${users}, marketplaces=${marketplaces}, activeMarketplaces=${activeMarketplaces}, ` +
        `categories=${categories}, templates=${templates}, brands=${brands}, companies=${companies}, listings=${listings}`,
    };
  } finally {
    await client.end();
  }
}

async function runSeedAllAndVerify(reason) {
  console.log(`[railway] ${reason}`);
  await run('pnpm', ['run', 'seed:all']);
  await run('pnpm', ['run', 'seed:verify']);
}

async function verifyExistingSeed() {
  try {
    await run('pnpm', ['run', 'seed:verify']);
    return true;
  } catch (error) {
    console.warn('[railway] existing seed verification failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for Railway startup');
  }

  console.log('[railway] applying Prisma migrations');
  await run('pnpm', ['run', 'migrate:deploy']);

  const forceReseed = toBoolean(process.env.RAILWAY_FORCE_RESEED, false);
  const autoRepairSeed = toBoolean(
    process.env.RAILWAY_AUTO_RESEED_ON_VERIFY_FAILURE,
    true,
  );
  const state = await getSeedState();
  console.log(`[railway] database state after migrations: ${state.summary}`);

  if (forceReseed) {
    await runSeedAllAndVerify(
      'RAILWAY_FORCE_RESEED=true, running full destructive seed',
    );
  } else if (!state.isSeeded) {
    await runSeedAllAndVerify(
      'database is empty or incomplete, running initial seed',
    );
  } else {
    console.log('[railway] existing seeded data detected, verifying integrity');
    const seedIsHealthy = await verifyExistingSeed();
    if (!seedIsHealthy) {
      if (!autoRepairSeed) {
        throw new Error(
          'Seed verification failed and RAILWAY_AUTO_RESEED_ON_VERIFY_FAILURE is disabled',
        );
      }
      await runSeedAllAndVerify(
        'seed verification failed, auto-repairing with a full reseed',
      );
    }
  }

  console.log('[railway] starting API');
  const server = spawn('node', ['dist/main'], {
    stdio: 'inherit',
    env: process.env,
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (!server.killed) {
        server.kill(signal);
      }
    });
  }

  server.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('[railway] startup failed:', error);
  process.exit(1);
});
