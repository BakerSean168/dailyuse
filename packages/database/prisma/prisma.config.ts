import { defineConfig } from 'prisma/config';
import { loadPrismaConfigEnv } from './load-config-env';

loadPrismaConfigEnv();

export default defineConfig({
  schema: './schema',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
