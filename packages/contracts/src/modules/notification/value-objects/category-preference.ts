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
 * CategoryPreference 接口
 */
export interface CategoryPreference {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[]; // 高、中、低优先级
}

// ============ DTO 定义 ============

/**
 * CategoryPreference DTO (传输层)
 */
export interface CategoryPreferenceDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
}

