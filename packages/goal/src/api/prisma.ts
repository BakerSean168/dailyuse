/**
 * Goal Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the goal module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  GoalPrismaRepository,
  GoalFolderPrismaRepository,
  GoalRecordPrismaRepository,
} from '../infrastructure-server';

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
