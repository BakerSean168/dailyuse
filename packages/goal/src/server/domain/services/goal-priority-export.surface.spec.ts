import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 239: goal priority types are single-track from domain/priority.
 * goal-priority-calculator does not dual-alias or convenience re-export them.
 */
describe('goal priority type export single-track surface', () => {
  const servicesDir = __dirname;
  const domainDir = resolve(servicesDir, '..');
  const calculator = readFileSync(resolve(servicesDir, 'goal-priority-calculator.ts'), 'utf8');
  const domainIndex = readFileSync(resolve(domainDir, 'index.ts'), 'utf8');
  const priorityIndex = readFileSync(resolve(domainDir, 'priority/index.ts'), 'utf8');

  it('calculator imports priority types without re-export dual or GoalPriorityLevel alias', () => {
    expect(calculator).toContain("from '../priority'");
    expect(calculator).toContain('PriorityLevel');
    expect(calculator).toContain('PriorityCalculationResult');
    expect(calculator).not.toContain('Re-export types for convenience');
    expect(calculator).not.toContain('export type { PriorityLevel, PriorityCalculationResult }');
    expect(calculator).not.toContain('export type GoalPriorityLevel');
    expect(calculator).not.toMatch(/\bGoalPriorityLevel\b/);
  });

  it('domain index exports priority types from ./priority only', () => {
    expect(domainIndex).toContain("from './priority'");
    expect(domainIndex).toContain('PriorityLevel');
    expect(domainIndex).toContain('PriorityCalculationResult');
    expect(domainIndex).toContain('DailyPriorityCalculator');
    expect(domainIndex).not.toContain("from './daily-priority-calculator'");
  });

  it('priority module owns DailyPriorityCalculator type surface', () => {
    expect(priorityIndex).toContain('DailyPriorityCalculator');
    expect(priorityIndex).toContain('PriorityLevel');
    expect(priorityIndex).toContain('PriorityCalculationResult');
  });
});
