import { describe, expect, it } from 'vitest';
import { NotificationChannelType } from '@memoflow/contracts/notification';
import { NotificationPreference } from '../notification-preference';
import { DoNotDisturbConfig } from '../../value-objects/do-not-disturb-config';
import { RateLimit } from '../../value-objects/rate-limit';

const identityId = 'identity-pref' as never;

describe('NotificationPreference aggregate', () => {
  it('starts with no user overrides so workflow defaults remain authoritative', () => {
    const pref = NotificationPreference.create({ identityId });
    expect(pref.globalChannels.size).toBe(0);
    expect(pref.workflowOverrides.size).toBe(0);
    expect(pref.doNotDisturb).toBeNull();
    expect(pref.rateLimit).toBeNull();
  });

  it('sets, reads and clears a global channel preference', () => {
    const pref = NotificationPreference.create({ identityId });
    pref.setGlobalChannel(NotificationChannelType.Email, false);
    expect(pref.getGlobalChannel(NotificationChannelType.Email)).toBe(false);
    pref.setGlobalChannel(NotificationChannelType.Email, true);
    expect(pref.getGlobalChannel(NotificationChannelType.Email)).toBe(true);
    pref.clearGlobalChannel(NotificationChannelType.Email);
    expect(pref.getGlobalChannel(NotificationChannelType.Email)).toBeUndefined();
  });

  it('sets, reads and clears a workflow-specific override', () => {
    const pref = NotificationPreference.create({ identityId });
    pref.setWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop, true);
    expect(pref.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop)).toBe(true);
    pref.setWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop, false);
    expect(pref.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop)).toBe(false);
    pref.clearWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop);
    expect(pref.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop)).toBeUndefined();
    expect(pref.workflowOverrides.has('task.deadline')).toBe(false);
  });

  it('keeps workflow overrides isolated by workflow key', () => {
    const pref = NotificationPreference.create({ identityId });
    pref.setWorkflowChannelOverride('task.deadline', NotificationChannelType.Email, false);
    pref.setWorkflowChannelOverride('goal.progress', NotificationChannelType.Email, true);
    expect(pref.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Email)).toBe(false);
    expect(pref.getWorkflowChannelOverride('goal.progress', NotificationChannelType.Email)).toBe(true);
  });

  it('returns defensive copies of preference maps', () => {
    const pref = NotificationPreference.create({ identityId });
    pref.setGlobalChannel(NotificationChannelType.Email, false);
    const globals = pref.globalChannels;
    globals.set(NotificationChannelType.Email, true);
    expect(pref.getGlobalChannel(NotificationChannelType.Email)).toBe(false);

    pref.setWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop, true);
    const overrides = pref.workflowOverrides;
    overrides.get('task.deadline')?.set(NotificationChannelType.Desktop, false);
    expect(pref.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop)).toBe(true);
  });

  it('persists DND and rate-limit policy configuration independently from channel preferences', () => {
    const pref = NotificationPreference.create({ identityId });
    const dnd = DoNotDisturbConfig.create({
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    });
    const rate = RateLimit.create({ enabled: true, maxPerHour: 2, maxPerDay: 10 });
    pref.setDoNotDisturb(dnd);
    pref.setRateLimit(rate);
    expect(pref.doNotDisturb?.toDTO()).toEqual(dnd.toDTO());
    expect(pref.rateLimit?.toDTO()).toEqual(rate.toDTO());
  });

  it('serializes global and workflow layers without legacy module/category settings', () => {
    const pref = NotificationPreference.create({ identityId });
    pref.setGlobalChannel(NotificationChannelType.Email, false);
    pref.setWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop, true);
    const dto = pref.toServerDTO();
    expect(dto.globalChannels).toEqual({ Email: false });
    expect(dto.workflowOverrides).toEqual({ 'task.deadline': { Desktop: true } });
    expect(dto).not.toHaveProperty('settings');
    expect(dto).not.toHaveProperty('categories');
    expect(dto).not.toHaveProperty('enabled');
  });

  it('reconstructs persisted preference layers', () => {
    const pref = NotificationPreference.load({
      id: 'pref-1' as never,
      identityId,
      globalChannels: new Map([[NotificationChannelType.Email, false]]),
      workflowOverrides: new Map([
        ['task.deadline', new Map([[NotificationChannelType.Desktop, true]])],
      ]),
      doNotDisturb: null,
      rateLimit: null,
      version: 2,
      deletedAt: null,
      createdAt: new Date('2026-08-25T00:00:00Z'),
      updatedAt: new Date('2026-08-25T01:00:00Z'),
    });
    expect(pref.getGlobalChannel(NotificationChannelType.Email)).toBe(false);
    expect(pref.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop)).toBe(true);
    expect(pref.version).toBe(2);
  });
});
