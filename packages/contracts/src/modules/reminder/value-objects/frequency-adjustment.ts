/**
 * Frequency Adjustment Value Object
 * 频率调整值对象
 */

// ============ DTO 定义 ============

/**
 * Frequency Adjustment DTO
 * 提醒频率调整记录
 */
export interface FrequencyAdjustmentDTO {
  readonly originalInterval: number; // 原始间隔（秒）
  readonly adjustedInterval: number; // 调整后间隔（秒）
  readonly adjustmentReason: string; // 调整原因
  readonly adjustmentTime: number; // 调整时间 (epoch ms)
  readonly isAutoAdjusted: boolean; // 是否自动调整
  readonly userConfirmed: boolean; // 用户是否确认
  readonly rejectionReason?: string | null; // 拒绝原因（如果用户拒绝）
}

// ============ 实体接口 ============

/**
 * Frequency Adjustment 值对象接口
 */
export interface FrequencyAdjustment {
  readonly originalInterval: number;
  readonly adjustedInterval: number;
  readonly adjustmentReason: string;
  readonly adjustmentTime: number;
  readonly isAutoAdjusted: boolean;
  readonly userConfirmed: boolean;
  readonly rejectionReason?: string | null;
}
