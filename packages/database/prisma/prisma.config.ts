import { defineConfig } from 'prisma/config';
import { loadWorkspaceEnv } from '../src/load-workspace-env';

loadWorkspaceEnv();

export default defineConfig({
  schema: './schema',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
