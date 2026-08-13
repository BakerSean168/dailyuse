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
import { createReminderSnoozeReschedulerPrisma } from './reminder-snooze-rescheduler.prisma';
import {
  ReminderTemplatePrismaRepository,
  ReminderGroupPrismaRepository,
  ReminderResponsePrismaRepository,
  UserReminderPreferencePrismaRepository,
  ReminderReliableOperationPrismaAdapter,
  PrismaReminderWriteTransactionRunner,
} from './adapters/prisma';
import type { ReminderScheduleExecutionSource } from '../../schedule-execution';
import type { ReminderScheduleProjectionSource } from '../../schedule-projection';
import { PrismaOperationAuditRepository } from '@memoflow/patterns/operations';

export interface CreateReminderPrismaModuleOptions {
  readonly closureChecker: (identityId: string) => Promise<boolean>;
  readonly runtimeContributions?:
    | ReminderModuleRuntimeContribution
    | readonly ReminderModuleRuntimeContribution[];
}

/**
 * Create a fully-wired reminder module backed by Prisma repositories.
 */
export function createReminderPrismaModule(
  db: PrismaClient,
  options: CreateReminderPrismaModuleOptions,
): ReminderModuleInstance {
  if (!options?.closureChecker) {
    throw new Error('[FAIL-CLOSED] createReminderPrismaModule requires options.closureChecker');
  }

  return createReminderModule({
    reminderTemplateRepository: new ReminderTemplatePrismaRepository(db),
    reminderGroupRepository: new ReminderGroupPrismaRepository(db),
    reminderResponseRepository: new ReminderResponsePrismaRepository(db),
    userReminderPreferenceRepository: new UserReminderPreferencePrismaRepository(db),
    closureChecker: options.closureChecker,
    runtimeContributions: options.runtimeContributions,
    // R3c：snooze 作为真 command——推迟 reminder 对应 schedule task 的下次触发。
    snoozeRescheduler: createReminderSnoozeReschedulerPrisma(db),
    // W7：统一 operation timeline / replay / audit。
    reliablePort: new ReminderReliableOperationPrismaAdapter(db),
    auditRepository: new PrismaOperationAuditRepository(db),
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
    reliablePort: new ReminderReliableOperationPrismaAdapter(db),
    transactionRunner: new PrismaReminderWriteTransactionRunner(db),
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
