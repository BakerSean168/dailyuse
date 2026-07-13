/** @vitest-environment jsdom */

import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
  UserReminderPreferencesClientDTO,
} from '@dailyuse/contracts/reminder';
import ReminderLinearView from './ReminderLinearView.vue';
import { toast } from 'vue-sonner';

const templatesRef = ref<ReminderTemplateClientDTO[]>([]);
const groupsRef = ref<ReminderGroupClientDTO[]>([]);
const preferencesRef = ref<UserReminderPreferencesClientDTO | null>(null);

const fetchTemplates = vi.fn().mockResolvedValue(undefined);
const fetchGroups = vi.fn().mockResolvedValue(undefined);
const fetchPreferences = vi.fn().mockResolvedValue(undefined);
const updatePreferences = vi.fn().mockResolvedValue(null);
const moveTemplateToGroup = vi.fn().mockResolvedValue(null);
const toggleTemplate = vi.fn().mockResolvedValue(null);

vi.mock('../composables/useReminder', () => ({
  useReminder: () => ({
    templates: computed(() => templatesRef.value),
    groups: computed(() => groupsRef.value),
    isLoading: computed(() => false),
    isSaving: computed(() => false),
    preferences: computed(() => preferencesRef.value),
    fetchTemplates,
    fetchGroups,
    fetchPreferences,
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    toggleTemplate,
    moveTemplateToGroup,
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    toggleGroup: vi.fn(),
    switchGroupControlMode: vi.fn(),
    updatePreferences,
  }),
}));

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('@dailyuse/ui-vue-shadcn', async () => {
  const vue = await import('vue');

  const passthrough = (name: string) =>
    vue.defineComponent({
      name,
      props: ['checked', 'modelValue', 'title', 'variant', 'size', 'disabled'],
      emits: ['update:checked', 'click'],
      setup(props, { emit, slots, attrs }) {
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
    Button: passthrough('Button'),
    Badge: passthrough('Badge'),
    ScrollArea: passthrough('ScrollArea'),
    Input: passthrough('Input'),
    Switch,
    Tooltip: passthrough('Tooltip'),
    TooltipContent: passthrough('TooltipContent'),
    TooltipTrigger: passthrough('TooltipTrigger'),
    useConfirm: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('../../../components/shared', async () => {
  const vue = await import('vue');

  return {
    ActionableWrapper: vue.defineComponent({
      name: 'ActionableWrapperStub',
      setup(_, { slots }) {
        return () => vue.h('div', { 'data-stub': 'ActionableWrapper' }, slots.default?.());
      },
    }),
    menuLabel: (key: string) => key,
  };
});

const TemplateDesktopCardStub = defineComponent({
  name: 'TemplateDesktopCardStub',
  setup() {
    return () => h('div', { 'data-stub': 'TemplateDesktopCard' });
  },
});

const TemplateDialogStub = defineComponent({
  name: 'TemplateDialogStub',
  setup() {
    return () => h('div', { 'data-stub': 'TemplateDialog' });
  },
});

const GroupDialogStub = defineComponent({
  name: 'GroupDialogStub',
  setup() {
    return () => h('div', { 'data-stub': 'GroupDialog' });
  },
});

const TemplateMoveDialogStub = defineComponent({
  name: 'TemplateMoveDialogStub',
  setup() {
    return () => h('div', { 'data-stub': 'TemplateMoveDialog' });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      reminder: {
        title: 'Reminders',
        action: {
          createReminder: 'Create reminder',
          createGroup: 'Create group',
          pauseGroup: 'Pause group',
          enableGroup: 'Enable group',
          switchToIndividual: 'Switch to individual',
          switchToGroup: 'Switch to group',
        },
        linear: {
          allReminders: 'All reminders',
          templateTitle: 'Templates',
          masterSwitch: 'Master switch',
          searchPlaceholder: 'Search',
          groupEnabled: 'Group enabled',
          groupPaused: 'Group paused',
          globalPausedTitle: 'The master reminder switch is off',
          globalPausedDescription: 'All reminders are paused by the master switch.',
          reEnableGlobal: 'Enable again',
          templateCount: 'Template count',
          templateCountValue: '{count} templates',
          currentStatus: 'Current status',
          currentStatusValue: '{count} active',
          sidebarGlobalPaused: '{count} reminders paused by master switch',
          sidebarGroupPaused: '{count} reminders paused by group rule',
        },
        lifecycle: {
          groupControlModeGroup: 'Group-controlled',
          groupControlModeIndividual: 'Template-controlled',
          groupPolicyGroupEnabled: 'Group switch decides whether reminders run.',
          groupPolicyGroupPaused: 'The group is paused, so every reminder in it stays paused.',
          groupPolicyIndividual: 'Templates in this group keep their own self switch control.',
        },
        status: {
          loading: 'Loading',
        },
        empty: 'Empty',
        emptyDescription: 'No reminders',
        toast: {
          globalReminderEnabled: 'enabled',
          globalReminderPaused: 'paused',
          templateEnabled: 'template enabled',
          templatePaused: 'paused',
          groupEnabled: 'group enabled',
          groupPaused: 'group paused',
          groupControlModeUpdated: 'updated',
          templateMoved: 'Reminder moved',
          templateMovedToRoot: 'Reminder moved back to root',
        },
      },
      common: {
        delete: 'Delete',
        cancel: 'Cancel',
      },
    },
  },
});

function createTemplate(
  overrides: Partial<ReminderTemplateClientDTO> = {},
): ReminderTemplateClientDTO {
  return {
    id: 'template-1' as ReminderTemplateClientDTO['id'],
    identityId: 'identity-1' as ReminderTemplateClientDTO['identityId'],
    name: 'Morning review',
    description: null,
    type: 'Recurring',
    icon: null,
    color: null,
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
    groupId: 'group-1' as ReminderTemplateClientDTO['groupId'],
    groupName: 'Focus',
    trigger: {
      type: 'FixedTime',
      fixedTime: { time: '09:00', timezone: null },
      interval: null,
    },
    selfEnabled: true,
    effectiveEnabled: true,
    controlledByGroup: false,
    lifecycleSource: 'template',
    effectiveEnabledReason: 'Template controls itself.',
    groupControlMode: 'Individual',
    groupEnabled: true,
    globalReminderEnabled: true,
    status: 'Active',
    importanceLevel: 'Moderate',
    tags: [],
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    version: 1,
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
    nextTriggerAt: null,
    ...overrides,
  } as ReminderTemplateClientDTO;
}

function createGroup(overrides: Partial<ReminderGroupClientDTO> = {}): ReminderGroupClientDTO {
  return {
    id: 'group-1' as ReminderGroupClientDTO['id'],
    identityId: 'identity-1' as ReminderGroupClientDTO['identityId'],
    name: 'Focus',
    description: 'Deep work reminders',
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
    ...overrides,
  } as ReminderGroupClientDTO;
}

function createPreferences(
  overrides: Partial<UserReminderPreferencesClientDTO> = {},
): UserReminderPreferencesClientDTO {
  return {
    id: 'pref-1' as UserReminderPreferencesClientDTO['id'],
    identityId: 'identity-1' as UserReminderPreferencesClientDTO['identityId'],
    bestTimeSlots: [],
    worstTimeSlots: [],
    globalReminderEnabled: true,
    globalSmartFrequency: false,
    createdAt: 0,
    updatedAt: 0,
    bestTimeSlotsText: '',
    worstTimeSlotsText: '',
    summaryText: 'Global reminders are enabled.',
    ...overrides,
  };
}

function mountView() {
  return mount(ReminderLinearView, {
    global: {
      plugins: [i18n],
      stubs: {
        GridTemplateItem: true,
        ReminderTemplateCard: TemplateDesktopCardStub,
        TemplateDialog: TemplateDialogStub,
        GroupDialog: GroupDialogStub,
        TemplateMoveDialog: TemplateMoveDialogStub,
      },
    },
  });
}

describe('ReminderLinearView', () => {
  afterEach(() => {
    templatesRef.value = [];
    groupsRef.value = [];
    preferencesRef.value = null;
    fetchTemplates.mockClear();
    fetchGroups.mockClear();
    fetchPreferences.mockClear();
    updatePreferences.mockClear();
    moveTemplateToGroup.mockClear();
    toggleTemplate.mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it('shows the global-off banner and grouped lifecycle summaries', async () => {
    groupsRef.value = [createGroup()];
    templatesRef.value = [
      createTemplate({
        id: 'template-global' as ReminderTemplateClientDTO['id'],
        lifecycleSource: 'global',
        effectiveEnabled: false,
        effectiveEnabledReason: 'Global reminder switch is off.',
      }),
      createTemplate({
        id: 'template-group' as ReminderTemplateClientDTO['id'],
        name: 'Afternoon review',
        lifecycleSource: 'group',
        selfEnabled: true,
        effectiveEnabled: false,
        effectiveEnabledReason: 'Group is paused.',
      }),
    ];
    preferencesRef.value = createPreferences({
      globalReminderEnabled: false,
      summaryText: 'All reminders are paused by the master switch.',
    });

    const wrapper = mountView();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('The master reminder switch is off');
    expect(wrapper.text()).toContain('All reminders are paused by the master switch.');
    expect(wrapper.text()).toContain('1 reminders paused by master switch');

    const clickableGroups = wrapper
      .findAll('div')
      .filter(
        (node) =>
          node.attributes('class')?.includes('cursor-pointer') &&
          node.text().includes('Focus') &&
          node.text().includes('1 reminders paused by master switch'),
      );
    expect(clickableGroups.length).toBeGreaterThan(0);

    await clickableGroups[0].trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Group switch decides whether reminders run.');
    expect(wrapper.text()).toContain('2 templates');
    expect(wrapper.text()).toContain('1 active');
  });

  it('shows root move toast and refreshes selected template when move succeeds', async () => {
    const movedTemplate = createTemplate({
      id: 'template-1' as ReminderTemplateClientDTO['id'],
      groupId: null,
      groupName: null,
      lifecycleSource: 'template',
      effectiveEnabledReason: 'Template controls itself after moving to root.',
    });
    moveTemplateToGroup.mockImplementationOnce(async () => {
      templatesRef.value = [movedTemplate];
      return movedTemplate;
    });

    const TemplateMoveDialogInteractiveStub = defineComponent({
      name: 'TemplateMoveDialogInteractiveStub',
      props: ['template'],
      emits: ['moved'],
      setup(props, { emit }) {
        return () =>
          h('button', {
            type: 'button',
            'data-stub': 'trigger-root-move',
            onClick: () => emit('moved', props.template.id, null),
          });
      },
    });

    const TemplateDesktopCardInteractiveStub = defineComponent({
      name: 'TemplateDesktopCardInteractiveStub',
      props: ['template'],
      setup(props) {
        return () =>
          h('div', { 'data-stub': 'selected-template-card' }, props.template?.groupName || 'root');
      },
    });

    groupsRef.value = [createGroup()];
    templatesRef.value = [createTemplate()];
    preferencesRef.value = createPreferences();

    const wrapper = mount(ReminderLinearView, {
      global: {
        plugins: [i18n],
        stubs: {
          GridTemplateItem: true,
          ReminderTemplateCard: TemplateDesktopCardInteractiveStub,
          TemplateDialog: TemplateDialogStub,
          GroupDialog: GroupDialogStub,
          TemplateMoveDialog: TemplateMoveDialogInteractiveStub,
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      handleTemplateClick: (template: { id: string }) => void;
      handleMoveTemplate: (template: { id: string }) => void;
      templateCardRef?: { open: () => void };
      templateMoveDialogRef?: { open: () => void };
    };
    vm.templateCardRef = { open: vi.fn() };
    vm.templateMoveDialogRef = { open: vi.fn() };

    await nextTick();

    vm.handleTemplateClick({ id: 'template-1' as ReminderTemplateClientDTO['id'] });
    vm.handleMoveTemplate({ id: 'template-1' as ReminderTemplateClientDTO['id'] });
    await nextTick();

    await wrapper.find('[data-stub="trigger-root-move"]').trigger('click');
    await nextTick();

    expect(moveTemplateToGroup).toHaveBeenCalledWith('template-1', null);
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Reminder moved back to root');
    expect(wrapper.find('[data-stub="selected-template-card"]').text()).toBe('root');
  });

  it('refreshes the selected template card immediately after toggling the self switch', async () => {
    const toggledTemplate = createTemplate({
      id: 'template-1' as ReminderTemplateClientDTO['id'],
      selfEnabled: false,
      effectiveEnabled: false,
      lifecycleSource: 'template',
      effectiveEnabledReason: 'Template self switch is paused.',
    });

    toggleTemplate.mockImplementationOnce(async () => {
      templatesRef.value = [toggledTemplate];
      return toggledTemplate;
    });

    const TemplateDesktopCardInteractiveStub = defineComponent({
      name: 'TemplateDesktopCardInteractiveStub',
      props: ['template'],
      setup(props) {
        return () =>
          h(
            'div',
            { 'data-stub': 'selected-template-card' },
            `${props.template?.selfEnabled ? 'self-on' : 'self-off'}|${
              props.template?.effectiveEnabled ? 'running' : 'paused'
            }`,
          );
      },
    });

    templatesRef.value = [createTemplate()];
    preferencesRef.value = createPreferences();

    const wrapper = mount(ReminderLinearView, {
      global: {
        plugins: [i18n],
        stubs: {
          GridTemplateItem: true,
          ReminderTemplateCard: TemplateDesktopCardInteractiveStub,
          TemplateDialog: TemplateDialogStub,
          GroupDialog: GroupDialogStub,
          TemplateMoveDialog: TemplateMoveDialogStub,
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      handleTemplateClick: (template: { id: string }) => void;
      handleToggleEnabled: (template: { id: string }) => Promise<void>;
      templateCardRef?: { open: () => void };
    };
    vm.templateCardRef = { open: vi.fn() };

    await nextTick();

    vm.handleTemplateClick({ id: 'template-1' as ReminderTemplateClientDTO['id'] });
    await nextTick();
    expect(wrapper.find('[data-stub="selected-template-card"]').text()).toBe('self-on|running');

    await vm.handleToggleEnabled({ id: 'template-1' as ReminderTemplateClientDTO['id'] });
    await nextTick();

    expect(wrapper.find('[data-stub="selected-template-card"]').text()).toBe('self-off|paused');
  });

  it('shows paused toast when a template stays overridden by group control', async () => {
    const toggledTemplate = createTemplate({
      id: 'template-1' as ReminderTemplateClientDTO['id'],
      selfEnabled: false,
      effectiveEnabled: false,
      lifecycleSource: 'group',
      effectiveEnabledReason: 'Group is paused.',
    });

    toggleTemplate.mockResolvedValueOnce(toggledTemplate);
    groupsRef.value = [createGroup({ enabled: false })];
    templatesRef.value = [createTemplate({ lifecycleSource: 'group', effectiveEnabled: false })];
    preferencesRef.value = createPreferences();

    const wrapper = mountView();
    await nextTick();

    const vm = wrapper.vm as unknown as {
      handleToggleEnabled: (template: { id: string }) => Promise<void>;
    };

    await vm.handleToggleEnabled({ id: 'template-1' as ReminderTemplateClientDTO['id'] });

    expect(toggleTemplate).toHaveBeenCalledWith('template-1');
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('paused');
  });

  it('shows enabled toast when global reminder is turned back on', async () => {
    updatePreferences.mockResolvedValueOnce(createPreferences({ globalReminderEnabled: true }));
    preferencesRef.value = createPreferences({ globalReminderEnabled: false });

    const wrapper = mountView();
    await nextTick();

    const vm = wrapper.vm as unknown as {
      handleToggleGlobalReminder: (enabled: boolean) => Promise<void>;
    };

    await vm.handleToggleGlobalReminder(true);

    expect(updatePreferences).toHaveBeenCalledWith({ globalReminderEnabled: true });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('enabled');
  });
});
