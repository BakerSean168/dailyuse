import { describe, expect, it } from 'vitest';
import { Timezone } from '@dailyuse/contracts/schedule';
import { ScheduleConfig } from '../ScheduleConfig';

describe('ScheduleConfig', () => {
  it('creates the documented default schedule window', () => {
    const config = ScheduleConfig.createDefault(Timezone.Shanghai);

    expect(config.cronExpression).toBe('0 9 * * *');
    expect(config.timezone).toBe(Timezone.Shanghai);
    expect(config.hasExecutionLimit).toBe(false);
  });

  it('rejects empty schedule definitions and preserves valid updates', () => {
    expect(() =>
      ScheduleConfig.create({
        cronExpression: null,
        timezone: Timezone.Shanghai,
        startDate: null,
        endDate: null,
        maxExecutions: null,
      }),
    ).toThrow('Either cronExpression or startDate is required');

    const config = ScheduleConfig.createDefault(Timezone.Shanghai).with({
      maxExecutions: 5,
    });

    expect(config.maxExecutions).toBe(5);
  });
});
