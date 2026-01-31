/**
 * 配额重置周期
 */
export const QuotaResetPeriod = {
  Daily: 'Daily',
  Weekly: 'Weekly',
  Monthly: 'Monthly',
} as const;

export type QuotaResetPeriod = (typeof QuotaResetPeriod)[keyof typeof QuotaResetPeriod];
