/**
 * Global setup for task integration tests.
 *
 * Runs once before the entire test suite:
 * 1. Starts the Docker PostgreSQL container
 * 2. Waits for DB readiness
 * 3. Pushes the Prisma schema
 */
import { ensureTestDatabase } from '@dailyuse/test-utils/setup/database';

export default async function globalSetup() {
  await ensureTestDatabase();
}
