/** @vitest-environment jsdom */

import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
} from '@dailyuse/contracts/reminder';
import TemplateMoveDialog from './TemplateMoveDialog.vue';

vi.mock('@dailyuse/ui-vue-shadcn', async () => {
  const vue = await import('vue');

  const passthrough = (name: string) =>
    vue.defineComponent({
      name,
      props: ['open', 'disabled', 'variant', 'checked'],
      emits: ['update:open', 'click', 'update:checked'],
      setup(props, { slots, attrs, emit }) {
        return () =>
          vue.h(
            'div',
            {
              'data-stub': name,
              ...attrs,
              onClick: () => emit('click'),
            },
            slots.default?.(),
          );
      },
    });

  const Checkbox = vue.defineComponent({
    name: 'CheckboxStub',
    props: {
      checked: Boolean,
    },
    emits: ['update:checked'],
    setup(props, { emit, attrs }) {
      return () =>
        vue.h('button', {
          type: 'button',
          'data-stub': 'Checkbox',
          'data-checked': String(props.checked),
          ...attrs,
          onClick: () => emit('update:checked', !props.checked),
        });
    },
  });

  const Select = vue.defineComponent({
    name: 'SelectStub',
    props: {
      modelValue: String,
      disabled: Boolean,
    },
    emits: ['update:modelValue'],
    setup(props, { slots, emit }) {
      return () =>
        vue.h(
          'div',
          {
            'data-stub': 'Select',
            'data-disabled': String(props.disabled),
          },
          [
            vue.h(
              'button',
              {
                type: 'button',
                'data-select-value': props.modelValue ?? '',
                onClick: () => emit('update:modelValue', 'group-2'),
              },
              'select-group-2',
            ),
            slots.default?.(),
          ],
        );
    },
  });

  return {
    Dialog: passthrough('Dialog'),
    DialogContent: passthrough('DialogContent'),
    DialogDescription: passthrough('DialogDescription'),
    DialogFooter: passthrough('DialogFooter'),
    DialogHeader: passthrough('DialogHeader'),
    DialogTitle: passthrough('DialogTitle'),
    Button: defineComponent({
      name: 'ButtonStub',
      props: {
        disabled: Boolean,
      },
      emits: ['click'],
      setup(props, { slots, emit, attrs }) {
        return () =>
          h(
            'button',
            {
              type: 'button',
              disabled: props.disabled,
              ...attrs,
              onClick: () => emit('click'),
            },
            slots.default?.(),
          );
      },
    }),
    Label: passthrough('Label'),
    Badge: passthrough('Badge'),
    Card: passthrough('Card'),
    Checkbox,
    Alert: passthrough('Alert'),
    AlertDescription: passthrough('AlertDescription'),
    AlertTitle: passthrough('AlertTitle'),
    Select,
    SelectContent: passthrough('SelectContent'),
    SelectItem: passthrough('SelectItem'),
    SelectTrigger: passthrough('SelectTrigger'),
    SelectValue: passthrough('SelectValue'),
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      reminder: {
        templateMove: {
          title: 'Move reminder',
          description: 'Choose a new group or move this reminder back to root.',
          currentTemplate: 'Current template',
          currentGroup: 'Current group:',
          targetGroup: 'Target group',
          selectTargetGroup: 'Choose group',
          current: 'Current',
          removeFromAllGroups: 'Move to root',
          warning: 'Warning',
          warningDescription: 'The reminder will leave all groups.',
          targetGroupInfo: 'Target group info',
          name: 'Name:',
          templates: 'Templates:',
          status: 'Status:',
          controlMode: 'Control mode:',
          controlModeGroup: 'Group control',
          controlModeIndividual: 'Individual control',
          previewTitle: 'After move',
          defaultPolicyText:
            'This group decides the final reminder state according to its current control mode.',
          previewRoot:
            'After moving to root, the reminder will return to its own self switch control.',
          previewGroupEnabled:
            'After moving, the group will control the reminder and it will take effect immediately.',
          previewGroupPaused:
            'After moving, the group will control the reminder and it will stay paused because the group is paused.',
          previewIndividual: 'After moving, the reminder will keep its own self switch control.',
          cancel: 'Cancel',
          move: 'Move',
          none: 'None',
          unknownGroup: 'Unknown group',
          unknown: 'Unknown',
          enabled: 'Enabled',
          disabled: 'Disabled',
        },
        lifecycle: {
          groupPolicyGroupEnabled: 'Group switch decides whether reminders run.',
          groupPolicyGroupPaused: 'The group is paused, so every reminder in it stays paused.',
          groupPolicyIndividual: 'Templates in this group keep their own self switch control.',
        },
      },
    },
  },
});

function createTemplate(
  overrides: Partial<ReminderTemplateClientDTO> = {},
): ReminderTemplateClientDTO {
  return {
    id: 'template-1',
    identityId: 'identity-1' as ReminderTemplateClientDTO['identityId'],
    name: '喝水提醒',
    description: null,
    type: 'Recurring',
    trigger: null,
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
    selfEnabled: true,
    status: 'Active',
    effectiveEnabled: true,
    groupId: 'group-1',
    groupName: '健康管理',
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
    displayTitle: '喝水提醒',
    typeText: 'Recurring',
    triggerText: 'Every day',
    statusText: 'Active',
    importanceText: 'Moderate',
    nextTriggerText: null,
    isActive: true,
    isPaused: false,
    lastTriggeredText: null,
    controlledByGroup: true,
    lifecycleSource: 'group',
    effectiveEnabledReason: 'Group controls this reminder.',
    groupControlMode: 'Group',
    groupEnabled: true,
    globalReminderEnabled: true,
    ...overrides,
  };
}

function createGroup(overrides: Partial<ReminderGroupClientDTO> = {}): ReminderGroupClientDTO {
  return {
    id: 'group-1',
    identityId: 'identity-1' as ReminderGroupClientDTO['identityId'],
    name: '健康管理',
    description: '健康相关',
    icon: null,
    enabled: true,
    controlMode: 'Group',
    color: null,
    status: 'Active',
    order: 0,
    stats: {
      totalTemplates: 1,
      activeTemplates: 1,
      totalExecutions: 0,
      completedExecutions: 0,
      pendingExecutions: 0,
      avgResponseRate: 0,
    },
    version: 1,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    displayName: '健康管理',
    controlModeText: 'Group control',
    statusText: 'Enabled',
    templateCountText: '1 template',
    activeStatusText: '1 active',
    controlDescription: 'Group decides the final state.',
    effectiveTemplatePolicyText: '分组开启时统一生效，分组暂停时统一暂停。',
    ...overrides,
  };
}

function mountDialog(props?: {
  template?: ReminderTemplateClientDTO | null;
  groups?: ReminderGroupClientDTO[];
  templates?: ReminderTemplateClientDTO[];
}) {
  return mount(TemplateMoveDialog, {
    props: {
      template: props?.template ?? createTemplate(),
      groups: props?.groups ?? [
        createGroup(),
        createGroup({
          id: 'group-2',
          name: '工作提醒',
          controlMode: 'Individual',
          enabled: true,
          effectiveTemplatePolicyText: '模板保留自身开关控制。',
        }),
      ],
      templates: props?.templates ?? [
        createTemplate(),
        createTemplate({ id: 'template-2', name: '散步提醒', groupId: 'group-2' }),
      ],
    },
    global: {
      plugins: [i18n],
      stubs: {
        transition: false,
        teleport: false,
        DynamicIconStub: defineComponent({
          name: 'DynamicIconStub',
          setup() {
            return () => h('div', { 'data-stub': 'dynamic-icon' });
          },
        }),
      },
    },
  });
}

describe('TemplateMoveDialog', () => {
  it('emits move-to-root and shows the root lifecycle preview', async () => {
    const wrapper = mountDialog();
    (wrapper.vm as { open: () => void }).open();
    await nextTick();

    const checkbox = wrapper.find('[data-stub="Checkbox"]');
    await checkbox.trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain(
      'After moving to root, the reminder will return to its own self switch control.',
    );

    const buttons = wrapper.findAll('button');
    const moveButton = buttons.find((button) => button.text().includes('Move'));
    expect(moveButton).toBeDefined();

    await moveButton!.trigger('click');

    expect(wrapper.emitted('moved')?.[0]).toEqual(['template-1', null]);
  });

  it('emits move-to-group and shows the selected group policy', async () => {
    const wrapper = mountDialog();
    (wrapper.vm as { open: () => void }).open();
    await nextTick();

    const selectButton = wrapper.find('[data-select-value]');
    await selectButton.trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Templates in this group keep their own self switch control.');
    expect(wrapper.text()).toContain(
      'After moving, the reminder will keep its own self switch control.',
    );

    const buttons = wrapper.findAll('button');
    const moveButton = buttons.find((button) => button.text().includes('Move'));
    expect(moveButton).toBeDefined();

    await moveButton!.trigger('click');

    expect(wrapper.emitted('moved')?.[0]).toEqual(['template-1', 'group-2']);
  });

  it('shows paused preview when moving into a paused group-controlled group', async () => {
    const wrapper = mountDialog({
      groups: [
        createGroup(),
        createGroup({
          id: 'group-2',
          name: '暂停分组',
          controlMode: 'Group',
          enabled: false,
          effectiveTemplatePolicyText: '分组暂停时所有提醒都会暂停。',
        }),
      ],
    });

    (wrapper.vm as { open: () => void }).open();
    await nextTick();

    const selectButton = wrapper.find('[data-select-value]');
    await selectButton.trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain(
      'After moving, the group will control the reminder and it will stay paused because the group is paused.',
    );
  });
});
