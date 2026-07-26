import type { PartialTimeStyle, TimeStyle } from '../types';

export const DEFAULT_TIME_STYLE: TimeStyle = Object.freeze({
  locale: 'zh-CN',
  timeZone: 'local',
  calendar: Object.freeze({
    dayBoundary: 'local-midnight',
    weekStartsOn: 1,
  }),
  empty: Object.freeze({
    display: '—',
    input: '',
    unknown: '—',
  }),
  display: Object.freeze({
    date: 'medium',
    dateTime: 'medium',
    hm: 'HH:mm',
    periodDay: 'EEEE, yyyy MMMM d',
    periodMonth: 'yyyy MMMM',
    periodWeekDay: 'EEEE',
    chartMonthDay: 'MMM d',
  }),
  relative: Object.freeze({
    enabled: true,
    maxAgeMs: 7 * 24 * 60 * 60 * 1000,
    numeric: 'auto',
  }),
  duration: Object.freeze({
    style: 'narrow',
    zero: '0m',
  }),
}) as TimeStyle;

export function mergeTimeStyle(
  base: TimeStyle,
  partial?: PartialTimeStyle | null,
): TimeStyle {
  if (!partial) return base;
  return {
    locale: partial.locale ?? base.locale,
    timeZone: partial.timeZone ?? base.timeZone,
    calendar: { ...base.calendar, ...partial.calendar },
    empty: { ...base.empty, ...partial.empty },
    display: { ...base.display, ...partial.display },
    relative: { ...base.relative, ...partial.relative },
    duration: { ...base.duration, ...partial.duration },
  };
}
