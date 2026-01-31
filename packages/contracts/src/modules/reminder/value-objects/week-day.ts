/**
 * 星期
 */
export const WeekDay = {
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  Sunday: 'Sunday',
} as const;

export type WeekDay = (typeof WeekDay)[keyof typeof WeekDay];
