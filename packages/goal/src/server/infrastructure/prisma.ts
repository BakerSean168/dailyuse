/**
 * Convenience factories for Prisma-backed goal runtime composition.
 * 目标模块 Prisma 运行时组合便捷工厂。
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createGoalModule,
  type GoalModuleInstance,
  type GoalRuntimeContributionsInput,
} from './goal.module';
import {
  FocusModePrismaRepository,
  GoalFolderPrismaRepository,
  GoalPrismaRepository,
  GoalRecordPrismaRepository,
} from './adapters/prisma';
import { createGoalScheduleExecutionSource } from './schedule-execution-source';
import { createGoalScheduleProjectionSource } from './schedule-projection-source';
import type { GoalScheduleExecutionSource } from '../../schedule-execution';
import type { GoalScheduleProjectionSource } from '../../schedule-projection';

export function createGoalPrismaModule(
  db: PrismaClient,
  options?: {
    runtimeContributions?: GoalRuntimeContributionsInput;
  },
): GoalModuleInstance {
  return createGoalModule({
    goalRepository: new GoalPrismaRepository(db),
    goalFolderRepository: new GoalFolderPrismaRepository(db),
    goalRecordRepository: new GoalRecordPrismaRepository(db),
    focusModeRepository: new FocusModePrismaRepository(db),
    runtimeContributions: options?.runtimeContributions,
  });
}

/**
 * Create standalone goal Prisma repositories.
 * Useful for cross-module wiring such as schedule sources.
 */
export function createGoalPrismaRepositories(db: PrismaClient) {
  return {
    goalRepository: new GoalPrismaRepository(db),
    goalFolderRepository: new GoalFolderPrismaRepository(db),
    goalRecordRepository: new GoalRecordPrismaRepository(db),
    focusModeRepository: new FocusModePrismaRepository(db),
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
