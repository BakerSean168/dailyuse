/**
 * 时间格式
 */
export const TimeFormat = {
  H12: 'H12',
  H24: 'H24',
} as const;

export type TimeFormat = (typeof TimeFormat)[keyof typeof TimeFormat];
