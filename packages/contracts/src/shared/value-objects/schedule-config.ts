import type { TransferDate, DomainDate, PersistenceDate } from '../../primitives';

/**
 * 通用的任务队列配置接口
 * 暴露给 Task、Goal 等需要定时任务功能的模块使用
 * 也作为 ScheduleConfig 类型的基础接口
 */

/**
 * [Value Object] 调度配置
 * 描述 "什么时候" 触发
 */
export interface ScheduleConfig {
  // 模式：固定时间点 vs Cron 周期
  mode: ScheduleMode;
  datetime?: DomainDate; // ISO String (for FIXED)
  cronExpression?: string; // (for CRON)
  timezone?: string; // 时区 (非常重要)
}
export interface ScheduleConfigDTO {
  // 模式：固定时间点 vs Cron 周期
  mode: ScheduleMode;

  // 具体的触发值
  datetime?: TransferDate; // ISO String (for FIXED)
  cronExpression?: string; // (for CRON)

  // 时区 (非常重要)
  timezone?: string;
}

export interface ScheduleConfigPersistenceDTO {
  // 模式：固定时间点 vs Cron 周期
  mode: ScheduleMode;

  // 具体的触发值
  datetime?: PersistenceDate; // ISO String (for FIXED)
  cronExpression?: string; // (for CRON)

  // 时区 (非常重要)
  timezone?: string;
}

export const ScheduleMode = {
  Fixed: 'Fixed',
  Cron: 'Cron',
} as const;

export type ScheduleMode = (typeof ScheduleMode)[keyof typeof ScheduleMode];
