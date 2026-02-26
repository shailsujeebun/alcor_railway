import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx ts-node prisma/seed.ts",
  },
  datasource: {
    url: "postgresql://mp:mp@127.0.0.1:5555/mpdb?schema=public",
  },
});
