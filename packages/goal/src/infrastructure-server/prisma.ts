/**
 * Convenience factory — Prisma-backed goal module for API/server runtimes.
 * 便捷工厂 — 基于 Prisma 的 API/服务端目标模块。
 */

import type { PrismaClient } from '@dailyuse/database';

import {
  createGoalModule,
  type GoalModuleInstance,
  type GoalRuntimeContributionsInput,
} from './goal.module';
import { GoalPrismaRepository } from './adapters/prisma/goal-prisma.repository';
import { GoalFolderPrismaRepository } from './adapters/prisma/goal-folder-prisma.repository';
import { GoalRecordPrismaRepository } from './adapters/prisma/goal-record-prisma.repository';
import { FocusModePrismaRepository } from './adapters/prisma/focus-mode-prisma.repository';

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
