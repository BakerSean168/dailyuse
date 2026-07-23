import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DAILY_REVIEW_INTERVAL_MINUTES,
  WEEKLY_REVIEW_INTERVAL_MINUTES,
  buildReminderTemplateInput,
} from './build-reminder-template-input';
import { ReminderType, TriggerType, NotificationChannel } from '@dailyuse/contracts/reminder';

/**
 * Residual 1013: buildReminderTemplateInput dual retired (API + Desktop automation).
 * Sole body in @dailyuse/utils/shared/build-reminder-template-input.
 * Soft residual 1022: tip focused suite numbers track Residual 1022 evidence tip (301/1307).
 * Soft residual 1007: reminder time-of-day helpers remain sole dependency.
 * Soft residual 835: activeTime uses activatedAt only.
 * Does not flip §13.2 checkboxes.
 */
describe('buildReminderTemplateInput dual retired (residual 1013)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'build-reminder-template-input.ts'), 'utf8');
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

  it('owns sole buildReminderTemplateInput helper body and shared barrel export', () => {
    expect(sole).toContain('Residual 1013');
    expect(sole).toMatch(/export function buildReminderTemplateInput\b/);
    expect(sole).toContain('activatedAt: startTime');
    expect(sole).not.toMatch(/startDate\s*:/);
    expect(sole).toContain('DAILY_REVIEW_INTERVAL_MINUTES');
    expect(sole).toContain('normalizeReminderTimeOfDay');
    expect(sole).toContain('buildReminderStartTimestamp');
    expect(index).toContain("export * from './build-reminder-template-input'");
  });

  it('API + Desktop automation executors import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['api', api],
      ['desktop', desktop],
    ] as const) {
      expect(source, label).toContain('Residual 1013');
      expect(source, label).toContain("from '@dailyuse/utils/shared'");
      expect(source, label).toMatch(/buildReminderTemplateInput/);
      expect(source, label).not.toMatch(/function buildReminderTemplateInput\b/);
      expect(source, label).not.toMatch(/const DAILY_REVIEW_INTERVAL_MINUTES\b/);
      expect(source, label).not.toMatch(/function normalizeReminderTimeOfDay\b/);
      expect(source, label).toContain('buildReminderTemplateInput(reminder)');
    }
  });

  it('adapters drop local reminder enum dual usage for template build', () => {
    for (const [label, source] of [
      ['api', api],
      ['desktop', desktop],
    ] as const) {
      expect(source, label).not.toMatch(/ReminderType\.OneTime/);
      expect(source, label).not.toMatch(/TriggerType\.FixedTime/);
      expect(source, label).not.toMatch(/NotificationChannel\.InApp/);
    }
  });

  it('maps once/daily/weekly previews onto CreateReminderTemplateReq shape', () => {
    const once = buildReminderTemplateInput(
      {
        title: 'Once',
        description: 'd',
        timeOfDay: '10:30',
        cadence: 'once',
        importance: 'Vital',
      },
      new Date('2026-07-23T08:00:00.000Z').getTime(),
    );
    expect(once.type).toBe(ReminderType.OneTime);
    expect(once.trigger.type).toBe(TriggerType.FixedTime);
    expect(once.trigger.fixedTime?.time).toBe('10:30');
    expect(once.activeTime.activatedAt).toBeTypeOf('number');
    expect(once.notificationConfig.channels).toEqual([NotificationChannel.InApp]);
    expect(once.tags).toEqual(['goal-agent']);

    const daily = buildReminderTemplateInput(
      {
        title: 'Daily',
        description: undefined,
        timeOfDay: '09:00',
        cadence: 'daily',
        importance: 'Moderate',
      },
      new Date('2026-07-23T08:00:00.000Z').getTime(),
    );
    expect(daily.type).toBe(ReminderType.Recurring);
    expect(daily.trigger.type).toBe(TriggerType.Interval);
    expect(daily.trigger.interval?.minutes).toBe(DAILY_REVIEW_INTERVAL_MINUTES);
    expect(daily.notificationConfig.body).toBeNull();

    const weekly = buildReminderTemplateInput(
      {
        title: 'Weekly',
        description: 'w',
        timeOfDay: 'bad',
        cadence: 'weekly',
        importance: 'Minor',
      },
      new Date('2026-07-23T08:00:00.000Z').getTime(),
    );
    expect(weekly.trigger.interval?.minutes).toBe(WEEKLY_REVIEW_INTERVAL_MINUTES);
    // invalid timeOfDay falls back via residual 1007 sole
    expect(weekly.trigger.interval?.startTime).toBeTypeOf('number');
  });
});
