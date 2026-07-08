/**
 * Setting Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the setting module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createSettingModule,
  UserSettingPrismaRepository,
  type SettingModuleInstance,
  type SettingModuleRuntimeContribution,
} from './index';

export interface CreateSettingPrismaModuleOptions {
  readonly runtimeContributions?:
    | SettingModuleRuntimeContribution
    | readonly SettingModuleRuntimeContribution[];
}

/**
 * Create a fully-wired setting module backed by Prisma repositories.
 */
export function createSettingPrismaModule(
  db: PrismaClient,
  options: CreateSettingPrismaModuleOptions = {},
): SettingModuleInstance {
  return createSettingModule({
    userSettingRepository: new UserSettingPrismaRepository(db),
    runtimeContributions: options.runtimeContributions,
  });
}

/**
 * Create a standalone UserSettingPrismaRepository.
 */
export function createSettingPrismaRepository(db: PrismaClient) {
  return new UserSettingPrismaRepository(db);
}
