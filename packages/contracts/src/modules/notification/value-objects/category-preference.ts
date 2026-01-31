/**
 * CategoryPreference Value Object
 * 分类偏好值对象
 */
import type { ImportanceLevel } from '../../../shared/index';

// ============ 共享类型定义 ============

/**
 * 渠道偏好配置
 */
export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ 接口定义 ============

/**
 * CategoryPreference Server Interface
 */
export interface ICategoryPreference {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[]; // 高、中、低优先级

  // 值对象方法
  with(
    updates: Partial<
      Omit<
        ICategoryPreference,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ICategoryPreference;

  // DTO 转换方法
}

/**
 * CategoryPreference Client Interface
 */
export interface ICategoryPreferenceClient {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];

  // UI 计算属性
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["站内信", "邮件"]
  importanceText: string; // "高优先级, 中优先级"

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * CategoryPreference DTO (Server)
 */
export interface CategoryPreferenceDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
}

/**
 * CategoryPreference Client DTO
 */
export interface CategoryPreferenceClientDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  importanceText: string;
}

/**
 * CategoryPreference Persistence DTO
 */
export interface CategoryPreferencePersistenceDTO {
  enabled: boolean;
  channels: string; // JSON.stringify(ChannelPreference)
  importance: string; // JSON.stringify(ImportanceLevel[])
}

// ============ 实现类型 ============

export type CategoryPreference = ICategoryPreference;
export type CategoryPreferenceClient = ICategoryPreferenceClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use CategoryPreferenceDTO instead
 */
export type CategoryPreferenceServerDTO = CategoryPreferenceDTO;

/**
 * @deprecated Use ICategoryPreference instead
 */
export type ICategoryPreferenceServer = ICategoryPreference;

/**
 * @deprecated Use CategoryPreference instead
 */
export type CategoryPreferenceServer = CategoryPreference;
