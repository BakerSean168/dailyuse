/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { computed, defineComponent, h, inject, nextTick, onMounted, Teleport } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHELL_WORKFLOW_MOUNT_KEY } from '../../di/keys';
import AppShell from './AppShell.vue';
import BusinessPanel from './BusinessPanel.vue';
import { useAppShellStore } from './useAppShellStore';

vi.mock('../../modules/notification/composables/useNotification', async () => {
  const { ref: vueRef } = await import('vue');
  return {
    useNotification: () => ({
      unreadCount: vueRef(0),
      refreshStats: vi.fn(async () => undefined),
    }),
  };
});

vi.mock('../../modules/dashboard/composables/useDashboard', async () => {
  const { ref: vueRef } = await import('vue');
  return {
    useDashboard: () => ({
      stats: vueRef({ activeGoals: 0, activeTasks: 0, upcomingReminders: 0 }),
      fetchDashboard: vi.fn(async () => undefined),
    }),
  };
});

vi.mock('../../modules/schedule/composables/useCalendarView', () => ({
  formatScheduleCapsuleLabel: () => '',
  useCalendarView: () => ({
    getScheduleCapsuleSnapshot: () => null,
    ensureTodayLoaded: vi.fn(async () => undefined),
  }),
}));

vi.mock('../../modules/authentication/composables/useAuth', async () => {
  const { ref: vueRef } = await import('vue');
  return {
    useAuth: () => ({
      isAuthenticated: vueRef(false),
      logout: vi.fn(async () => undefined),
    }),
  };
});

vi.mock('../../shared/composables/useDesktopWindowControls', () => ({
  useDesktopWindowControls: () => ({
    windowControlsState: { isMaximized: false },
    startListening: vi.fn(),
    stopListening: vi.fn(),
    minimizeWindow: vi.fn(),
    toggleMaximize: vi.fn(),
    closeWindow: vi.fn(),
  }),
}));

vi.mock('../../shared/utils/desktop-auth-recovery', () => ({
  hasDesktopAuthApi: () => false,
}));

const passThrough = (name: string) =>
  defineComponent({
    name,
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

const AIChatViewStub = defineComponent({
  name: 'AIChatView',
  setup(_props, { expose }) {
    const workflowMount = inject(SHELL_WORKFLOW_MOUNT_KEY)!;
    const target = computed(() => workflowMount.value);
    expose({ conversationList: [], conversationListLoading: false, chatConversationId: null });

    return () =>
      h('div', { 'data-testid': 'ai-chat-view' }, [
        target.value
          ? h(
              Teleport,
              { to: target.value },
              h('div', { 'data-testid': 'workflow-teleport-probe' }, 'Workflow'),
            )
          : null,
      ]);
  },
});

const ConversationSidebarStub = defineComponent({
  name: 'ConversationSidebar',
  setup() {
    return () => h('aside', { 'data-testid': 'conversation-sidebar' });
  },
});

const TodayOverviewPanelStub = defineComponent({
  name: 'TodayOverviewPanel',
  props: ['active'],
  setup() {
    return () => h('div', { 'data-testid': 'today-overview-panel' }, 'Today');
  },
});

let goalRouteMountCount = 0;
const GoalRouteProbe = defineComponent({
  name: 'GoalRouteProbe',
  setup() {
    onMounted(() => {
      goalRouteMountCount += 1;
    });
    return () => h('div', { 'data-testid': 'goal-draft-probe' });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { untitled: 'Untitled' },
      nav: {
        capsule: {
          goal: 'Goals',
          task: 'Tasks',
          note: 'Notes',
          reminder: 'Reminders',
          notification: 'Notifications',
        },
        schedule: 'Schedule',
      },
      shell: {
        conversation: { today: 'Today', last7Days: 'Last 7 days', earlier: 'Earlier' },
        panel: {
          home: 'Today',
          workflow: 'Workflow',
          closeWorkflow: 'Close workflow',
          closeTab: 'Close tab',
          closePanel: 'Close panel',
          enterFocus: 'Enter focus',
          exitFocus: 'Exit focus',
        },
      },
    },
  },
});

async function mountShell(initialPath = '/') {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/goals', component: GoalRouteProbe },
    ],
  });
  await router.push(initialPath);
  await router.isReady();

  const wrapper = mount(AppShell, {
    global: {
      plugins: [pinia, router, i18n],
      stubs: {
        AIChatView: AIChatViewStub,
        WindowHeader: true,
        ConversationSidebar: ConversationSidebarStub,
        BusinessPanel,
        TodayOverviewPanel: TodayOverviewPanelStub,
        PanelErrorBoundary: passThrough('PanelErrorBoundary'),
        GlobalComposer: true,
        StandaloneSettingsLayout: passThrough('StandaloneSettingsLayout'),
      },
    },
  });
  await nextTick();
  return { wrapper, router, store: useAppShellStore() };
}

describe('AppShell right-panel integration', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    goalRouteMountCount = 0;
  });

  it('mounts Home by default and teleports AI workflow content into the canonical panel', async () => {
    const { wrapper } = await mountShell();

    expect(wrapper.get('[data-testid="today-overview-panel"]').exists()).toBe(true);
    const workflowSurface = wrapper.get('[data-testid="shell-workflow-surface"]');
    expect(workflowSurface.find('[data-testid="workflow-teleport-probe"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('keeps the panel DOM mounted while hidden and keeps Focus independent from the sidebar', async () => {
    const { wrapper, router, store } = await mountShell();
    await router.push('/goals');
    await nextTick();
    const businessPanel = wrapper.get('[data-testid="business-panel"]').element;

    store.closeRightPanel();
    await nextTick();
    expect(wrapper.get('[data-testid="business-panel"]').element).toBe(businessPanel);
    expect(wrapper.get('[data-testid="goal-draft-probe"]').exists()).toBe(true);

    store.toggleRightPanel();
    store.toggleFocus();
    await nextTick();
    expect(wrapper.get('[data-testid="conversation-sidebar"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="app-shell"]').attributes('data-shell-state')).toBe('focus');
    wrapper.unmount();
  });

  it('mounts a cold business deep link once after creating its shell tab', async () => {
    const { wrapper, store } = await mountShell('/goals');
    await nextTick();

    expect(store.activeTab?.route).toBe('/goals');
    expect(goalRouteMountCount).toBe(1);
    wrapper.unmount();
  });
});
