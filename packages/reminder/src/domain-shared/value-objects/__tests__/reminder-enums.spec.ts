import { describe, expect, it } from 'vitest';
import { ControlMode } from '../control-mode';
import { NotificationAction } from '../notification-action';
import { NotificationChannel } from '../notification-channel';
import { ReminderStatus } from '../reminder-status';
import { ReminderType } from '../reminder-type';
import { TriggerResult } from '../trigger-result';
import { TriggerType } from '../trigger-type';

describe('reminder branded enum helpers', () => {
  it('covers control mode helpers', () => {
    expect(ControlMode.of('Group')).toBe(ControlMode.Group);
    expect(ControlMode.isGroup(ControlMode.Group)).toBe(true);
    expect(ControlMode.isIndividual(ControlMode.Individual)).toBe(true);
    expect(ControlMode.getAll()).toEqual(['Group', 'Individual']);
    expect(() => ControlMode.of('invalid')).toThrow('Invalid ControlMode: invalid');
  });

  it('covers notification action helpers', () => {
    expect(NotificationAction.of('Dismiss')).toBe(NotificationAction.Dismiss);
    expect(NotificationAction.isDismiss(NotificationAction.Dismiss)).toBe(true);
    expect(NotificationAction.isSnooze(NotificationAction.Snooze)).toBe(true);
    expect(NotificationAction.isComplete(NotificationAction.Complete)).toBe(true);
    expect(NotificationAction.needsProcessing(NotificationAction.Custom)).toBe(true);
    expect(NotificationAction.needsProcessing(NotificationAction.Dismiss)).toBe(false);
    expect(NotificationAction.getAll()).toEqual(['Dismiss', 'Snooze', 'Complete', 'Custom']);
    expect(() => NotificationAction.of('invalid')).toThrow('Invalid NotificationAction: invalid');
  });

  it('covers notification channel helpers', () => {
    expect(NotificationChannel.of('Email')).toBe(NotificationChannel.Email);
    expect(NotificationChannel.isRealtime(NotificationChannel.InApp)).toBe(true);
    expect(NotificationChannel.isRealtime(NotificationChannel.Email)).toBe(false);
    expect(NotificationChannel.isEmail(NotificationChannel.Email)).toBe(true);
    expect(NotificationChannel.isInApp(NotificationChannel.InApp)).toBe(true);
    expect(NotificationChannel.getAll()).toEqual(['InApp', 'Push', 'Email', 'Sms']);
    expect(() => NotificationChannel.of('invalid')).toThrow('Invalid NotificationChannel: invalid');
  });

  it('covers reminder status helpers', () => {
    expect(ReminderStatus.of('Active')).toBe(ReminderStatus.Active);
    expect(ReminderStatus.isActive(ReminderStatus.Active)).toBe(true);
    expect(ReminderStatus.isPaused(ReminderStatus.Paused)).toBe(true);
    expect(ReminderStatus.getAll()).toEqual(['Active', 'Paused']);
    expect(() => ReminderStatus.of('invalid')).toThrow('Invalid ReminderStatus: invalid');
  });

  it('covers reminder type helpers', () => {
    expect(ReminderType.of('Recurring')).toBe(ReminderType.Recurring);
    expect(ReminderType.isOneTime(ReminderType.OneTime)).toBe(true);
    expect(ReminderType.isRecurring(ReminderType.Recurring)).toBe(true);
    expect(ReminderType.getAll()).toEqual(['OneTime', 'Recurring']);
    expect(() => ReminderType.of('invalid')).toThrow('Invalid ReminderType: invalid');
  });

  it('covers trigger result helpers', () => {
    expect(TriggerResult.of('Success')).toBe(TriggerResult.Success);
    expect(TriggerResult.isSuccess(TriggerResult.Success)).toBe(true);
    expect(TriggerResult.isFailed(TriggerResult.Failed)).toBe(true);
    expect(TriggerResult.isSkipped(TriggerResult.Skipped)).toBe(true);
    expect(TriggerResult.isFinal(TriggerResult.Success)).toBe(true);
    expect(TriggerResult.getAll()).toEqual(['Success', 'Failed', 'Skipped']);
    expect(() => TriggerResult.of('invalid')).toThrow('Invalid TriggerResult: invalid');
  });

  it('covers trigger type helpers', () => {
    expect(TriggerType.of('FixedTime')).toBe(TriggerType.FixedTime);
    expect(TriggerType.isFixedTime(TriggerType.FixedTime)).toBe(true);
    expect(TriggerType.isInterval(TriggerType.Interval)).toBe(true);
    expect(TriggerType.getAll()).toEqual(['FixedTime', 'Interval']);
    expect(() => TriggerType.of('invalid')).toThrow('Invalid TriggerType: invalid');
  });
});
