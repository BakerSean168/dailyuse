/**
 * Task Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the task module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createTaskModule,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
} from './task.module';
import {
  PrismaTaskWriteTransactionRunner,
  TaskDependencyPrismaRepository,
  TaskFolderPrismaRepository,
  TaskInstancePrismaRepository,
  TaskTemplatePrismaRepository,
} from './adapters/prisma';
import { createTaskScheduleExecutionSource } from './schedule-execution-source';
import { createTaskScheduleProjectionSource } from './schedule-projection-source';
import type { TaskScheduleExecutionSource } from '../../schedule-execution';
import type { TaskScheduleProjectionSource } from '../../schedule-projection';

export interface CreateTaskPrismaModuleOptions {
  readonly runtimeContributions?:
    | TaskModuleRuntimeContribution
    | readonly TaskModuleRuntimeContribution[];
}

/**
 * Create a fully-wired task module backed by Prisma repositories.
 */
export function createTaskPrismaModule(
  db: PrismaClient,
  options: CreateTaskPrismaModuleOptions = {},
): TaskModuleInstance {
  const taskTemplateRepository = new TaskTemplatePrismaRepository(db);
  const taskInstanceRepository = new TaskInstancePrismaRepository(db);

  return createTaskModule({
    taskTemplateRepository,
    taskInstanceRepository,
    taskDependencyRepository: new TaskDependencyPrismaRepository(db),
    taskFolderRepository: new TaskFolderPrismaRepository(db),
    taskWriteTransactionRunner: new PrismaTaskWriteTransactionRunner(db),
    runtimeContributions: options.runtimeContributions,
  });
}

/**
 * Create standalone task Prisma repositories.
 * Useful when consumers need individual repositories for cross-module wiring.
 */
export function createTaskPrismaRepositories(db: PrismaClient) {
  return {
    taskTemplateRepository: new TaskTemplatePrismaRepository(db),
    taskInstanceRepository: new TaskInstancePrismaRepository(db),
    taskDependencyRepository: new TaskDependencyPrismaRepository(db),
    taskFolderRepository: new TaskFolderPrismaRepository(db),
  };
}

export function createTaskPrismaScheduleProjectionSource(
  db: PrismaClient,
): TaskScheduleProjectionSource {
  const repositories = createTaskPrismaRepositories(db);

  return createTaskScheduleProjectionSource({
    taskTemplateRepository: repositories.taskTemplateRepository,
    taskInstanceRepository: repositories.taskInstanceRepository,
  });
}

export function createTaskPrismaScheduleExecutionSource(
  db: PrismaClient,
): TaskScheduleExecutionSource {
  const repositories = createTaskPrismaRepositories(db);

  return createTaskScheduleExecutionSource({
    taskInstanceRepository: repositories.taskInstanceRepository,
    taskTemplateRepository: repositories.taskTemplateRepository,
  });
}
