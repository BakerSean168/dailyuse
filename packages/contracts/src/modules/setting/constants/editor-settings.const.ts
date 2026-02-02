/**
 * 编辑器设置 (EDITOR) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory } from '../value-objects';

export const EDITOR_SETTINGS: Record<string, SettingDefinition> = {
  'editor.fontSize': {
    key: 'editor.fontSize',
    name: '编辑器字号',
    description: '编辑器代码字号',
    category: SettingCategory.EDITOR,
    type: 'NUMBER',
    defaultValue: 12,
    schema: z.number().min(8).max(24),
    isSyncable: true,
    scope: 'USER',
  },

  'editor.fontFamily': {
    key: 'editor.fontFamily',
    name: '编辑器字体',
    description: '代码编辑器字体',
    category: SettingCategory.EDITOR,
    type: 'STRING',
    defaultValue: '"JetBrains Mono", "Fira Code", monospace',
    schema: z.string().min(1),
    isSyncable: true,
    scope: 'USER',
  },

  'editor.lineHeight': {
    key: 'editor.lineHeight',
    name: '行高',
    description: '编辑器行高',
    category: SettingCategory.EDITOR,
    type: 'NUMBER',
    defaultValue: 1.6,
    schema: z.number().min(1).max(2.5),
    isSyncable: true,
    scope: 'USER',
  },

  'editor.tabSize': {
    key: 'editor.tabSize',
    name: '制表符大小',
    description: '一个制表符等于几个空格',
    category: SettingCategory.EDITOR,
    type: 'SELECT',
    defaultValue: 2,
    schema: z.enum([2, 4, 8]),
    isSyncable: true,
    scope: 'USER',
  },

  'editor.wordWrap': {
    key: 'editor.wordWrap',
    name: '自动换行',
    description: '编辑器内容是否自动换行',
    category: SettingCategory.EDITOR,
    type: 'BOOLEAN',
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'editor.lineNumbers': {
    key: 'editor.lineNumbers',
    name: '行号',
    description: '显示行号',
    category: SettingCategory.EDITOR,
    type: 'BOOLEAN',
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'editor.minimap': {
    key: 'editor.minimap',
    name: '小地图',
    description: '显示编辑器小地图',
    category: SettingCategory.EDITOR,
    type: 'BOOLEAN',
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'editor.autosaveInterval': {
    key: 'editor.autosaveInterval',
    name: '自动保存间隔',
    description: '自动保存间隔（秒）',
    category: SettingCategory.EDITOR,
    type: 'NUMBER',
    defaultValue: 30,
    schema: z.number().min(5).max(300),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>;
