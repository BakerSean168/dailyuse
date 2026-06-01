/**
 * Task Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the task module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createTaskModule,
  TaskTemplatePrismaRepository,
  TaskInstancePrismaRepository,
  TaskDependencyPrismaRepository,
  TaskFolderPrismaRepository,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
} from '../infrastructure-server';

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
  return createTaskModule({
    taskTemplateRepository: new TaskTemplatePrismaRepository(db),
    taskInstanceRepository: new TaskInstancePrismaRepository(db),
    taskDependencyRepository: new TaskDependencyPrismaRepository(db),
    taskFolderRepository: new TaskFolderPrismaRepository(db),
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
