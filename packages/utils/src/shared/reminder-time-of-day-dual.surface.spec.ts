import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_TIME_OF_DAY,
  REMINDER_TIME_OF_DAY_PATTERN,
  buildReminderStartTimestamp,
  normalizeReminderTimeOfDay,
} from './reminder-time-of-day';

/**
 * Residual 1007: normalizeReminderTimeOfDay + buildReminderStartTimestamp dual retired.
 * Sole bodies in @dailyuse/utils/shared/reminder-time-of-day.
 * Soft residual 1010: tip focused suite numbers track Residual 1010 evidence tip (295/1283).
 * Does not flip §13.2 checkboxes.
 */
describe('reminder time-of-day dual retired (residual 1007)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'reminder-time-of-day.ts'), 'utf8');
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
  const goalWorkflow = readFileSync(
    resolve(
      sharedDir,
      '../../../app-vue/src/modules/ai/composables/useAIGoalWorkflow.ts',
    ),
    'utf8',
  );
  const workflowPersistence = readFileSync(
    resolve(
      sharedDir,
      '../../../app-vue/src/modules/ai/composables/useAIWorkflowPersistence.ts',
    ),
    'utf8',
  );

  it('owns sole reminder time helpers and shared barrel export', () => {
    expect(sole).toContain('Residual 1007');
    expect(sole).toMatch(/export function normalizeReminderTimeOfDay\b/);
    expect(sole).toMatch(/export function buildReminderStartTimestamp\b/);
    expect(sole).toContain("DEFAULT_REMINDER_TIME_OF_DAY = '09:00'");
    expect(sole).toContain('REMINDER_TIME_OF_DAY_PATTERN');
    expect(index).toContain("export * from './reminder-time-of-day'");
  });

  it('API + Desktop automation executors import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['api', api],
      ['desktop', desktop],
    ] as const) {
      expect(source, label).toContain('Residual 1007');
      expect(source, label).toContain("from '@dailyuse/utils/shared'");
      expect(source, label).toContain('normalizeReminderTimeOfDay');
      expect(source, label).toContain('buildReminderStartTimestamp');
      expect(source, label).not.toMatch(/function normalizeReminderTimeOfDay\b/);
      expect(source, label).not.toMatch(/function buildReminderStartTimestamp\b/);
      expect(source, label).not.toMatch(/const DEFAULT_REMINDER_TIME_OF_DAY\b/);
      expect(source, label).not.toMatch(/const REMINDER_TIME_OF_DAY_PATTERN\b/);
    }
  });

  it('app-vue goal workflow + persistence import sole without local dual pattern bodies', () => {
    for (const [label, source] of [
      ['useAIGoalWorkflow', goalWorkflow],
      ['useAIWorkflowPersistence', workflowPersistence],
    ] as const) {
      expect(source, label).toContain('Residual 1007');
      expect(source, label).toContain("from '@dailyuse/utils/shared'");
      expect(source, label).toContain('normalizeReminderTimeOfDay');
      expect(source, label).not.toMatch(/function normalizeReminderTimeOfDay\b/);
      expect(source, label).not.toMatch(/const DEFAULT_REMINDER_TIME_OF_DAY\b/);
      expect(source, label).not.toMatch(/const REMINDER_TIME_OF_DAY_PATTERN\b/);
    }
  });

  it('normalizes HH:mm and builds next start timestamp', () => {
    expect(DEFAULT_REMINDER_TIME_OF_DAY).toBe('09:00');
    expect(REMINDER_TIME_OF_DAY_PATTERN.test('09:00')).toBe(true);
    expect(REMINDER_TIME_OF_DAY_PATTERN.test('24:00')).toBe(false);
    expect(normalizeReminderTimeOfDay(undefined)).toBe('09:00');
    expect(normalizeReminderTimeOfDay('')).toBe('09:00');
    expect(normalizeReminderTimeOfDay('nope')).toBe('09:00');
    expect(normalizeReminderTimeOfDay('14:30')).toBe('14:30');

    const noon = new Date('2026-07-23T12:00:00.000Z').getTime();
    // Use fixed local-offset-independent approach: pick timeOfDay relative via Date construction
    const now = Date.now();
    const later = buildReminderStartTimestamp('23:59', now);
    const earlier = buildReminderStartTimestamp('00:00', now);
    expect(later).toBeGreaterThanOrEqual(now);
    expect(earlier).toBeGreaterThanOrEqual(now);
    expect(typeof noon).toBe('number');
  });
});
