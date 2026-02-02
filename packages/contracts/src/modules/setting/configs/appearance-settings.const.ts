/**
 * 外观设置 (APPEARANCE) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema，自带完整的验证逻辑
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory, SettingValueType, UIInputType } from '../value-objects';

export const APPEARANCE_SETTINGS = {
  'appearance.theme': {
    key: 'appearance.theme',
    name: '主题',
    description: '应用主题（亮色/暗色/自动）',
    category: SettingCategory.Appearance,
    type: SettingValueType.String,
    uiInputType: UIInputType.Select,
    defaultValue: 'auto',
    schema: z.enum(['light', 'dark', 'auto']),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.fontSize': {
    key: 'appearance.fontSize',
    name: '字号',
    description: '界面整体字号大小',
    category: SettingCategory.Appearance,
    type: SettingValueType.Number,
    uiInputType: UIInputType.Slider,
    defaultValue: 14,
    schema: z.number().min(10).max(18),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.compactMode': {
    key: 'appearance.compactMode',
    name: '紧凑模式',
    description: '使用更紧凑的布局',
    category: SettingCategory.Appearance,
    type: SettingValueType.Boolean,
    uiInputType: UIInputType.Switch,
    defaultValue: false,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.accentColor': {
    key: 'appearance.accentColor',
    name: '强调颜色',
    description: '应用强调色（Hex 格式）',
    category: SettingCategory.Appearance,
    type: SettingValueType.String,
    uiInputType: UIInputType.Color,
    defaultValue: '#0066ff',
    schema: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
    isSyncable: true,
    scope: 'USER',
  },

  'appearance.fontFamily': {
    key: 'appearance.fontFamily',
    name: '字体',
    description: '应用字体族',
    category: SettingCategory.Appearance,
    type: SettingValueType.String,
    uiInputType: UIInputType.Text,
    defaultValue: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    schema: z.string().min(1),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>;
