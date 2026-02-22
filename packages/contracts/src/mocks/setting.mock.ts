/**
 * Setting Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Setting module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockUserSetting, createMockAppConfig } from '@dailyuse/contracts/mocks';
 * const setting = createMockUserSetting();
 * const config = createMockAppConfig();
 * ```
 */

import { faker } from '@faker-js/faker';
import type { UserSettingClientDTO } from '../modules/setting';

export interface AppConfigClientDTO {
  id: string;
  key: string;
  value: string | number | boolean | object;
  category: string;
  description: string | null;
  updatedAt: number;
}

export function createMockUserSetting(
  overrides: Partial<UserSettingClientDTO> = {},
): UserSettingClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();

  const entries = {
    appearance: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
      fontSize: faker.helpers.arrayElement(['small', 'medium', 'large']),
      fontFamily: faker.helpers.arrayElement(['sans-serif', 'serif', 'monospace']),
    },
    locale: {
      language: faker.helpers.arrayElement(['zh-CN', 'en-US', 'ja-JP']),
      timezone: faker.helpers.arrayElement(['Asia/Shanghai', 'America/New_York', 'Europe/London']),
      dateFormat: faker.helpers.arrayElement(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']),
    },
    workflow: {
      autoSave: faker.datatype.boolean(),
      autoSaveInterval: faker.helpers.arrayElement([30, 60, 120]),
      confirmBeforeDelete: faker.datatype.boolean(),
    },
    privacy: {
      analyticsEnabled: faker.datatype.boolean(),
      crashReportEnabled: faker.datatype.boolean(),
    },
    experimental: {
      betaFeatures: faker.datatype.boolean(),
      aiSuggestions: faker.datatype.boolean(),
    },
  };

  return {
    id,
    identityId: faker.string.uuid(),
    entries: JSON.stringify(entries),
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockAppConfig(
  overrides: Partial<AppConfigClientDTO> = {},
): AppConfigClientDTO {
  const now = Date.now();
  const key = faker.helpers.arrayElement([
    'max_upload_size',
    'ai_model',
    'rate_limit',
    'feature_flags',
    'maintenance_mode',
  ]);

  const valueMap: Record<string, AppConfigClientDTO['value']> = {
    max_upload_size: faker.number.int({ min: 10, max: 100 }),
    ai_model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
    rate_limit: { requests: faker.number.int({ min: 100, max: 1000 }), window: '1h' },
    feature_flags: { newUI: faker.datatype.boolean(), betaApi: faker.datatype.boolean() },
    maintenance_mode: faker.datatype.boolean(),
  };

  return {
    id: faker.string.uuid(),
    key,
    value: valueMap[key],
    category: faker.helpers.arrayElement(['system', 'ai', 'security', 'feature']),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockAppConfigList(
  count = 5,
  overrides: Partial<AppConfigClientDTO> = {},
): AppConfigClientDTO[] {
  return Array.from({ length: count }, () => createMockAppConfig(overrides));
}
