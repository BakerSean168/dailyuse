import { z } from 'zod';
import type { SettingCategory } from './setting-category';
import type { SettingValueType } from './setting-value-type';
import type { UIInputType } from './ui-input-type';

export const SettingScope = {
  User: 'User',
  Device: 'Device',
  System: 'System',
} as const;

export type SettingScope = (typeof SettingScope)[keyof typeof SettingScope];

export interface SettingDefinition<T = unknown> {
  key: string;
  name: string;
  description?: string;
  category: SettingCategory;
  type: SettingValueType;
  uiInputType?: UIInputType; // UI 输入组件类型（如 Select, Slider 等）
  defaultValue: T;

  // ✅ 核心验证逻辑：在定义处嵌入 Zod Schema
  schema: z.ZodType;

  // 行为配置
  isSyncable: boolean; // 是否同步到云端
  isReadOnly?: boolean; // 是否只读
  isEncrypted?: boolean; // 是否加密存储
  scope: SettingScope; // 作用域
}

export interface SettingDefinitionDTO {
  key: string;
  category: SettingCategory;
  defaultValue: unknown;
  isSyncable: boolean;
  description?: string;
}

