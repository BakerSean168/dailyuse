import { ensureTestDatabase } from '@dailyuse/test-utils/setup/database';

export async function setup() {
  // Centralize DB startup + schema sync here so the integration target is the
  // only entry developers need to remember.
  await ensureTestDatabase();
}

export async function teardown() {
  // Data cleanup is handled per test. Keep teardown minimal to avoid
  // disconnecting a container that a developer intentionally started.
}
