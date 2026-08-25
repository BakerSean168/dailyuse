import { CalendarDate, Time } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { asHm, asYmd } from '../index';
import {
  calendarDateValueToYmd,
  hmToTimeValue,
  timeValueToHm,
  ymdToCalendarDateValue,
} from '../ui/calendar-date-adapter';

describe('@memoflow/time UI date conversion boundary (TIME-1101)', () => {
  it('round-trips Ymd through @internationalized/date CalendarDate', () => {
    const productDate = asYmd('2028-02-29');
    const uiDate = ymdToCalendarDateValue(productDate);

    expect(uiDate).toBeInstanceOf(CalendarDate);
    expect(uiDate.toString()).toBe('2028-02-29');
    expect(calendarDateValueToYmd(uiDate)).toBe(productDate);
  });

  it('round-trips Hm through @internationalized/date Time without widening product semantics', () => {
    const productTime = asHm('23:07');
    const uiTime = hmToTimeValue(productTime);

    expect(uiTime).toBeInstanceOf(Time);
    expect(uiTime.hour).toBe(23);
    expect(uiTime.minute).toBe(7);
    expect(timeValueToHm(uiTime)).toBe(productTime);
  });
});
