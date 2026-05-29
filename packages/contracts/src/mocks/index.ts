/**
 * @dailyuse/contracts - Mock Generators
 *
 * Re-exports all mock factory functions from sub-modules.
 * These are **development-only** helpers — do not import in production code.
 *
 * Governance mocks live in `@dailyuse/governance/mocks`, not here.
 *
 * @example
 * ```ts
 * import {
 *   createMockGoal,
 *   createMockGoalList,
 *   createMockTaskTemplate,
 *   createMockAccount,
 *   createMockAuthResponse,
 *   createMockScheduleTask,
 *   createMockReminderTemplate,
 *   createMockNotification,
 *   createMockRepository,
 *   createMockUserSetting,
 * } from '@dailyuse/contracts/mocks';
 *
 * // Governance mocks:
 * import { createMockRule, createMockRuleRevision } from '@dailyuse/governance/mocks';
 * ```
 */

export * from './goal.mock';
export * from './task.mock';
export * from './account.mock';
export * from './auth.mock';
export * from './schedule.mock';
export * from './reminder.mock';
export * from './notification.mock';
export * from './repository.mock';
export * from './setting.mock';
