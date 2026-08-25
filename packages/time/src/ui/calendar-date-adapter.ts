import { CalendarDate, Time } from '@internationalized/date';
import type { Hm, Ymd } from '../types';
import { asHm, asYmd, isHmShape, isYmdShape } from '../codec/brand';

/** UI-only third-party boundary. Product/domain contracts continue to use Ymd. */
export function calendarDateValueToYmd(value: CalendarDate): Ymd {
  const raw = `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
  if (!isYmdShape(raw)) {
    throw new TypeError(`Invalid CalendarDate value: ${raw}`);
  }
  return asYmd(raw);
}

export function ymdToCalendarDateValue(value: Ymd): CalendarDate {
  if (!isYmdShape(value)) {
    throw new TypeError(`Invalid Ymd: ${value}`);
  }
  const [year, month, day] = value.split('-').map(Number);
  return new CalendarDate(year, month, day);
}

/** UI-only third-party boundary. Product/domain contracts continue to use Hm. */
export function timeValueToHm(value: Time): Hm {
  const raw = `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
  if (!isHmShape(raw)) {
    throw new TypeError(`Invalid Time value: ${raw}`);
  }
  return asHm(raw);
}

export function hmToTimeValue(value: Hm): Time {
  if (!isHmShape(value)) {
    throw new TypeError(`Invalid Hm: ${value}`);
  }
  const [hour, minute] = value.split(':').map(Number);
  return new Time(hour, minute);
}
