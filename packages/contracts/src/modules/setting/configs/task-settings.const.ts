/**
 * 任务设置 (TASK) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory, SettingValueType, UIInputType } from '../value-objects';

export const TASK_SETTINGS = {
  'task.defaultPriority': {
    key: 'task.defaultPriority',
    name: '默认优先级',
    description: '新任务的默认优先级',
    category: SettingCategory.Task,
    type: SettingValueType.String,
    uiInputType: UIInputType.Select,
    defaultValue: 'P2',
    schema: z.enum(['P0', 'P1', 'P2', 'P3'] as const),
    isSyncable: true,
    scope: 'USER',
  },

  'task.startOfWeek': {
    key: 'task.startOfWeek',
    name: '周起始日',
    description: '日历周的起始日（0=周日, 1=周一）',
    category: SettingCategory.Task,
    type: SettingValueType.Number,
    uiInputType: UIInputType.Select,
    defaultValue: 1,
    schema: z.union([z.literal(0), z.literal(1)]),
    isSyncable: true,
    scope: 'USER',
  },

  'task.defaultReminderMinutes': {
    key: 'task.defaultReminderMinutes',
    name: '默认提醒时间',
    description: '截止前多少分钟提醒',
    category: SettingCategory.Task,
    type: SettingValueType.Number,
    uiInputType: UIInputType.Slider,
    defaultValue: 15,
    schema: z.number().min(0).max(1440),
    isSyncable: true,
    scope: 'USER',
  },

  'task.hideCompletedTasks': {
    key: 'task.hideCompletedTasks',
    name: '隐藏已完成',
    description: '隐藏已完成的任务',
    category: SettingCategory.Task,
    type: SettingValueType.Boolean,
    uiInputType: UIInputType.Switch,
    defaultValue: false,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>
