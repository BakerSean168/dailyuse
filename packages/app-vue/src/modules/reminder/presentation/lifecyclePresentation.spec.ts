import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
} from '@memoflow/contracts/reminder';
import {
  getGlobalSwitchLabel,
  getGroupActiveStatusLabel,
  getGroupControlModeText,
  getGroupPolicyText,
  getGroupControlModeLabel,
  getGroupSidebarSummary,
  getGroupSwitchLabel,
  getGroupTemplateCountLabel,
  getTemplateEffectiveResultLabel,
  getTemplateEffectiveStatusLabel,
  getTemplateLifecycleBadgeText,
  getTemplateLifecycleSummary,
  getTemplateSelfSwitchLabel,
  getTemplateSelfSwitchShortLabel,
  getTemplateTriggerLabel,
} from './lifecycle-presentation';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      reminder: {
        linear: {
          templateCountValue: '{count} templates',
          currentStatusValue: '{count} active',
          sidebarGlobalPaused: '{count} reminders paused by master switch',
          sidebarGroupPaused: '{count} reminders paused by group rule',
        },
        lifecycle: {
          sourceGlobal: 'Controlled by the master switch',
          sourceGroup: 'Controlled by the group',
          sourceTemplateInGroup: 'Controlled by the template inside the group',
          sourceTemplateAtRoot: 'Controlled by the root template switch',
          badgeGlobalPaused: 'Paused globally',
          badgeGroupControlled: 'Group-controlled',
          badgeSelfControlled: 'Self-controlled',
          statusRunning: 'Running',
          statusPaused: 'Paused',
          resultRunningNow: 'Running now',
          resultPausedNow: 'Paused now',
          selfEnabledVerbose: 'Template self switch is enabled',
          selfPausedVerbose: 'Template self switch is paused',
          enabledShort: 'Enabled',
          pausedShort: 'Paused',
          globalPausedAll: 'Paused for all reminders',
          noGroup: 'No group',
          groupControlModeGroup: 'Group-controlled',
          groupControlModeIndividual: 'Template-controlled',
          groupEnabled: 'Group enabled',
          groupPaused: 'Group paused',
          groupPolicyGroupEnabled: 'Group switch decides whether reminders run.',
          groupPolicyGroupPaused: 'The group is paused, so every reminder in it stays paused.',
          groupPolicyIndividual: 'Templates in this group keep their own self switch control.',
        },
        templateDetail: {
          notConfigured: 'Not configured',
          triggerSummaryTime: 'At {time}',
          triggerSummaryInterval: 'Every {minutes} minutes',
        },
      },
    },
  },
});

const t = i18n.global.t;

function createTemplate(
  overrides: Partial<ReminderTemplateClientDTO> = {},
): ReminderTemplateClientDTO {
  return {
    id: 'template-1' as ReminderTemplateClientDTO['id'],
    identityId: 'identity-1' as ReminderTemplateClientDTO['identityId'],
    name: 'Morning review',
    description: null,
    type: 'Recurring',
    trigger: {
      type: 'FixedTime',
      fixedTime: { time: '09:00', timezone: null },
      interval: null,
      displayText: 'At 09:00',
    },
    activeTime: { activatedAt: 0, displayText: 'Activated now' },
    activeHours: null,
    notificationConfig: {
      channels: ['Push'],
      title: null,
      body: null,
      sound: null,
      vibration: null,
      actions: null,
      channelsText: 'Push',
      hasSoundEnabled: false,
      hasVibrationEnabled: false,
    },
    selfEnabled: true,
    status: 'Active',
    effectiveEnabled: true,
    groupId: 'group-1' as ReminderTemplateClientDTO['groupId'],
    groupName: 'Focus',
    importanceLevel: 'Moderate',
    tags: [],
    color: null,
    icon: null,
    nextTriggerAt: null,
    version: 1,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    history: null,
    displayTitle: 'Morning review',
    typeText: 'Recurring',
    triggerText: 'Every day',
    statusText: 'Active',
    importanceText: 'Moderate',
    nextTriggerText: null,
    isActive: true,
    isPaused: false,
    lastTriggeredText: null,
    controlledByGroup: false,
    lifecycleSource: 'template',
    effectiveEnabledReason: 'Template controls itself.',
    groupControlMode: 'Individual',
    groupEnabled: true,
    globalReminderEnabled: true,
    ...overrides,
  } as ReminderTemplateClientDTO;
}

function createGroup(overrides: Partial<ReminderGroupClientDTO> = {}): ReminderGroupClientDTO {
  return {
    id: 'group-1' as ReminderGroupClientDTO['id'],
    identityId: 'identity-1' as ReminderGroupClientDTO['identityId'],
    name: 'Focus',
    description: null,
    color: null,
    icon: null,
    controlMode: 'Group',
    enabled: true,
    status: 'Active',
    order: 0,
    stats: {
      totalTemplates: 2,
      activeTemplates: 1,
      pausedTemplates: 1,
      selfEnabledTemplates: 1,
      selfPausedTemplates: 1,
      templateCountText: '2 templates',
      activeStatusText: '1 active',
    },
    version: 1,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    displayName: 'Focus',
    controlModeText: 'Group control',
    statusText: 'Enabled',
    templateCountText: '2 templates',
    activeStatusText: '1 active',
    controlDescription: 'Group decides the final state.',
    effectiveTemplatePolicyText: 'Group switch decides whether reminders run.',
    ...overrides,
  } as ReminderGroupClientDTO;
}

describe('lifecyclePresentation', () => {
  it('maps template lifecycle summary and badge text', () => {
    expect(getTemplateLifecycleSummary(t, createTemplate({ lifecycleSource: 'global' }))).toBe(
      'Controlled by the master switch',
    );
    expect(getTemplateLifecycleBadgeText(t, createTemplate({ lifecycleSource: 'global' }))).toBe(
      'Paused globally',
    );
    expect(getTemplateLifecycleSummary(t, createTemplate({ lifecycleSource: 'group' }))).toBe(
      'Controlled by the group',
    );
    expect(getTemplateLifecycleBadgeText(t, createTemplate({ lifecycleSource: 'group' }))).toBe(
      'Group-controlled',
    );
    expect(
      getTemplateLifecycleSummary(
        t,
        createTemplate({ lifecycleSource: 'template', groupName: null, groupId: null }),
      ),
    ).toBe('Controlled by the root template switch');
  });

  it('maps effective status and switch labels', () => {
    const pausedTemplate = createTemplate({
      effectiveEnabled: false,
      selfEnabled: false,
      globalReminderEnabled: false,
      groupControlMode: null,
      groupEnabled: null,
      groupId: null,
      groupName: null,
    });

    expect(getTemplateEffectiveStatusLabel(t, pausedTemplate)).toBe('Paused');
    expect(getTemplateEffectiveResultLabel(t, pausedTemplate)).toBe('Paused now');
    expect(getTemplateSelfSwitchLabel(t, pausedTemplate)).toBe('Template self switch is paused');
    expect(getTemplateSelfSwitchShortLabel(t, pausedTemplate)).toBe('Paused');
    expect(getGlobalSwitchLabel(t, pausedTemplate)).toBe('Paused for all reminders');
    expect(getGroupControlModeLabel(t, pausedTemplate)).toBe('No group');
    expect(getGroupSwitchLabel(t, pausedTemplate)).toBe('No group');
  });

  it('maps group display labels and trigger summaries', () => {
    expect(getGroupControlModeText(t, createGroup({ controlMode: 'Group' }))).toBe(
      'Group-controlled',
    );
    expect(getGroupPolicyText(t, createGroup({ controlMode: 'Group', enabled: true }))).toBe(
      'Group switch decides whether reminders run.',
    );
    expect(getGroupPolicyText(t, createGroup({ controlMode: 'Group', enabled: false }))).toBe(
      'The group is paused, so every reminder in it stays paused.',
    );
    expect(getGroupPolicyText(t, createGroup({ controlMode: 'Individual' }))).toBe(
      'Templates in this group keep their own self switch control.',
    );
    expect(getGroupTemplateCountLabel(t, createGroup())).toBe('2 templates');
    expect(getGroupActiveStatusLabel(t, createGroup())).toBe('1 active');
    expect(
      getTemplateTriggerLabel(
        t,
        createTemplate({
          trigger: {
            type: 'FixedTime',
            fixedTime: { time: '09:00', timezone: null },
            interval: null,
          },
        }),
      ),
    ).toBe('At 09:00');
    expect(
      getTemplateTriggerLabel(
        t,
        createTemplate({
          trigger: {
            type: 'Interval',
            fixedTime: null,
            interval: { minutes: 30, startTime: null },
          },
        }),
      ),
    ).toBe('Every 30 minutes');
  });

  it('prioritizes global and group pauses in sidebar summaries', () => {
    const group = createGroup();

    expect(
      getGroupSidebarSummary(t, group, [
        createTemplate({
          id: 'a' as ReminderTemplateClientDTO['id'],
          groupId: group.id,
          lifecycleSource: 'global',
          effectiveEnabled: false,
        }),
        createTemplate({
          id: 'b' as ReminderTemplateClientDTO['id'],
          groupId: group.id,
          lifecycleSource: 'template',
          effectiveEnabled: true,
        }),
      ]),
    ).toBe('1 reminders paused by master switch');

    expect(
      getGroupSidebarSummary(t, group, [
        createTemplate({
          id: 'a' as ReminderTemplateClientDTO['id'],
          groupId: group.id,
          lifecycleSource: 'group',
          effectiveEnabled: false,
        }),
      ]),
    ).toBe('1 reminders paused by group rule');

    expect(
      getGroupSidebarSummary(t, group, [
        createTemplate({
          id: 'a' as ReminderTemplateClientDTO['id'],
          groupId: group.id,
          lifecycleSource: 'template',
          effectiveEnabled: true,
        }),
      ]),
    ).toBe('Group switch decides whether reminders run.');
  });
});
