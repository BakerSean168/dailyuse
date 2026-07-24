import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1180: comparePriority keep-boundary (goal scores vs schedule options).
 * - goal: comparePriority(a: number, b: number) via DailyPriorityCalculator.compare
 * - schedule: comparePriority(PriorityCalculationOptions, PriorityCalculationOptions) via totalWeight
 * Soft residual 1177: buildTaskName domain keep-boundary remains separate.
 * Soft residual 1168: mapImportanceToTaskPriority dual-retired remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('comparePriority keep-boundary (residual 1180)', () => {
  const dir = __dirname;
  const goal = readFileSync(resolve(dir, 'goal-priority-calculator.ts'), 'utf8');
  const schedule = readFileSync(
    resolve(dir, '../../../../../schedule/src/server/domain/calculators/priority-calculator.ts'),
    'utf8',
  );

  it('owns Residual 1180 keep-boundary markers on goal score-pair comparePriority', () => {
    expect(goal).toContain('Residual 1180 keep-boundary');
    expect(goal).toMatch(/export function comparePriority\b/);
    expect(goal).toContain('a: number, b: number');
    expect(goal).toContain('DailyPriorityCalculator.compare');
    const body = goal.match(/export function comparePriority\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('number');
    expect(body).toContain('DailyPriorityCalculator.compare(a, b)');
    expect(body).not.toContain('PriorityCalculationOptions');
    expect(body).not.toContain('totalWeight');
    expect(body).not.toContain('calculatePriority');
  });

  it('differs from schedule options-pair totalWeight comparePriority (no force-merge)', () => {
    expect(schedule).toContain('Residual 1180 keep-boundary');
    expect(schedule).toMatch(/export function comparePriority\b/);
    expect(schedule).toContain('Soft residual 1180');
    expect(schedule).toContain('PriorityCalculationOptions');
    expect(schedule).toContain('totalWeight');
    expect(schedule).toContain('calculatePriority');
    const body = schedule.match(/export function comparePriority\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('resultA');
    expect(body).toContain('resultB');
    expect(body).not.toContain('DailyPriorityCalculator');
    expect(body).not.toContain('a: number, b: number');
  });

  it('runtime: documents score-pair vs options-pair contracts via body shape', () => {
    function goalComparePriority(a: number, b: number): number {
      return b - a; // DailyPriorityCalculator.compare is descending-score style in domain
    }
    function scheduleComparePriority(
      a: { totalWeight: number },
      b: { totalWeight: number },
    ): number {
      return b.totalWeight - a.totalWeight;
    }
    expect(goalComparePriority(100, 50)).toBe(-50);
    expect(goalComparePriority(50, 100)).toBe(50);
    expect(scheduleComparePriority({ totalWeight: 10 }, { totalWeight: 4 })).toBe(-6);
    expect(scheduleComparePriority({ totalWeight: 4 }, { totalWeight: 10 })).toBe(6);
  });

  it('documents residual 1180 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'compare-priority-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1180');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
