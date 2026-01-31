/**
 * 触发器类型
 */
export const TriggerType = {
  FixedTime: 'FixedTime', // 固定时间
  Interval: 'Interval', // 间隔时间
} as const;

export type TriggerType = (typeof TriggerType)[keyof typeof TriggerType];
