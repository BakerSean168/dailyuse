import type { PrismaClient } from '@memoflow/database';
import { createScheduleModule, type ScheduleModuleInstance } from './schedule.module';
import {
  ScheduleExecutionPrismaRepository,
  SchedulePrismaRepository,
  ScheduleTaskPrismaRepository,
} from './adapters/prisma';
import type { ScheduleRuntimeContributionsInput } from './schedule.module';

export interface CreateSchedulePrismaModuleOptions {
  readonly runtimeContributions?: ScheduleRuntimeContributionsInput;
}

export function createSchedulePrismaRepository(db: PrismaClient) {
  return new SchedulePrismaRepository(db);
}

export function createScheduleTaskPrismaRepository(
  db: PrismaClient,
  outboxWriter?: import('@memoflow/patterns').IOutboxWriter,
) {
  return new ScheduleTaskPrismaRepository(db, undefined, outboxWriter);
}

export function createScheduleExecutionPrismaRepository(db: PrismaClient) {
  return new ScheduleExecutionPrismaRepository(db);
}

export function createSchedulePrismaModule(
  db: PrismaClient,
  options: CreateSchedulePrismaModuleOptions = {},
): ScheduleModuleInstance {
  return createScheduleModule({
    scheduleRepository: createSchedulePrismaRepository(db),
    scheduleTaskRepository: createScheduleTaskPrismaRepository(db),
    scheduleExecutionRepository: createScheduleExecutionPrismaRepository(db),
    runtimeContributions: options.runtimeContributions,
  });
}
