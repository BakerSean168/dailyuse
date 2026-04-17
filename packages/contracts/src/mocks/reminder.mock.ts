/**
 * Reminder Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Reminder module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockReminderTemplate, createMockReminderGroup } from '@dailyuse/contracts/mocks';
 * const template = createMockReminderTemplate();
 * const group = createMockReminderGroup();
 * ```
 */

import { faker } from '@faker-js/faker';
import type { ReminderTemplateClientDTO } from '../modules/reminder/aggregates/reminder-template-client';
import type { ReminderGroupClientDTO } from '../modules/reminder/aggregates/reminder-group-client';
import type { IdentityId, ReminderGroupId, ReminderTemplateId } from '../primitives/ids';

export function createMockReminderTemplate(
  overrides: Partial<ReminderTemplateClientDTO> = {},
): ReminderTemplateClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();

  return {
    id: id as ReminderTemplateId,
    identityId: faker.string.uuid() as IdentityId,
    name: faker.lorem.words({ min: 2, max: 4 }),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    type: faker.helpers.arrayElement(['OneTime', 'Recurring']),
    trigger: {
      type: faker.helpers.arrayElement(['Time', 'Event', 'Location']),
      time: faker.datatype.boolean()
        ? `${faker.number.int({ min: 0, max: 23 }).toString().padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`
        : null,
      event: faker.datatype.boolean()
        ? faker.helpers.arrayElement(['task_complete', 'goal_achieve', 'resource_save'])
        : null,
    },
    recurrence: faker.datatype.boolean()
      ? {
          type: faker.helpers.arrayElement(['Daily', 'Weekly', 'Monthly']),
          interval: faker.number.int({ min: 1, max: 7 }),
          daysOfWeek: faker.helpers.arrayElements(
            [0, 1, 2, 3, 4, 5, 6],
            faker.number.int({ min: 1, max: 7 }),
          ),
          endDate: null,
        }
      : null,
    activeTime: {
      startDate: now - faker.number.int({ min: 0, max: 7 * 24 * 60 * 60 * 1000 }),
      endDate: null,
    },
    activeHours: faker.datatype.boolean()
      ? {
          startHour: faker.number.int({ min: 6, max: 12 }),
          endHour: faker.number.int({ min: 18, max: 23 }),
        }
      : null,
    notificationConfig: {
      channels: faker.helpers.arrayElements(
        ['push', 'email', 'sms', 'in_app'],
        faker.number.int({ min: 1, max: 3 }),
      ),
      sound: faker.datatype.boolean(),
      vibrate: faker.datatype.boolean(),
    },
    selfEnabled: faker.datatype.boolean(),
    status: faker.helpers.arrayElement(['Active', 'Paused', 'Completed', 'Cancelled']),
    effectiveEnabled: faker.datatype.boolean(),
    groupId: faker.datatype.boolean() ? faker.string.uuid() : null,
    importanceLevel: faker.helpers.arrayElement([
      'Vital',
      'Important',
      'Moderate',
      'Minor',
      'Trivial',
    ]),
    tags: faker.helpers.arrayElements(
      ['work', 'personal', 'health', 'meeting'],
      faker.number.int({ min: 0, max: 2 }),
    ),
    color: faker.datatype.boolean() ? faker.color.rgb({ format: 'hex', casing: 'upper' }) : null,
    icon: faker.datatype.boolean()
      ? faker.helpers.arrayElement(['bell', 'clock', 'calendar', 'star'])
      : null,
    nextTriggerAt: now + faker.number.int({ min: 60000, max: 86400000 }),
    stats: {
      totalTriggers: faker.number.int({ min: 0, max: 100 }),
      acknowledgedCount: faker.number.int({ min: 0, max: 80 }),
      dismissedCount: faker.number.int({ min: 0, max: 20 }),
      lastTriggeredAt: faker.datatype.boolean()
        ? now - faker.number.int({ min: 0, max: 86400000 })
        : null,
    },
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    history: null,
    displayTitle: faker.lorem.words({ min: 2, max: 4 }),
    typeText: faker.helpers.arrayElement(['一次性', '循环']),
    triggerText: `每天 ${faker.number.int({ min: 8, max: 18 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
    recurrenceText: faker.datatype.boolean() ? '每周一、三、五' : null,
    statusText: faker.helpers.arrayElement(['活跃', '暂停', '已完成', '已取消']),
    importanceText: faker.helpers.arrayElement(['至关重要', '重要', '一般', '次要', '微不足道']),
    nextTriggerText: `${faker.number.int({ min: 1, max: 60 })} 分钟后`,
    isActive: faker.datatype.boolean(),
    isPaused: faker.datatype.boolean(),
    lastTriggeredText: faker.datatype.boolean()
      ? `${faker.number.int({ min: 1, max: 24 })} 小时前`
      : null,
    controlledByGroup: faker.datatype.boolean(),
    lifecycleSource: faker.helpers.arrayElement(['global', 'group', 'template']),
    effectiveEnabledReason: faker.helpers.arrayElement([
      '未分组，使用模板自身状态',
      '分组为组控制模式，分组已启用',
      '全局提醒总开关已关闭',
    ]),
    groupControlMode: faker.helpers.arrayElement(['Group', 'Individual', null]),
    groupEnabled: faker.helpers.arrayElement([true, false, null]),
    globalReminderEnabled: faker.datatype.boolean(),
    groupName: faker.datatype.boolean() ? faker.lorem.words({ min: 1, max: 2 }) : null,
    ...overrides,
  } as ReminderTemplateClientDTO;
}

export function createMockReminderTemplateList(
  count = 5,
  overrides: Partial<ReminderTemplateClientDTO> = {},
): ReminderTemplateClientDTO[] {
  return Array.from({ length: count }, () => createMockReminderTemplate(overrides));
}

export function createMockReminderGroup(
  overrides: Partial<ReminderGroupClientDTO> = {},
): ReminderGroupClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();

  const totalTemplates = faker.number.int({ min: 0, max: 10 });
  const activeTemplates = faker.number.int({ min: 0, max: totalTemplates });
  const pausedTemplates = totalTemplates - activeTemplates;

  return {
    id: id as ReminderGroupId,
    identityId: faker.string.uuid() as IdentityId,
    name: faker.lorem.words({ min: 1, max: 3 }),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    color: faker.datatype.boolean() ? faker.color.rgb({ format: 'hex', casing: 'upper' }) : null,
    icon: faker.datatype.boolean() ? faker.helpers.arrayElement(['folder', 'tag', 'group']) : null,
    controlMode: faker.helpers.arrayElement(['Group', 'Individual']),
    enabled: faker.datatype.boolean(),
    status: faker.helpers.arrayElement(['Active', 'Paused']),
    order: faker.number.int({ min: 0, max: 100 }),
    stats: {
      totalTemplates,
      activeTemplates,
      pausedTemplates,
      selfEnabledTemplates: faker.number.int({ min: 0, max: totalTemplates }),
      selfPausedTemplates: faker.number.int({ min: 0, max: Math.max(pausedTemplates, 0) }),
      templateCountText: `${totalTemplates} 个提醒`,
      activeStatusText: `${activeTemplates} 个活跃`,
    },
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    displayName: faker.lorem.words({ min: 1, max: 3 }),
    controlModeText: faker.helpers.arrayElement(['组控制', '个体控制']),
    statusText: faker.helpers.arrayElement(['活跃', '暂停']),
    templateCountText: `${totalTemplates} 个提醒`,
    activeStatusText: `${activeTemplates} 个活跃`,
    controlDescription: faker.helpers.arrayElement(['所有提醒统一启用', '提醒独立控制']),
    effectiveTemplatePolicyText: faker.helpers.arrayElement([
      '组内提醒当前由分组统一启用',
      '组内提醒当前由分组统一暂停',
      '组内提醒当前保持各自独立控制',
    ]),
    ...overrides,
  };
}

export function createMockReminderGroupList(
  count = 3,
  overrides: Partial<ReminderGroupClientDTO> = {},
): ReminderGroupClientDTO[] {
  return Array.from({ length: count }, () => createMockReminderGroup(overrides));
}
