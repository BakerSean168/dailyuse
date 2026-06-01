/**
 * Schedule Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the schedule module
 * with Prisma-backed repositories. These helpers allow external consumers
 * (apps, cross-feature packages) to wire schedule dependencies without
 * importing from the internal infrastructure-server layer.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createScheduleModule,
  SchedulePrismaRepository,
  ScheduleTaskPrismaRepository,
  ScheduleExecutionPrismaRepository,
  type ScheduleModuleInstance,
  type ScheduleModuleRuntimeContribution,
} from '../infrastructure-server';

export interface CreateSchedulePrismaModuleOptions {
  readonly runtimeContributions?:
    | ScheduleModuleRuntimeContribution
    | readonly ScheduleModuleRuntimeContribution[];
}

/**
 * Create a fully-wired schedule module backed by Prisma repositories.
 */
export function createSchedulePrismaModule(
  db: PrismaClient,
  options: CreateSchedulePrismaModuleOptions = {},
): ScheduleModuleInstance {
  return createScheduleModule({
    scheduleRepository: new SchedulePrismaRepository(db),
    scheduleTaskRepository: new ScheduleTaskPrismaRepository(db),
    scheduleExecutionRepository: new ScheduleExecutionPrismaRepository(db),
    runtimeContributions: options.runtimeContributions,
  });
}

/**
 * Create a standalone ScheduleTaskPrismaRepository.
 * Needed by goal, task, and reminder for their schedule runtime contributions.
 */
export function createScheduleTaskPrismaRepository(
  db: PrismaClient,
): ScheduleTaskPrismaRepository {
  return new ScheduleTaskPrismaRepository(db);
}
