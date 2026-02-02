/**
 * 系统设置 (SYSTEM) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory, SettingValueType, UIInputType } from '../value-objects';

export const SYSTEM_SETTINGS = {
  'system.language': {
    key: 'system.language',
    name: '语言',
    description: '应用界面语言',
    category: SettingCategory.System,
    type: SettingValueType.String,
    uiInputType: UIInputType.Select,
    defaultValue: 'zh-CN',
    schema: z.enum(['zh-CN', 'zh-TW', 'en-US', 'ja-JP'] as const),
    isSyncable: true,
    scope: 'USER',
  },

  'system.timezone': {
    key: 'system.timezone',
    name: '时区',
    description: '用户时区',
    category: SettingCategory.System,
    type: SettingValueType.String,
    uiInputType: UIInputType.Text,
    defaultValue: 'Asia/Shanghai',
    schema: z.string(),
    isSyncable: true,
    scope: 'USER',
  },

  'system.dateFormat': {
    key: 'system.dateFormat',
    name: '日期格式',
    description: '日期显示格式',
    category: SettingCategory.System,
    type: SettingValueType.String,
    uiInputType: UIInputType.Select,
    defaultValue: 'YYYY-MM-DD',
    schema: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] as const),
    isSyncable: true,
    scope: 'USER',
  },

  'system.currency': {
    key: 'system.currency',
    name: '货币',
    description: '默认货币',
    category: SettingCategory.System,
    type: SettingValueType.String,
    uiInputType: UIInputType.Text,
    defaultValue: 'CNY',
    schema: z.string(),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>
