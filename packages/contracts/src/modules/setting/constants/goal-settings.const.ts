/**
 * 目标设置 (GOAL) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory } from '../value-objects';

export const GOAL_SETTINGS: Record<string, SettingDefinition> = {
  'goal.celebrationEnabled': {
    key: 'goal.celebrationEnabled',
    name: '庆祝动画',
    description: '完成目标时显示庆祝动画',
    category: SettingCategory.GOAL,
    type: 'BOOLEAN',
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'goal.weeklyReportDay': {
    key: 'goal.weeklyReportDay',
    name: '周报日期',
    description: '每周几生成周报（0=周日，6=周六）',
    category: SettingCategory.GOAL,
    type: 'NUMBER',
    defaultValue: 0,
    schema: z.number().min(0).max(6),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>;
