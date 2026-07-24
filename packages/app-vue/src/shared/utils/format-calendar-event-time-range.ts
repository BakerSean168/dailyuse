/**
 * Residual 1273: sole formatCalendarEventTimeRange — CalendarEventItem-like range.
 * all-day → provided label; else local HH:mm – HH:mm (en-dash, padStart).
 * Dual-retired from DayDetailSheet + TaskEventActionPanel (identical vue shape).
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
  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  return `${fmt(event.startTime)} – ${fmt(event.endTime)}`;
}
