import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') })

console.log('🔌 Loaded DATABASE_URL:', process.env.DATABASE_URL ? 'Yes' : 'No');

export default defineConfig({
  schema: './schema',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
