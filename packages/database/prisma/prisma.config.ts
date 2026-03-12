import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') });

export default defineConfig({
  schema: './schema',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
