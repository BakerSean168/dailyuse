import { describe, expect, it } from 'vitest';
import {
  calculateGoalPriority,
  calculateGoalPriorityDetailed,
  comparePriority,
  mapPriorityToLevel,
  mapPriorityToText,
} from './goal-priority-calculator';

describe('goal-priority-calculator', () => {
  it('exposes consistent priority wrapper functions', () => {
    const now = new Date('2026-04-26T00:00:00.000Z');
    const targetDate = new Date('2026-04-28T00:00:00.000Z');

    const score = calculateGoalPriority('Important', targetDate, now);
    const detailed = calculateGoalPriorityDetailed('Important', targetDate, now);

    expect(detailed.score).toBe(score);
    expect(mapPriorityToLevel(score)).toBe(detailed.level);
    expect(mapPriorityToText(score)).toBeTruthy();
    expect(comparePriority(score + 1, score)).toBeLessThan(0);
    expect(comparePriority(score, score + 1)).toBeGreaterThan(0);
    expect(comparePriority(score, score)).toBe(0);
  });

  it('handles undated and overdue goals through the shared calculator', () => {
    const now = new Date('2026-04-26T00:00:00.000Z');
    const undated = calculateGoalPriority('Moderate', null, now);
    const overdue = calculateGoalPriority('Vital', new Date('2026-04-20T00:00:00.000Z'), now);

    expect(overdue).toBeGreaterThan(undated);
    expect(mapPriorityToLevel(overdue)).toMatch(/Critical|High|Medium|Low/);
    expect(mapPriorityToText(undated)).toBeTruthy();
  });
});
