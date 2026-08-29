import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('legacy Reminder cron shadow surface (ROUTINE-3402)', () => {
  const source = readFileSync(resolve(__dirname, 'reminder-trigger-cron-job.ts'), 'utf8');

  it('cannot execute the retired write-side scheduler path', () => {
    expect(source).not.toContain('ReminderSchedulerService');
    expect(source).not.toContain('ReminderTriggerService');
    expect(source).not.toContain('ReminderTransactionRunner');
    expect(source).not.toContain('ReminderReliableOperationPort');
    expect(source).not.toMatch(/\.save\(/);
    expect(source).not.toContain('recordDeliveryIntent');
  });

  it('is explicitly a due-set comparison diagnostic', () => {
    expect(source).toContain('findByNextTriggerBefore');
    expect(source).toContain('schedulerDueSetReader.readDueSet');
    expect(source).toContain('compareReminderDueSets');
    expect(source).toContain('Reminder due-set shadow mismatch');
  });
});
