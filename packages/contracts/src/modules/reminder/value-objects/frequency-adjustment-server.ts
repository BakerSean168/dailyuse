/**
 * Frequency Adjustment Value Object - Server
 * 频率调整值对象 - 服务端
 */

// ============ DTO 定义 ============

/**
 * Frequency Adjustment Server DTO
 * 提醒频率调整记录
 */
export interface FrequencyAdjustmentServerDTO {
  readonly originalInterval: number; // 原始间隔（秒）
  readonly adjustedInterval: number; // 调整后间隔（秒）
  readonly adjustmentReason: string; // 调整原因
  readonly adjustmentTime: number; // 调整时间 (epoch ms)
  readonly isAutoAdjusted: boolean; // 是否自动调整
  readonly userConfirmed: boolean; // 用户是否确认
  readonly rejectionReason?: string | null; // 拒绝原因（如果用户拒绝）
}

/**
 * Frequency Adjustment Client DTO
 */
export interface FrequencyAdjustmentClientDTO {
  readonly originalInterval: number;
  readonly adjustedInterval: number;
  readonly adjustmentReason: string;
  readonly adjustmentTime: number;
  readonly isAutoAdjusted: boolean;
  readonly userConfirmed: boolean;
  readonly rejectionReason?: string | null;
  // UI 显示文本
  readonly displayText: string; // "从每天1次调整为每2天1次"
  readonly changeRateText: string; // "频率降低50%"
  readonly statusText: string; // "已确认" | "待确认" | "已拒绝"
}

// ============ 实体接口 ============

/**
 * Frequency Adjustment 值对象接口
 */
export interface FrequencyAdjustmentServer {
  readonly originalInterval: number;
  readonly adjustedInterval: number;
  readonly adjustmentReason: string;
  readonly adjustmentTime: number;
  readonly isAutoAdjusted: boolean;
  readonly userConfirmed: boolean;
  readonly rejectionReason?: string | null;
}
