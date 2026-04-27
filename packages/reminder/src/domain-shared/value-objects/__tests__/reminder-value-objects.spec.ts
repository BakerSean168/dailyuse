import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationChannel } from '@dailyuse/contracts/reminder';
import { ActiveHoursConfig } from '../active-hours-config';
import { ActiveTimeConfig } from '../active-time-config';
import { FrequencyAdjustment } from '../frequency-adjustment';
import { GroupStats } from '../group-stats';
import { ReminderNotificationConfig } from '../reminder-notification-config';
import { ResponseMetrics } from '../response-metrics';
import { TriggerConfig } from '../trigger-config';

describe('reminder shared value objects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T10:00:00.000Z'));
  });

  it('covers active hours validation, overnight windows, and persistence DTOs', () => {
    const defaultConfig = ActiveHoursConfig.createDefault();
    const overnight = ActiveHoursConfig.create({
      enabled: true,
      startHour: 22,
      endHour: 6,
    });

    expect(defaultConfig.displayText).toBe('09:00 - 21:00');
    expect(defaultConfig.durationHours).toBe(12);
    expect(overnight.isWithinActiveHours(23)).toBe(true);
    expect(overnight.isWithinActiveHours(3)).toBe(true);
    expect(overnight.isWithinActiveHours(12)).toBe(false);
    expect(overnight.durationHours).toBe(8);
    expect(ActiveHoursConfig.createAllDay().isAllDay).toBe(true);
    expect(defaultConfig.disable().isDisabled).toBe(true);
    expect(defaultConfig.setHours(8, 18).toPersistenceDTO()).toEqual({
      enabled: true,
      start_hour: 8,
      end_hour: 18,
    });
    expect(() => ActiveHoursConfig.create({ enabled: true, startHour: -1, endHour: 10 })).toThrow(
      'startHour must be between 0 and 23',
    );
    expect(() => ActiveHoursConfig.create({ enabled: true, startHour: 1, endHour: 25 })).toThrow(
      'endHour must be between 0 and 24',
    );
  });

  it('covers active time factories, formatting, and mutation helpers', () => {
    const config = ActiveTimeConfig.createAt(new Date('2026-04-25T10:00:00.000Z').getTime());

    expect(config.activatedAtDate.toISOString()).toBe('2026-04-25T10:00:00.000Z');
    expect(config.daysSinceActivation).toBe(2);
    expect(config.displayText).toContain('2026-04-25');
    expect(config.setActivatedAt(new Date('2026-04-26T08:00:00.000Z').getTime()).activatedAtDate.toISOString()).toBe(
      '2026-04-26T08:00:00.000Z',
    );
    expect(ActiveTimeConfig.createNow().reactivate().activatedAt).toBe(Date.now());
    expect(
      ActiveTimeConfig.fromPersistenceDTO({ activatedAt: 123 }).toPersistenceDTO(),
    ).toEqual({ activatedAt: 123 });
  });

  it('covers trigger config fixed-time and interval branches', () => {
    const fixedTime = TriggerConfig.createFixedTime('09:30', 'Asia/Shanghai');
    const interval = TriggerConfig.createInterval(120, 600);

    expect(fixedTime.isFixedTime).toBe(true);
    expect(fixedTime.setFixedTime('10:30').fixedTime?.time).toBe('10:30');
    expect(fixedTime.setIntervalMinutes(90)).toBe(fixedTime);
    expect(fixedTime.displayText).toBe('每天 09:30');
    expect(interval.isInterval).toBe(true);
    expect(interval.setIntervalMinutes(180).interval?.minutes).toBe(180);
    expect(interval.setFixedTime('11:00')).toBe(interval);
    expect(interval.displayText).toBe('每 2 小时');
    expect(TriggerConfig.createInterval(45).displayText).toBe('每 45 分钟');
    expect(
      TriggerConfig.fromPersistenceDTO({
        type: 'Interval',
        fixed_time: null,
        interval: JSON.stringify({ minutes: 15, startTime: 100 }),
      }).toPersistenceDTO(),
    ).toEqual({
      type: 'Interval',
      fixed_time: null,
      interval: JSON.stringify({ minutes: 15, startTime: 100 }),
    });
  });

  it('covers reminder notification config channel and sound helpers', () => {
    const config = ReminderNotificationConfig.createDefault()
      .addChannel(NotificationChannel.Push)
      .addChannel(NotificationChannel.Push)
      .setTitle('Title')
      .setBody('Body')
      .enableSound('ding')
      .with({
        actions: [{ id: 'done', label: 'Done', action: 'Complete', customAction: null }],
      });

    expect(config.channels).toEqual([NotificationChannel.InApp, NotificationChannel.Push]);
    expect(config.removeChannel(NotificationChannel.InApp).channels).toEqual([NotificationChannel.Push]);
    expect(config.hasChannels).toBe(true);
    expect(config.hasSoundEnabled).toBe(true);
    expect(config.disableSound().hasSoundEnabled).toBe(false);
    expect(config.hasVibrationEnabled).toBe(true);
    expect(config.hasActions).toBe(true);
    expect(config.channelsText).toBe('应用内 + 推送');
    expect(config.toServerDTO().actions).toHaveLength(1);
  });

  it('covers group stats calculations and presentation helpers', () => {
    const stats = GroupStats.createEmpty().recalculate({
      total: 4,
      active: 3,
      paused: 1,
      selfEnabled: 2,
      selfPaused: 2,
    });

    expect(GroupStats.createEmpty().isEmpty).toBe(true);
    expect(stats.hasActiveTemplates).toBe(true);
    expect(stats.allPaused).toBe(false);
    expect(stats.templateCountText).toBe('4 个提醒');
    expect(stats.activeStatusText).toBe('3 个活跃');
    expect(stats.activePercentage).toBe(75);
    expect(
      GroupStats.fromPersistenceDTO({
        total_templates: 2,
        active_templates: 0,
        paused_templates: 2,
        self_enabled_templates: 1,
        self_paused_templates: 1,
      }).activeStatusText,
    ).toBe('全部暂停');
    expect(stats.toPersistenceDTO()).toEqual({
      total_templates: 4,
      active_templates: 3,
      paused_templates: 1,
      self_enabled_templates: 2,
      self_paused_templates: 2,
    });
  });

  it('covers response metrics labels, display text, and formatting', () => {
    const empty = ResponseMetrics.createEmpty();
    const updated = empty.updateMetrics({
      clickRate: 88,
      ignoreRate: 12,
      avgResponseTime: 125,
      snoozeCount: 2,
      effectivenessScore: 72,
      sampleSize: 10,
    });

    expect(empty.displayText).toBe('暂无数据');
    expect(updated.hasSamples).toBe(true);
    expect(updated.effectivenessLabel).toBe('high');
    expect(updated.effectivenessLabelText).toBe('高效');
    expect(updated.effectivenessColor).toBe('success');
    expect(updated.displayText).toBe('点击率 88%，高效');
    expect(updated.avgResponseTimeFormatted).toBe('2 分钟');
    expect(ResponseMetrics.create({ ...updated.toDTO(), effectivenessScore: 45 }).effectivenessLabel).toBe(
      'medium',
    );
    expect(ResponseMetrics.create({ ...updated.toDTO(), effectivenessScore: 20 }).effectivenessLabel).toBe(
      'low',
    );
  });

  it('covers frequency adjustment status, percentages, and formatting', () => {
    const auto = FrequencyAdjustment.createAuto(3600, 7200, 'Too noisy');
    const manual = FrequencyAdjustment.createManual(1800, 900, 'User prefers faster');

    expect(auto.isPending).toBe(true);
    expect(auto.changeRate).toBe(100);
    expect(auto.changeRateText).toBe('频率降低 100%');
    expect(auto.statusText).toBe('待确认');
    expect(auto.displayText).toBe('从 每 1 小时 调整为 每 2 小时');
    expect(auto.confirm().isConfirmed).toBe(true);
    expect(auto.reject('No thanks').isRejected).toBe(true);
    expect(auto.reject('No thanks').statusText).toBe('已拒绝');
    expect(manual.isConfirmed).toBe(true);
    expect(manual.changeRate).toBe(-50);
    expect(manual.changeRateText).toBe('频率提高 50%');
    expect(FrequencyAdjustment.create({ ...manual.toDTO(), originalInterval: 0 }).changeRate).toBe(0);
    expect(FrequencyAdjustment.create({ ...manual.toDTO(), adjustedInterval: 1800 }).changeRateText).toBe(
      '频率不变',
    );
  });
});
