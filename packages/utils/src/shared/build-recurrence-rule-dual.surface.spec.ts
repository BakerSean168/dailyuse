import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildRecurrenceRule } from './build-recurrence-rule';

/**
 * Residual 1015: buildRecurrenceRule dual retired (API + Desktop automation).
 * Sole body in @dailyuse/utils/shared/build-recurrence-rule.
 * Soft residual 1028: tip focused suite numbers track Residual 1028 evidence tip (304/1319).
 * Soft residual 1013: buildReminderTemplateInput dual retired.
 * Does not flip §13.2 checkboxes.
 */
describe('buildRecurrenceRule dual retired (residual 1015)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'build-recurrence-rule.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const api = readFileSync(
    resolve(
      sharedDir,
      '../../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts',
    ),
    'utf8',
  );
  const desktop = readFileSync(
    resolve(
      sharedDir,
      '../../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts',
    ),
    'utf8',
  );

  it('owns sole buildRecurrenceRule helper body and shared barrel export', () => {
    expect(sole).toContain('Residual 1015');
    expect(sole).toMatch(/export function buildRecurrenceRule\b/);
    expect(sole).toContain("FREQUENCY_WEEKLY = 'Weekly'");
    expect(sole).toContain("FREQUENCY_DAILY = 'Daily'");
    expect(sole).toContain('now.getDay()');
    expect(index).toContain("export * from './build-recurrence-rule'");
  });

  it('API + Desktop automation executors import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['api', api],
      ['desktop', desktop],
    ] as const) {
      expect(source, label).toContain('Residual 1015');
      expect(source, label).toContain("from '@dailyuse/utils/shared'");
      expect(source, label).toMatch(/buildRecurrenceRule/);
      expect(source, label).not.toMatch(/function buildRecurrenceRule\b/);
      expect(source, label).not.toMatch(/private buildRecurrenceRule\b/);
      expect(source, label).toContain('buildRecurrenceRule(taskTemplate.cadence)');
      expect(source, label).not.toContain('this.buildRecurrenceRule');
    }
  });

  it('adapters drop local DayOfWeek/RecurrenceFrequency dual usage for recurrence build', () => {
    for (const [label, source] of [
      ['api', api],
      ['desktop', desktop],
    ] as const) {
      expect(source, label).not.toMatch(/RecurrenceFrequency\.Weekly/);
      expect(source, label).not.toMatch(/RecurrenceFrequency\.Daily/);
      expect(source, label).not.toMatch(/DayOfWeek/);
    }
  });

  it('maps once/daily/weekly cadences onto recurrence config | null', () => {
    expect(buildRecurrenceRule('once')).toBeNull();

    const fixed = new Date('2026-07-23T12:00:00.000Z');
    const weekly = buildRecurrenceRule('weekly', fixed);
    expect(weekly?.frequency).toBe('Weekly');
    expect(weekly?.interval).toBe(1);
    expect(weekly?.daysOfWeek).toEqual([fixed.getDay()]);
    expect(weekly?.endDate).toBeNull();
    expect(weekly?.occurrences).toBeNull();

    const daily = buildRecurrenceRule('daily', fixed);
    expect(daily?.frequency).toBe('Daily');
    expect(daily?.interval).toBe(1);
    expect(daily?.daysOfWeek).toEqual([]);
  });
});
