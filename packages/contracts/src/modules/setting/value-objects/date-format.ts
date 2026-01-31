/**
 * 日期格式
 */
export const DateFormat = {
  YyyyMmDd: 'YyyyMmDd',
  DdMmYyyy: 'DdMmYyyy',
  MmDdYyyy: 'MmDdYyyy',
} as const;

export type DateFormat = (typeof DateFormat)[keyof typeof DateFormat];
