/**
 * 时间类型
 */
export const TimeType = {
  AllDay: 'AllDay', // 全天任务
  TimePoint: 'TimePoint', // 时间点任务
  TimeRange: 'TimeRange', // 时间段任务
} as const;

export type TimeType = (typeof TimeType)[keyof typeof TimeType];
