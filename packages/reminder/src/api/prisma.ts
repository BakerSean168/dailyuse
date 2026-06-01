/**
 * Reminder Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the reminder module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createReminderModule,
  ReminderTemplatePrismaRepository,
  ReminderGroupPrismaRepository,
  ReminderResponsePrismaRepository,
  UserReminderPreferencePrismaRepository,
  type ReminderModuleInstance,
  type ReminderModuleRuntimeContribution,
} from '../infrastructure-server';

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
