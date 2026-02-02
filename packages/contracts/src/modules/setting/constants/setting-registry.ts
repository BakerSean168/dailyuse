/**
 * Setting Registry - 配置项注册表
 * 这是系统的"单源事实"，定义了所有合法的设置项及其验证规则
 * 
 * 核心原则：
 * 1. 所有配置项都必须在这里注册
 * 2. 每个配置项包含：类型、默认值、校验规则、分类、是否云端同步
 * 3. 不允许硬编码 Key 字符串在业务代码中
 * 
 * 架构：按 category 分离配置定义在各个文件中，在此统一合并
 */

import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import {
  APPEARANCE_SETTINGS,
  EDITOR_SETTINGS,
  TASK_SETTINGS,
  GOAL_SETTINGS,
  REPOSITORY_SETTINGS,
  NOTIFICATION_SETTINGS,
  SYSTEM_SETTINGS,
  DEVICE_SETTINGS,
} from './index';

/**
 * 配置注册表 - 合并所有按 category 分离的常量
 * ✅ 架构改进：Schema 已嵌入各定义中，无需动态生成
 */
export const SETTING_REGISTRY: Record<string, SettingDefinition> = {
  ...APPEARANCE_SETTINGS,
  ...EDITOR_SETTINGS,
  ...TASK_SETTINGS,
  ...GOAL_SETTINGS,
  ...REPOSITORY_SETTINGS,
  ...NOTIFICATION_SETTINGS,
  ...SYSTEM_SETTINGS,
  ...DEVICE_SETTINGS,
};

/**
 * 获取指定分类的所有设置项
 */
export function getSettingsByCategory(category: string): SettingDefinition[] {
  return Object.values(SETTING_REGISTRY).filter(s => s.category === category);
}

/**
 * 获取所有可同步的设置项
 */
export function getSyncableSettings(): SettingDefinition[] {
  return Object.values(SETTING_REGISTRY).filter(s => s.isSyncable);
}

/**
 * 获取所有本地专用的设置项（不同步到云端）
 */
export function getDeviceSettings(): SettingDefinition[] {
  return Object.values(SETTING_REGISTRY).filter(s => s.scope === 'DEVICE');
}

/**
 * 验证设置值是否有效
 * ✅ 直接使用定义中嵌入的 Zod Schema，无需动态生成
 * @param key 设置键名
 * @param value 要验证的值
 * @returns 验证结果，包含成功标志和错误信息
 */
export function validateSettingValue(
  key: string,
  value: any,
): { valid: boolean; error?: string } {
  const definition = SETTING_REGISTRY[key];

  if (!definition) {
    return { valid: false, error: `Unknown setting key: ${key}` };
  }

  const result = definition.schema.safeParse(value);
  
  if (result.success) {
    return { valid: true };
  }

  const errorMessages = result.error.errors.map(e => e.message).join('; ');
  return { valid: false, error: errorMessages };
}
