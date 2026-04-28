import { ensureTestDatabase } from '@dailyuse/test-utils/setup/database';

export async function setup() {
  await ensureTestDatabase();
}

export async function teardown() {}
