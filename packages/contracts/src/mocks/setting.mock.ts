/**
 * Setting Module - Mock Generators
 */

import { faker } from '@faker-js/faker';
import type { UserSettingClientDTO } from '../modules/setting/aggregates/user-setting-client';
import { getDefaultPreferences } from '../modules/setting/preferences/defaults';
import type { SettingId, IdentityId } from '../primitives/ids';

export function createMockUserSetting(
  overrides: Partial<UserSettingClientDTO> = {},
): UserSettingClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();

  return {
    id: id as SettingId,
    identityId: faker.string.uuid() as IdentityId,
    preferences: {
      appearance: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
      },
      locale: {
        language: faker.helpers.arrayElement(['zh-CN', 'en-US', 'ja-JP']),
        timezone: faker.helpers.arrayElement([
          'Asia/Shanghai',
          'America/New_York',
          'Europe/London',
        ]),
        dateFormat: faker.helpers.arrayElement(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']),
        timeFormat: faker.helpers.arrayElement(['12H', '24H']),
        currency: faker.helpers.arrayElement(['CNY', 'USD', 'EUR']),
        weekStartsOn: faker.helpers.arrayElement([0, 1]),
      },
      workflow: {
        autoSave: faker.datatype.boolean(),
        autoSaveInterval: faker.helpers.arrayElement([15000, 30000, 60000]),
        confirmBeforeDelete: faker.datatype.boolean(),
        defaultTaskView: faker.helpers.arrayElement(['LIST', 'KANBAN', 'CALENDAR']),
        defaultGoalView: faker.helpers.arrayElement(['LIST', 'TREE', 'TIMELINE']),
        defaultScheduleView: faker.helpers.arrayElement(['DAY', 'WEEK', 'MONTH']),
      },
      privacy: {
        profileVisibility: faker.helpers.arrayElement(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY']),
        showOnlineStatus: faker.datatype.boolean(),
        shareUsageData: faker.datatype.boolean(),
        allowSearchByEmail: faker.datatype.boolean(),
        allowSearchByPhone: faker.datatype.boolean(),
      },
      notification: {
        email: faker.datatype.boolean(),
        push: faker.datatype.boolean(),
        inApp: faker.datatype.boolean(),
        sound: faker.datatype.boolean(),
        useCustomNotification: faker.datatype.boolean(),
      },
      editor: {
        theme: faker.helpers.arrayElement(['default', 'dark', 'monokai']),
        fontSize: faker.helpers.arrayElement([12, 14, 16]),
        tabSize: faker.helpers.arrayElement([2, 4]),
        wordWrap: faker.datatype.boolean(),
        lineNumbers: faker.datatype.boolean(),
        minimap: faker.datatype.boolean(),
      },
      shortcuts: {
        enabled: faker.datatype.boolean(),
        custom: {},
      },
      experimental: {
        enabled: faker.datatype.boolean(),
        features: [],
      },
      ui: {
        startPage: faker.helpers.arrayElement(['dashboard', 'tasks', 'goals']),
        sidebarCollapsed: faker.datatype.boolean(),
      },
      ai: {
        knowledgeNoteSubpath: faker.helpers.arrayElement(['', 'ai', 'ai/inbox']),
      },
    },
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    ...overrides,
  };
}
