import { formatLocalHHmm } from './format-local-hhmm';

/**
 * Residual 1273: sole formatCalendarEventTimeRange — CalendarEventItem-like range.
 * all-day → provided label; else local HH:mm – HH:mm (en-dash).
 * Dual-retired from DayDetailSheet + TaskEventActionPanel (identical vue shape).
 * Residual 1300 soft → Residual 1303: inner HH:mm dual retired onto formatLocalHHmm sole
 * (en-dash range contract stays local; Day/Week formatEventTime separator keep-boundary remains).
 * Soft residual 1213 / 1273: app-react useScheduleAgenda Intl zh-CN pair keep-boundary remains separate.
 */
export function formatCalendarEventTimeRange(
  event: {
    displayMode?: string;
    startTime: number;
    endTime: number;
  },
  allDayLabel: string,
): string {
  if (event.displayMode === 'all-day') {
    return allDayLabel;
  }
  return `${formatLocalHHmm(event.startTime)} – ${formatLocalHHmm(event.endTime)}`;
}
