/**
 * Goal Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the goal module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createGoalScheduleExecutionSource,
  createGoalScheduleProjectionSource,
  GoalPrismaRepository,
  GoalFolderPrismaRepository,
  GoalRecordPrismaRepository,
} from '../infrastructure-server';
import type { GoalScheduleExecutionSource } from '../schedule-execution';
import type { GoalScheduleProjectionSource } from '../schedule-projection';

/**
 * Create standalone goal Prisma repositories.
 * Useful for cross-module wiring (e.g., schedule source executor).
 */
export function createGoalPrismaRepositories(db: PrismaClient) {
  return {
    goalRepository: new GoalPrismaRepository(db),
    goalFolderRepository: new GoalFolderPrismaRepository(db),
    goalRecordRepository: new GoalRecordPrismaRepository(db),
  };
}

export function createGoalPrismaScheduleProjectionSource(
  db: PrismaClient,
): GoalScheduleProjectionSource {
  const repositories = createGoalPrismaRepositories(db);

  return createGoalScheduleProjectionSource({
    goalRepository: repositories.goalRepository,
  });
}

export function createGoalPrismaScheduleExecutionSource(
  db: PrismaClient,
): GoalScheduleExecutionSource {
  const repositories = createGoalPrismaRepositories(db);

  return createGoalScheduleExecutionSource({
    goalRepository: repositories.goalRepository,
  });
}
