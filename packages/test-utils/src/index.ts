/**
 * @dailyuse/test-utils
 *
 * Unified testing utilities for the DailyUse monorepo.
 *
 * Sub-modules:
 * - helpers:  Random data generators, Result matchers, async waitFor
 * - mocks:    Proxy-based repository/event-bus mock factories
 * - fixtures: Domain-specific test data factories (task, account)
 * - setup:    Database lifecycle management (Docker, Prisma, cleanup)
 *
 * @example
 * ```typescript
 * // Import everything
 * import { createMockRepo, aOneTimeTask, anIdentityId } from '@dailyuse/test-utils';
 *
 * // Or import from sub-modules for tree-shaking
 * import { aOneTimeTask } from '@dailyuse/test-utils/fixtures';
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
  // Task templates
  aOneTimeTask,
  aRecurringTask,
  aTaskTemplateState,
  aLoadedTaskTemplate,
  // Task instances
  aTaskInstance,
  // Value objects
  anAllDayTimeConfig,
  aTimePointConfig,
  aTimeRangeConfig,
  aDailyRecurrenceRule,
  aWeeklyRecurrenceRule,
  aDisabledReminderConfig,
  aRelativeReminder,
  aCompletionRecord,
  aCompletionWithDuration,
  aChecklist,
  // IDs
  aTaskTemplateId,
  aTaskInstanceId,
  aTaskFolderId,
} from './fixtures/index.js';

// Setup (re-export selectively to avoid pulling in node:child_process for unit tests)
export type {} from './setup/database.js';
