/**
 * @dailyuse/test-utils
 *
 * Unified testing utilities for the Memoflow monorepo.
 *
 * Sub-modules:
 * - helpers:  Random data generators, Result matchers, async waitFor
 * - mocks:    Proxy-based repository/event-bus mock factories
 * - fixtures: Lightweight shared test data factories (account, base helpers)
 * - setup:    Fast-test hooks, browser mocks, and database lifecycle management
 *
 * @example
 * ```typescript
 * // Import everything
 * import { createMockRepo, anIdentityId } from '@dailyuse/test-utils';
 *
 * // Or import from sub-modules for tree-shaking
 * import { anIdentityId } from '@dailyuse/test-utils/fixtures';
 * import { createMockRepo } from '@dailyuse/test-utils/mocks';
 * import { ensureTestDatabase } from '@dailyuse/test-utils/setup';
 * ```
 */

// Helpers
export {
  generateUUID,
  randomString,
  randomEmail,
  randomNumber,
  timestampFrom,
  TimeOffset,
} from './helpers/random.js';

export { waitFor } from './helpers/wait-for.js';

// Result matchers: side-effect module — import directly in vitest setup files:
//   import '@dailyuse/test-utils/helpers/result-matchers';

// Mocks
export { createMockRepo, createMockEventBus } from './mocks/repository-mock.factory.js';

// Fixtures
export {
  // Base
  withDefaults,
  timestamps,
  numericTimestamps,
  titleFor,
  // Account
  anIdentityId,
  TEST_IDENTITY_ID,
} from './fixtures/index.js';

// Setup (re-export selectively to avoid pulling in node:child_process for unit tests)
export { applyFastTestEnv, registerFastTestHooks } from './setup/fast.js';
export { installCommonBrowserMocks, createMatchMediaMock } from './setup/browser.js';
export { createTestPinia, installVuePiniaTestHarness, mountWithPinia } from './setup/vue.js';
export type {} from './setup/database.js';


