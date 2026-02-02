/**
 * 外观设置 (APPEARANCE) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema，自带完整的验证逻辑
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory } from '../value-objects';

export const APPEARANCE_SETTINGS: Record<string, SettingDefinition> = {
  'appearance.theme': {
    key: 'appearance.theme',
    name: '主题',
    description: '应用主题（亮色/暗色/自动）',
    category: SettingCategory.APPEARANCE,
    type: 'SELECT',
    defaultValue: 'auto',
    schema: z.enum(['light', 'dark', 'auto']),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.fontSize': {
    key: 'appearance.fontSize',
    name: '字号',
    description: '界面整体字号大小',
    category: SettingCategory.APPEARANCE,
    type: 'NUMBER',
    defaultValue: 14,
    schema: z.number().min(10).max(18),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.compactMode': {
    key: 'appearance.compactMode',
    name: '紧凑模式',
    description: '使用更紧凑的布局',
    category: SettingCategory.APPEARANCE,
    type: 'BOOLEAN',
    defaultValue: false,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.accentColor': {
    key: 'appearance.accentColor',
    name: '强调颜色',
    description: '应用强调色（Hex 格式）',
    category: SettingCategory.APPEARANCE,
    type: 'STRING',
    defaultValue: '#0066ff',
    schema: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.fontFamily': {
    key: 'appearance.fontFamily',
    name: '字体',
    description: '应用字体族',
    category: SettingCategory.APPEARANCE,
    type: 'STRING',
    defaultValue: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    schema: z.string().min(1),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>;
