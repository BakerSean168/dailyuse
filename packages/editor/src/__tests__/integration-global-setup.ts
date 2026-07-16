import { ensureTestDatabase } from '@dailyuse/test-utils/setup/database';

export async function setup() {
  await ensureTestDatabase();
}

export async function teardown() {
  // Individual tests own data cleanup. Keep the shared test database running.
}
