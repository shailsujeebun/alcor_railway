
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { clearDatabase } from './seed-all/cleanup';
import { seedCompaniesAndListings } from './seed-all/companies-listings';
import { seedCore } from './seed-all/core';
import { seedEngagement } from './seed-all/engagement';
import { SEED_REFERENCE_DATE } from './seed-all/shared';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`Seeding full dataset (deterministic reference date: ${SEED_REFERENCE_DATE.toISOString()})...`);

    console.log('1/4 Clearing existing data...');
    await clearDatabase(prisma);

    console.log('2/4 Seeding core references and auth data...');
    const core = await seedCore(prisma);

    console.log('3/4 Seeding companies and listings...');
    const companiesAndListings = await seedCompaniesAndListings(prisma, core);

    console.log('4/4 Seeding engagement data...');
    const conversation = await seedEngagement(prisma, {
      users: core.users,
      geo: core.geo,
      companies: companiesAndListings.companies,
      listings: companiesAndListings.listings,
    });

    console.log('Seed completed successfully.');
    console.log(`Users: ${Object.keys(core.users).length}`);
    console.log(`Countries: 3, Cities: 5`);
    console.log(`Marketplaces: ${core.catalog.marketplaceMap.size}, Categories: ${core.catalog.categoriesBySlug.size}`);
    console.log(`Brands: ${core.catalog.brandMap.size}, Activity types: ${core.catalog.activityTypeIds.length}`);
    console.log(`Companies: ${Object.keys(companiesAndListings.companies).length}`);
    console.log(`Listings: ${Object.keys(companiesAndListings.listings).length}`);
    console.log(`Plans: ${Object.keys(core.plans).length}, Subscriptions: 3`);
    console.log(`Primary conversation: ${conversation.primaryConversationId}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Comprehensive seed failed:', error);
  process.exit(1);
});
