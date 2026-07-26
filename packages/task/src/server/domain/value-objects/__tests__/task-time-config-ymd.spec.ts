import { describe, expect, it } from 'vitest';
import { TaskTimeConfig } from '../task-time-config';

describe('TaskTimeConfig ADR-037 Instant + startDay Ymd', () => {
  it('exposes Instant startDate and Ymd startDay for all-day', () => {
    const localMidnight = new Date(2026, 6, 26, 0, 0, 0, 0).getTime();
    const config = TaskTimeConfig.createAllDay(localMidnight);
    expect(config.startDate).toBe(localMidnight);
    expect(config.startDay).toBe('2026-07-26');
    expect(config.isAllDay).toBe(true);
  });

  it('setStartDate accepts Instant without Date wrapper', () => {
    const ms = new Date(2026, 0, 15, 0, 0, 0, 0).getTime();
    const config = TaskTimeConfig.createAllDay(ms).setStartDate(ms);
    expect(config.startDate).toBe(ms);
    expect(config.startDay).toBe('2026-01-15');
  });
});
