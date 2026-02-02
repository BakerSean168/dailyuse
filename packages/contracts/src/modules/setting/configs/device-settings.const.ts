/**
 * 设备设置 (DEVICE) - 常量定义
 * 注意：设备设置是本地专用，不同步到云端
 * ✅ 每个配置项嵌入 Zod Schema
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory, SettingValueType, UIInputType } from '../value-objects';

export const DEVICE_SETTINGS = {
  'device.windowWidth': {
    key: 'device.windowWidth',
    name: '窗口宽度',
    description: '应用窗口宽度（像素）',
    category: SettingCategory.System,
    type: SettingValueType.Number,
    uiInputType: UIInputType.Slider,
    defaultValue: 1200,
    schema: z.number().min(800).max(3840),
    isSyncable: false,
    scope: 'DEVICE',
  },

  'device.windowHeight': {
    key: 'device.windowHeight',
    name: '窗口高度',
    description: '应用窗口高度（像素）',
    category: SettingCategory.System,
    type: SettingValueType.Number,
    uiInputType: UIInputType.Slider,
    defaultValue: 800,
    schema: z.number().min(600).max(2160),
    isSyncable: false,
    scope: 'DEVICE',
  },

  'device.windowX': {
    key: 'device.windowX',
    name: '窗口 X 位置',
    description: '应用窗口 X 坐标',
    category: SettingCategory.System,
    type: SettingValueType.Number,
    uiInputType: UIInputType.Number,
    defaultValue: 0,
    schema: z.number().min(-3840).max(3840),
    isSyncable: false,
    scope: 'DEVICE',
  },

  'device.windowY': {
    key: 'device.windowY',
    name: '窗口 Y 位置',
    description: '应用窗口 Y 坐标',
    category: SettingCategory.System,
    type: SettingValueType.Number,
    uiInputType: UIInputType.Number,
    defaultValue: 0,
    schema: z.number().min(-2160).max(2160),
    isSyncable: false,
    scope: 'DEVICE',
  },

  'device.lastOpenedRepository': {
    key: 'device.lastOpenedRepository',
    name: '上次打开的仓库',
    description: '最后打开的仓库 ID',
    category: SettingCategory.Repository,
    type: SettingValueType.String,
    uiInputType: UIInputType.Text,
    defaultValue: null,
    schema: z.string().uuid().nullable(),
    isSyncable: false,
    scope: 'DEVICE',
  },

  'device.sidebarCollapsed': {
    key: 'device.sidebarCollapsed',
    name: '侧边栏状态',
    description: '侧边栏是否折叠',
    category: SettingCategory.System,
    type: SettingValueType.Boolean,
    uiInputType: UIInputType.Switch,
    defaultValue: false,
    schema: z.boolean(),
    isSyncable: false,
    scope: 'DEVICE',
  },
} as const satisfies Record<string, SettingDefinition>
