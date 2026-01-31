/**
 * 日程视图类型
 */
export const ScheduleViewType = {
  Day: 'Day',
  Week: 'Week',
  Month: 'Month',
} as const;

export type ScheduleViewType = (typeof ScheduleViewType)[keyof typeof ScheduleViewType];
