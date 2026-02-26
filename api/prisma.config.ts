import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'npx ts-node prisma/seed-all.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
