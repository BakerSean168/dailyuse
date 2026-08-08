import { describe, expect, it } from 'vitest';
import { Habit, calculateStreak, startOfLocalDay } from '../habit';

const DAY = 86_400_000;

describe('calculateStreak (R4 Habit)', () => {
  it('returns zero streak for no completions', () => {
    expect(calculateStreak([], Date.now())).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastCheckInDate: null,
    });
  });

  it('counts consecutive completed days', () => {
    const base = startOfLocalDay(Date.now());
    const completed = [base, base - DAY, base - 2 * DAY];
    const streak = calculateStreak(completed, base);
    expect(streak.currentStreak).toBe(3);
    expect(streak.longestStreak).toBe(3);
    expect(streak.lastCheckInDate).toBe(base);
  });

  it('breaks current streak on a gap but keeps longest', () => {
    const base = startOfLocalDay(Date.now());
    const completed = [base, base - 2 * DAY, base - 3 * DAY, base - 4 * DAY];
    const streak = calculateStreak(completed, base);
    expect(streak.currentStreak).toBe(1); // 昨天没完成 → 断了
    expect(streak.longestStreak).toBe(3);
  });

  it('breaks the current streak when the last completion is older than yesterday', () => {
    const base = startOfLocalDay(Date.now());
    const completed = [base - 2 * DAY, base - 3 * DAY, base - 4 * DAY];
    const streak = calculateStreak(completed, base);
    expect(streak.currentStreak).toBe(0); // 昨天与今天均未完成
    expect(streak.longestStreak).toBe(3);
  });

  it('counts from yesterday when today is not yet completed', () => {
    const base = startOfLocalDay(Date.now());
    const completed = [base - DAY, base - 2 * DAY, base - 3 * DAY];
    const streak = calculateStreak(completed, base);
    expect(streak.currentStreak).toBe(3); // 今天未完成不算断
    expect(streak.longestStreak).toBe(3);
  });

  it('deduplicates same-day completions', () => {
    const base = startOfLocalDay(Date.now());
    const streak = calculateStreak([base, base, base - DAY], base);
    expect(streak.currentStreak).toBe(2);
  });
});

describe('Habit aggregate', () => {
  it('creates occurrences idempotently for a date range', () => {
    const now = Date.now();
    const habit = Habit.create({ identityId: 'u1', name: '早睡' });
    const first = habit.ensureOccurrences(now, now + DAY, now);
    const second = habit.ensureOccurrences(now, now + DAY, now);

    expect(first.length).toBe(2);
    expect(second.length).toBe(0); // 幂等
    expect(habit.occurrences.length).toBe(2);
  });

  it('check-in completes an occurrence and advances the streak', () => {
    const now = Date.now();
    const habit = Habit.create({ identityId: 'u1', name: '跑步' });
    habit.ensureOccurrences(now, now, now);
    const streak = habit.checkIn(now, now);

    expect(streak.currentStreak).toBe(1);
    expect(habit.occurrences[0].status).toBe('Completed');
  });

  it('throws when checking in a missing occurrence', () => {
    const habit = Habit.create({ identityId: 'u1', name: '冥想' });
    expect(() => habit.checkIn(Date.now(), Date.now())).toThrow(/No occurrence/);
  });
});
