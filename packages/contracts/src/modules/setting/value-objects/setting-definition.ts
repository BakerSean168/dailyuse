import { z } from 'zod';
import type { SettingCategory } from './setting-category';
import type { SettingValueType } from './setting-value-type';

export interface SettingDefinition<T = any> {
  key: string;
  name: string;
  description?: string;
  category: SettingCategory;
  type: SettingValueType;
  defaultValue: T;

  // ✅ 核心验证逻辑：在定义处嵌入 Zod Schema
  schema: z.ZodType;

  // 行为配置
  isSyncable: boolean; // 是否同步到云端
  isReadOnly?: boolean; // 是否只读
  isEncrypted?: boolean; // 是否加密存储
  scope: 'USER' | 'DEVICE' | 'SYSTEM'; // 作用域
}

export interface SettingDefinitionDTO {
  key: string;
  category: SettingCategory;
  defaultValue: any;
  isSyncable: boolean;
  description?: string;
}

export interface SettingDefinitionPersistenceDTO {
  key: string;
  category: SettingCategory;
  defaultValue: string; // JSON string
  isSyncable: boolean;
  description?: string;
}