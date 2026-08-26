import { describe, expect, it } from 'vitest';
import { calculateKeyResultProgress } from './key-result-progress-calculator';

describe('GOAL-2102 canonical KR measurement calculator', () => {
  it('uses natural zero for graduation-style absolute progress', () => {
    const result = calculateKeyResultProgress({
      startingValue: 40,
      currentValue: 40,
      targetValue: 50,
      progressBaselineValue: null,
      aggregationMethod: 'Last',
    });
    expect(result.currentValue).toBe(40);
    expect(result.percentage).toBe(80);
    expect(result.isCompleted).toBe(false);
    expect(result.direction).toBe('increasing');
  });

  it('aggregates running contributions from startingValue with Sum', () => {
    const result = calculateKeyResultProgress(
      {
        startingValue: 0,
        currentValue: 0,
        targetValue: 100,
        progressBaselineValue: null,
        aggregationMethod: 'Sum',
      },
      [25, 30, 45],
    );
    expect(result.currentValue).toBe(100);
    expect(result.percentage).toBe(100);
    expect(result.isCompleted).toBe(true);
  });

  it('supports decreasing direction only through an explicit baseline', () => {
    const result = calculateKeyResultProgress({
      startingValue: 80,
      currentValue: 73,
      targetValue: 70,
      progressBaselineValue: 75,
      aggregationMethod: 'Last',
    });
    expect(result.currentValue).toBe(73);
    expect(result.percentage).toBe(40);
    expect(result.direction).toBe('decreasing');
    expect(result.isCompleted).toBe(false);

    expect(() =>
      calculateKeyResultProgress({
        startingValue: 80,
        currentValue: 73,
        targetValue: 70,
        progressBaselineValue: null,
        aggregationMethod: 'Last',
      }),
    ).toThrow('progressBaselineValue is required for a decreasing target');
  });

  it.each([
    ['Average', [7, 8, 9], 8],
    ['Max', [7, 8, 9], 9],
    ['Min', [7, 8, 9], 7],
    ['Last', [7, 8, 9], 9],
  ] as const)(
    'aggregates %s records and falls back to startingValue when empty',
    (method, records, expected) => {
      const input = {
        startingValue: 6,
        currentValue: 6,
        targetValue: 10,
        progressBaselineValue: null,
        aggregationMethod: method,
      };
      expect(calculateKeyResultProgress(input, [...records]).currentValue).toBe(expected);
      expect(calculateKeyResultProgress(input, []).currentValue).toBe(6);
    },
  );

  it('clamps percentage to 0..100 without changing authoritative currentValue', () => {
    expect(
      calculateKeyResultProgress({
        startingValue: 0,
        currentValue: 120,
        targetValue: 100,
        progressBaselineValue: null,
        aggregationMethod: 'Last',
      }),
    ).toMatchObject({ currentValue: 120, percentage: 100, isCompleted: true });

    expect(
      calculateKeyResultProgress({
        startingValue: 80,
        currentValue: 77,
        targetValue: 70,
        progressBaselineValue: 75,
        aggregationMethod: 'Last',
      }),
    ).toMatchObject({ currentValue: 77, percentage: 0, direction: 'decreasing' });
  });

  it('rejects an undefined natural-zero percentage when target is zero', () => {
    expect(() =>
      calculateKeyResultProgress({
        startingValue: 0,
        currentValue: 0,
        targetValue: 0,
        progressBaselineValue: null,
        aggregationMethod: 'Last',
      }),
    ).toThrow('progressBaselineValue is required when targetValue is zero');
  });
});
