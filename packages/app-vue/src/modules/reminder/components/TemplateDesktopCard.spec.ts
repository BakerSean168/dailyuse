/** @vitest-environment jsdom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import TemplateDesktopCard from './TemplateDesktopCard.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: {
        close: 'Close',
        unknown: 'Unknown',
      },
      reminder: {
        lifecycle: {
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
        },
        templateDetail: {
          fallbackTitle: 'Reminder details',
          description: 'View the reminder basics, lifecycle state, and trigger configuration.',
          groupedFallback: 'In a group',
          badgeGroupControlled: 'Group-controlled',
          badgeGlobalPaused: 'Paused globally',
          sectionBasicInfo: 'Basic Information',
          fieldTitle: 'Title',
          fieldDescription: 'Description',
          fieldTriggerType: 'Trigger Type',
          fieldTriggerConfig: 'Trigger Configuration',
          notConfigured: 'Not configured',
          triggerConfigType: 'Type: {value}',
          triggerConfigInterval: 'Interval: {minutes} minutes',
          triggerConfigTime: 'Time: {time}',
          sectionStats: 'Statistics',
          statTotal: 'Total instances',
          statCompleted: 'Completed',
          statPending: 'Pending',
          sectionTimeInfo: 'Time Information',
          fieldCreatedAt: 'Created at',
          fieldUpdatedAt: 'Updated at',
          selfSwitchTitle: 'Template Self Switch',
          effectiveStatusLine: 'Effective status: {status}',
          overrideTitle: 'A higher-level rule is active',
          overrideDescription:
            "{reason} Toggling the template switch only updates the template's own recorded state. The current effective result will not change until {controller} allows it again.",
          overrideControllerGlobal: 'the master switch',
          overrideControllerGroup: 'the group control rule',
          sectionLifecycle: 'Lifecycle Control',
          fieldEffectiveResult: 'Effective Result',
          fieldGlobalSwitch: 'Global Reminder Switch',
          fieldGroupControlMode: 'Group Control Mode',
          fieldGroupSwitch: 'Group Switch',
          actionEdit: 'Edit Reminder',
          actionViewInstances: 'View Instances',
          invalidTime: 'Invalid time',
        },
      },
    },
  },
});

vi.mock('@dailyuse/ui-vue-shadcn', async () => {
  const vue = await import('vue');

  const passthrough = (name: string) =>
    vue.defineComponent({
      name,
      setup(_, { slots, attrs }) {
        return () => vue.h('div', { 'data-stub': name, ...attrs }, slots.default?.());
      },
    });

  const Dialog = vue.defineComponent({
    name: 'DialogStub',
    props: {
      open: Boolean,
    },
    setup(_, { slots }) {
      return () => vue.h('div', { 'data-stub': 'Dialog' }, slots.default?.());
    },
  });

  const Switch = vue.defineComponent({
    name: 'SwitchStub',
    props: {
      checked: Boolean,
      disabled: Boolean,
    },
    emits: ['update:checked'],
    setup(props, { emit }) {
      return () =>
        vue.h('button', {
          type: 'button',
          'data-stub': 'Switch',
          'data-checked': String(props.checked),
          disabled: props.disabled,
          onClick: () => emit('update:checked', !props.checked),
        });
    },
  });

  return {
    Dialog,
    DialogContent: passthrough('DialogContent'),
    DialogDescription: passthrough('DialogDescription'),
    DialogFooter: passthrough('DialogFooter'),
    DialogHeader: passthrough('DialogHeader'),
    DialogTitle: passthrough('DialogTitle'),
    Badge: passthrough('Badge'),
    Button: passthrough('Button'),
    Card: passthrough('Card'),
    Switch,
    Separator: passthrough('Separator'),
  };
});

function createTemplate(
  overrides: Partial<ReminderTemplateClientDTO> = {},
): ReminderTemplateClientDTO {
  return {
    id: 'template-1',
    identityId: 'identity-1' as ReminderTemplateClientDTO['identityId'],
    name: 'Morning review',
    description: 'Start-of-day reflection',
    type: 'Recurring',
    icon: null,
    color: null,
    activeTime: { startDate: 0, endDate: null },
    activeHours: null,
    notificationConfig: {
      channels: ['Push'],
      title: null,
      body: null,
      sound: null,
      vibration: null,
      actions: null,
    },
    effectiveEnabled: false,
    selfEnabled: true,
    groupId: 'group-1' as ReminderTemplateClientDTO['groupId'],
    groupName: 'Focus',
    trigger: null,
    importanceLevel: 'Moderate',
    tags: [],
    nextTriggerAt: null,
    deletedAt: null,
    history: null,
    displayTitle: 'Morning review',
    typeText: 'Recurring',
    statusText: 'Paused',
    importanceText: 'Moderate',
    nextTriggerText: null,
    isActive: false,
    isPaused: true,
    lastTriggeredText: null,
    createdAt: 0,
    updatedAt: 0,
    status: 'Active',
    version: 1,
    effectiveEnabledReason: 'Group is paused, so the reminder cannot run yet.',
    lifecycleSource: 'group',
    controlledByGroup: true,
    groupControlMode: 'Group',
    groupEnabled: false,
    globalReminderEnabled: true,
    triggerText: 'Every day',
    ...overrides,
  };
}

function mountCard(template: ReminderTemplateClientDTO) {
  return mount(TemplateDesktopCard, {
    props: {
      template,
    },
    global: {
      plugins: [i18n],
    },
  });
}

describe('TemplateDesktopCard', () => {
  it('uses selfEnabled for the switch and explains higher-level control', async () => {
    const wrapper = mountCard(createTemplate());

    const switchButton = wrapper.find('[data-stub="Switch"]');
    expect(switchButton.attributes('data-checked')).toBe('true');

    expect(wrapper.text()).toContain('Template Self Switch');
    expect(wrapper.text()).toContain('Template self switch is enabled');
    expect(wrapper.text()).toContain('Effective status: Paused');
    expect(wrapper.text()).toContain('A higher-level rule is active');
    expect(wrapper.text()).toContain('the group control rule');

    await switchButton.trigger('click');

    expect(wrapper.emitted('status-changed')?.[0]?.[0]).toMatchObject({ id: 'template-1' });
    expect(wrapper.emitted('status-changed')?.[0]?.[1]).toBe(false);
  });

  it('does not show the override warning when the template controls itself', () => {
    const wrapper = mountCard(
      createTemplate({
        effectiveEnabled: true,
        selfEnabled: true,
        lifecycleSource: 'template',
        controlledByGroup: false,
        groupControlMode: 'Individual',
        groupEnabled: true,
        effectiveEnabledReason: 'Template controls itself.',
      }),
    );

    expect(wrapper.text()).not.toContain('A higher-level rule is active');
    expect(wrapper.text()).toContain('Running now');
  });
});
