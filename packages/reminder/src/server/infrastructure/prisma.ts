/**
 * Reminder Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the reminder module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@memoflow/database';
import {
  createReminderModule,
  type ReminderModuleInstance,
  type ReminderModuleRuntimeContribution,
} from './reminder.module';
import { createReminderScheduleExecutionSource } from './schedule-execution-source';
import { createReminderScheduleProjectionSource } from './schedule-projection-source';
import {
  ReminderTemplatePrismaRepository,
  ReminderGroupPrismaRepository,
  ReminderResponsePrismaRepository,
  UserReminderPreferencePrismaRepository,
} from './adapters/prisma';
import type { ReminderScheduleExecutionSource } from '../../schedule-execution';
import type { ReminderScheduleProjectionSource } from '../../schedule-projection';

export interface CreateReminderPrismaModuleOptions {
  readonly runtimeContributions?:
    | ReminderModuleRuntimeContribution
    | readonly ReminderModuleRuntimeContribution[];
}

/**
 * Create a fully-wired reminder module backed by Prisma repositories.
 */
export function createReminderPrismaModule(
  db: PrismaClient,
  options: CreateReminderPrismaModuleOptions = {},
): ReminderModuleInstance {
  return createReminderModule({
    reminderTemplateRepository: new ReminderTemplatePrismaRepository(db),
    reminderGroupRepository: new ReminderGroupPrismaRepository(db),
    reminderResponseRepository: new ReminderResponsePrismaRepository(db),
    userReminderPreferenceRepository: new UserReminderPreferencePrismaRepository(db),
    runtimeContributions: options.runtimeContributions,
  });
}

/**
 * Create standalone reminder Prisma repositories.
 * Useful for cross-module wiring (e.g., schedule source executor).
 */
export function createReminderPrismaRepositories(db: PrismaClient) {
  return {
    reminderTemplateRepository: new ReminderTemplatePrismaRepository(db),
    reminderGroupRepository: new ReminderGroupPrismaRepository(db),
    reminderResponseRepository: new ReminderResponsePrismaRepository(db),
    userReminderPreferenceRepository: new UserReminderPreferencePrismaRepository(db),
  };
}

export function createReminderPrismaScheduleProjectionSource(
  db: PrismaClient,
): ReminderScheduleProjectionSource {
  const repositories = createReminderPrismaRepositories(db);

  return createReminderScheduleProjectionSource({
    reminderTemplateRepository: repositories.reminderTemplateRepository,
  });
}

export function createReminderPrismaScheduleExecutionSource(
  db: PrismaClient,
): ReminderScheduleExecutionSource {
  const repositories = createReminderPrismaRepositories(db);

  return createReminderScheduleExecutionSource({
    reminderTemplateRepository: repositories.reminderTemplateRepository,
  });
}
