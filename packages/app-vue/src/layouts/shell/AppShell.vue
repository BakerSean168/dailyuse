<script setup lang="ts">
/**
 * AppShell（UI 重构 V2 壳容器）
 *
 * ChatGPT 桌面式壳的三态布局根组件（docs/UI_REDESIGN_V2_PLAN.md §1.1 / §2），
 * S1 起取代 MainLayout 成为主路由树的父组件：
 *
 *   STATE A 纯 AI 态   = 无业务 Tab（store.isChatOnly）
 *   STATE B 分栏并行态 = 有 Tab 且 layout === 'split'
 *   STATE C 业务专注态 = 有 Tab 且 layout === 'focus'（侧栏隐藏、面板满屏）
 *
 * 接线：
 * - <router-view>（业务子路由）在 BusinessPanel 内渲染，KeepAlive 按 Tab 保活；
 * - AI 工作区 = AIChatView 常驻实例（不经路由）。三态切换只换 CSS
 *   （order / v-show），实例永不卸载——切专注态不打断流式回复；
 * - Router ↔ Tab 双向同步走 useShellRouterSync（V2 §4）；
 * - 会话侧栏消费 AIChatView defineExpose 的会话状态（单一 chat session）；
 * - 桌面窗控走 useDesktopWindowControls（Web 端不渲染，V2 决策 #6）。
 */
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { inject } from 'vue';
import { MODULE_CAPSULES_KEY } from '../../di/keys';
import { defaultModuleCapsules } from '../../di/navigation';
import { useAppShellStore, MAX_BUSINESS_TABS, type ShellModule } from './useAppShellStore';
import { useShellRouterSync, AUTO_FOCUS_VIEWPORT } from './useShellRouterSync';
import { useDesktopWindowControls } from '../../shared/composables/useDesktopWindowControls';
import { useNotification } from '../../modules/notification/composables/useNotification';
import { useDashboard } from '../../modules/dashboard/composables/useDashboard';
import { formatScheduleCapsuleLabel, useCalendarView } from '../../modules/schedule/composables/useCalendarView';
import { useAuthenticationStore } from '../../modules/authentication/stores/authentication-store';
import { useAuth } from '../../modules/authentication/composables/useAuth';
import AIChatView from '../../modules/ai/views/AIChatView.vue';
import type { ConversationSummary } from '../../modules/ai/composables/types';
import WindowHeader from './WindowHeader.vue';
import ConversationSidebar from './ConversationSidebar.vue';
import BusinessPanel from './BusinessPanel.vue';
import PanelErrorBoundary from './PanelErrorBoundary.vue';
import GlobalComposer from './GlobalComposer.vue';
import StandaloneSettingsLayout from './StandaloneSettingsLayout.vue';
import {
  COMPOSER_BOTTOM_GAP,
  computePanelGeometry,
  panelWidthFromPointer,
  resolveComposerDensity,
  type ComposerDensity,
} from './panel-geometry';
import { SHELL_COMPOSER_DENSITY_KEY, SHELL_COMPOSER_MOUNT_KEY } from '../../di/keys';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const store = useAppShellStore();
const { tabs, activeTabId, activeTab, isChatOnly, layout, sidebarCollapsed, sidebarWidth, panelWidth } =
  storeToRefs(store);

const sync = useShellRouterSync();

// ── 宿主环境（沿 isDesktopEnvironment 分支模式，V2 决策 #6） ──
const isDesktop =
  typeof window !== 'undefined' &&
  !!(window as Window & { electronAPI?: unknown }).electronAPI;
const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const capsules = inject(MODULE_CAPSULES_KEY, defaultModuleCapsules) ?? defaultModuleCapsules;

const shellScene = computed<'workspace' | 'settings'>(() => {
  if (route.meta.shellScene === 'settings' || route.path === '/settings' || route.path.startsWith('/settings/') || route.path.startsWith('/account')) {
    return 'settings';
  }
  return 'workspace';
});

const isSettingsScene = computed(() => shellScene.value === 'settings');


/** STATE A/B/C 派生（§1.1）。 */
const shellState = computed<'chat' | 'split' | 'focus'>(() => {
  if (isChatOnly.value) return 'chat';
  return layout.value === 'focus' ? 'focus' : 'split';
});

/** 侧栏在专注态隐藏（C 态），或用户手动折叠。 */
const showSidebar = computed(() => shellState.value !== 'focus' && !sidebarCollapsed.value);
/** 业务面板仅在有 Tab（B/C 态）时渲染。 */
const showPanel = computed(() => shellState.value !== 'chat');
/** 当前激活模块 id（胶囊高亮）。 */
const activeModule = computed<string | null>(() => (isSettingsScene.value ? null : activeTab.value?.module ?? null));

// ── AI 常驻层（单实例；会话侧栏数据经 defineExpose 上浮） ──
const aiRef = ref<InstanceType<typeof AIChatView> | null>(null);

// ── Global Composer host (§8)：壳拥有布局，AIChatView Teleport 真实输入 ──
const shellComposerMount = shallowRef<HTMLElement | null>(null);
const shellComposerDensity = ref<ComposerDensity>('comfortable');
const composerHeight = ref(0);
const workspaceMainRef = ref<HTMLElement | null>(null);
const aiColumnRef = ref<HTMLElement | null>(null);
const workspaceMainWidth = ref(0);
const aiColumnWidth = ref(0);
provide(SHELL_COMPOSER_MOUNT_KEY, shellComposerMount);
provide(SHELL_COMPOSER_DENSITY_KEY, shellComposerDensity);

const composerMode = computed(() => (shellState.value === 'focus' ? 'floating' : 'inline'));
const composerHostWidth = computed(() =>
  composerMode.value === 'floating' ? workspaceMainWidth.value : aiColumnWidth.value,
);
const focusComposerPad = computed(() => {
  if (shellState.value !== 'focus') return 0;
  return Math.max(composerHeight.value, 56) + COMPOSER_BOTTOM_GAP;
});

function onComposerHeightChange(height: number) {
  composerHeight.value = height;
}

function measureComposerHosts() {
  if (typeof window === 'undefined') return;
  workspaceMainWidth.value = workspaceMainRef.value?.clientWidth ?? 0;
  aiColumnWidth.value = aiColumnRef.value?.clientWidth ?? 0;
  shellComposerDensity.value = resolveComposerDensity(
    composerHostWidth.value || workspaceMainWidth.value,
    composerMode.value,
  );
}

let hostResizeObserver: ResizeObserver | null = null;

function bindHostResizeObserver() {
  hostResizeObserver?.disconnect();
  hostResizeObserver = null;
  if (typeof ResizeObserver === 'undefined') return;
  hostResizeObserver = new ResizeObserver(() => measureComposerHosts());
  if (workspaceMainRef.value) hostResizeObserver.observe(workspaceMainRef.value);
  if (aiColumnRef.value) hostResizeObserver.observe(aiColumnRef.value);
  measureComposerHosts();
}

const conversations = computed<ConversationSummary[]>(
  () => (aiRef.value?.conversationList ?? []) as ConversationSummary[],
);

function conversationTimestamp(item: ConversationSummary): number {
  const raw =
    (item as { lastMessageAt?: unknown }).lastMessageAt ??
    (item as { updatedAt?: unknown }).updatedAt ??
    (item as { createdAt?: unknown }).createdAt ??
    0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

/** 今天 / 近 7 天 / 更早（本地时区自然日边界，V2 §5）。 */
const conversationGroups = computed(() => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const weekMs = todayMs - 6 * 24 * 60 * 60 * 1000;

  const buckets: Record<'today' | 'last7Days' | 'earlier', { id: string; title: string }[]> = {
    today: [],
    last7Days: [],
    earlier: [],
  };
  for (const item of conversations.value) {
    const ts = conversationTimestamp(item);
    const entry = {
      id: String(item.id),
      title: (item as { name?: string }).name || t('common.untitled'),
    };
    if (ts >= todayMs) buckets.today.push(entry);
    else if (ts >= weekMs) buckets.last7Days.push(entry);
    else buckets.earlier.push(entry);
  }
  return (
    [
      { labelKey: 'shell.conversation.today', items: buckets.today },
      { labelKey: 'shell.conversation.last7Days', items: buckets.last7Days },
      { labelKey: 'shell.conversation.earlier', items: buckets.earlier },
    ] as const
  ).filter((group) => group.items.length > 0);
});

const activeConversationId = computed<string | null>(
  () => (aiRef.value?.chatConversationId as string | undefined) || null,
);

async function handleSelectConversation(id: string) {
  const summary = conversations.value.find((item) => String(item.id) === id);
  if (!summary) return;
  await aiRef.value?.selectConversation(summary);
}

function handleDeleteConversation(id: string) {
  void aiRef.value?.deleteConversation(id);
}

/** 「新对话」= 新建会话 + 关面板回 STATE A（V2 §5）。 */
async function handleNewConversation() {
  aiRef.value?.startNewConversation('chat');
  await sync.goHome();
}

// ── 用户 / 账户入口（侧栏底部菜单，§9） ──
const authStore = useAuthenticationStore();
const { isAuthenticated, logout } = useAuth();
const userName = computed<string | undefined>(() => {
  const identifier = authStore.currentIdentity?.identifiers?.[0] as
    | { value?: string }
    | undefined;
  return identifier?.value || undefined;
});

const needsEmailVerification = computed(
  () => isAuthenticated.value && authStore.currentIdentity?.status === 'Unverified',
);

function goVerifyEmail() {
  void router.push({ path: '/auth', query: { scene: 'verify-email' } });
}

// ── 通知未读角标（SSE 启动钩子推流，胶囊消费；V2 §8-7） ──
const notification = useNotification();
const dashboard = useDashboard();
const badgeCounts = computed<Record<string, number>>(() => ({
  goal: dashboard.stats.value.activeGoals ?? 0,
  task: dashboard.stats.value.activeTasks ?? 0,
  reminder: dashboard.stats.value.upcomingReminders ?? 0,
}));

// 日程胶囊实时文案（V2 §2 / §6.3）：当前时段或下一事件，每分钟刷新。
const calendarView = useCalendarView();
const scheduleNowMs = ref(Date.now());
let scheduleTickTimer: ReturnType<typeof setInterval> | null = null;
const scheduleLabel = computed(() =>
  formatScheduleCapsuleLabel(calendarView.getScheduleCapsuleSnapshot(scheduleNowMs.value), t),
);


// ── 桌面窗控（既有 IPC 通道，V2 §9；Web 分支不渲染按钮） ──
const windowControls = useDesktopWindowControls();

onMounted(() => {
  void notification.refreshStats();
  void dashboard.fetchDashboard();
  if (isDesktop) windowControls.startListening();
  void calendarView.ensureTodayLoaded(scheduleNowMs.value);
  scheduleTickTimer = setInterval(() => {
    scheduleNowMs.value = Date.now();
    void calendarView.ensureTodayLoaded(scheduleNowMs.value);
  }, 60_000);
});

onBeforeUnmount(() => {
  if (isDesktop) windowControls.stopListening();
  if (scheduleTickTimer) {
    clearInterval(scheduleTickTimer);
    scheduleTickTimer = null;
  }
});

// ── 拖拽调宽（侧栏 / 面板），状态回写 store ──
function startSidebarResize(e: MouseEvent) {
  e.preventDefault();
  const move = (ev: MouseEvent) => store.setSidebarWidth(ev.clientX);
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}

function occupiedSidebarWidth(): number {
  return showSidebar.value ? sidebarWidth.value : 0;
}

/** 分栏态会占用的侧栏宽度（不受 focus 隐藏影响，避免 canSplit 抖动）。 */
function prospectiveSidebarOccupied(): number {
  return sidebarCollapsed.value ? 0 : sidebarWidth.value;
}

function effectivePanelWidth(): number {
  if (typeof window === 'undefined') return panelWidth.value;
  return store.resolvePanelWidth(window.innerWidth, occupiedSidebarWidth());
}

/**
 * 视口/侧栏变化：
 * - 不回写用户偏好宽度（由 effectivePanelWidth 即时 clamp）
 * - viewport 触发的 focus 可在空间恢复后回到 split；user focus 保持
 */
function onViewportGeometryChange(): void {
  if (typeof window === 'undefined') return;
  if (store.isChatOnly) return;

  const geo = computePanelGeometry({
    viewportWidth: window.innerWidth,
    sidebarOccupiedWidth: prospectiveSidebarOccupied(),
  });
  // 窄视口或几何上无法保 CHAT_MIN+PANEL_MIN 时强制 viewport focus（§6.2）。
  const shouldFocus = window.innerWidth < AUTO_FOCUS_VIEWPORT || !geo.canSplit;

  if (shouldFocus) {
    if (store.layout !== 'focus') {
      store.setLayout('focus', 'viewport');
    }
    return;
  }

  if (store.layout === 'focus' && store.layoutReason === 'viewport') {
    store.setLayout('split', 'default');
  }
}

function startPanelResize(e: PointerEvent) {
  const focusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  e.preventDefault();
  const captureTarget =
    e.target instanceof Element
      ? (e.target.closest('[data-testid="business-panel-resizer"]') as HTMLElement | null) ??
        (e.target as HTMLElement)
      : null;
  try {
    captureTarget?.setPointerCapture?.(e.pointerId);
  } catch {
    // pointer capture 在部分测试/非指针设备上可能失败，忽略即可
  }

  const previousUserSelect = document.body.style.userSelect;
  const previousCursor = document.body.style.cursor;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';

  const move = (ev: PointerEvent) => {
    store.setPanelWidth(
      panelWidthFromPointer(ev.clientX, window.innerWidth, occupiedSidebarWidth()),
    );
  };
  const up = (ev: PointerEvent) => {
    try {
      captureTarget?.releasePointerCapture?.(ev.pointerId);
    } catch {
      // ignore
    }
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.style.userSelect = previousUserSelect;
    document.body.style.cursor = previousCursor;
    if (focusedElement?.isConnected && document.activeElement !== focusedElement) {
      focusedElement.focus({ preventScroll: true });
    }
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function resetPanelWidth(): void {
  if (typeof window === 'undefined') return;
  const geo = computePanelGeometry({
    viewportWidth: window.innerWidth,
    sidebarOccupiedWidth: occupiedSidebarWidth(),
  });
  store.setPanelWidth(geo.defaultPanelWidth);
}

onMounted(() => {
  onViewportGeometryChange();
  window.addEventListener('resize', onViewportGeometryChange);
  bindHostResizeObserver();
  window.addEventListener('resize', measureComposerHosts);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportGeometryChange);
  window.removeEventListener('resize', measureComposerHosts);
  hostResizeObserver?.disconnect();
  hostResizeObserver = null;
});

// 侧栏折叠/改宽后重新派生有效面板宽（偏好不变，渲染层读 effectivePanelWidth）
watch([showSidebar, sidebarWidth, sidebarCollapsed, shellState, panelWidth], () => {
  measureComposerHosts();
});

watch([workspaceMainRef, aiColumnRef], () => {
  bindHostResizeObserver();
});

watch([showSidebar, sidebarWidth, sidebarCollapsed], () => {
  // 触发一次布局派生，便于 focus 自动恢复规则与宽度消费保持一致
  onViewportGeometryChange();
});

// ── 胶囊 / 面板动作（导航细节在 useShellRouterSync） ──
function enterModule(id: string) {
  const capsule = capsules.find((item) => item.id === id);
  if (!capsule) return;
  void sync.openModule(capsule.id as ShellModule, capsule.route);
}

function openSchedule() {
  // Schedule 与其它业务模块统一入口规则，不再强制 focus。
  void sync.openModule('schedule', '/schedule/calendar');
}


function openSettings(path = '/settings') {
  void sync.openSettings(path);
}

function openAccount() {
  void sync.openSettings('/settings?tab=account');
}

function openLogin() {
  void router.push('/auth').catch(() => {});
}

async function handleLogout() {
  await logout();
}

function returnFromSettings() {
  void sync.returnFromSettings();
}

/**
 * KeepAlive 缓存键 = 拥有该路由的 Tab id + 路由 name。
 * - Tab 维度：同模块多 Tab 各自保活（两个 note Tab 互不串状态）；
 * - 路由 name 维度：KeepAlive 对"同 key 不同组件类型"会复用错组件实例
 *   （parentComponent.ctx.deactivate 崩溃），Tab 内导航（列表 → 详情）
 *   组件类型会变，必须把视图身份编进 key。
 * 过渡帧里路由还停在旧 Tab 的路由上时，归属仍解析到旧 Tab，避免缓存串键。
 */
function panelCacheKey(fullPath: string, routeName: unknown): string {
  const owner =
    tabs.value.find((tab) => tab.route === fullPath)?.id ?? activeTabId.value ?? 'panel';
  return `${owner}:${String(routeName ?? fullPath)}`;
}
</script>

<template>
  <div
    class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground"
    data-testid="app-shell"
    :data-shell-state="isSettingsScene ? 'settings' : shellState"
    :data-shell-scene="shellScene"
  >
    <div
      v-if="needsEmailVerification"
      data-testid="unverified-email-banner"
      class="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100"
      role="status"
    >
      <span>{{ t('shell.auth.unverifiedBanner', 'Verify your email to unlock all features.') }}</span>
      <button
        type="button"
        class="rounded-md bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-50 hover:bg-amber-400/30"
        data-testid="unverified-email-banner-action"
        @click="goVerifyEmail"
      >
        {{ t('shell.auth.unverifiedAction', 'Verify now') }}
      </button>
    </div>

    <!-- 顶部窗口栏：胶囊导航 + 日程胶囊 + 窗控 -->
    <WindowHeader
      :mode="isSettingsScene ? 'settings' : 'workspace'"
      :sidebar-collapsed="sidebarCollapsed"
      :active-module="activeModule"
      :unread-count="notification.unreadCount.value"
      :badge-counts="badgeCounts"
      :schedule-label="scheduleLabel"
      :is-desktop="isDesktop"
      :is-mac="isMac"
      :window-controls="windowControls.windowControlsState"
      @toggle-sidebar="store.toggleSidebar()"
      @go-back="router.back()"
      @go-forward="router.forward()"
      @enter-module="enterModule"
      @open-schedule="openSchedule"
      @window-minimize="windowControls.minimizeWindow()"
      @window-toggle-maximize="windowControls.toggleMaximize()"
      @window-close="windowControls.closeWindow()"
    />

    <!-- STATE D：独立设置场景。与 workspace 互斥挂载，避免双 router-view 同渲。
         tabs/layout 由 store 保留，返回后按 store 恢复。 -->
    <StandaloneSettingsLayout
      v-if="isSettingsScene"
      class="min-h-0 flex-1"
      @return-to-app="returnFromSettings"
    >
      <router-view />
    </StandaloneSettingsLayout>

    <!-- 主工作区（STATE A/B/C） -->
    <div v-else class="relative flex min-h-0 flex-1 overflow-hidden">
      <!-- 会话侧栏（A/B 态显示，C 态隐藏） -->
      <ConversationSidebar
        v-if="showSidebar"
        class="shrink-0"
        :style="{ width: sidebarWidth + 'px' }"
        :groups="conversationGroups"
        :active-conversation-id="activeConversationId"
        :user-name="userName"
        :is-authenticated="isAuthenticated"
        :loading="Boolean(aiRef?.conversationListLoading)"
        :is-desktop="isDesktop"
        @new-conversation="handleNewConversation"
        @select-conversation="handleSelectConversation"
        @delete-conversation="handleDeleteConversation"
        @open-search="handleNewConversation"
        @open-settings="openSettings"
        @open-account="openAccount"
        @open-login="openLogin"
        @logout="() => void handleLogout()"
        @start-resize="startSidebarResize"
      />

      <!-- 中央区：AI 常驻层 + 业务面板 + GlobalComposer 宿主。
           三态只换 flex / 显隐，AI 实例永不卸载（流式不中断）。 -->
      <div
        ref="workspaceMainRef"
        data-testid="shell-workspace-main"
        class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden"
        :class="shellState === 'focus' ? 'flex-col' : 'flex-row'"
      >
        <!-- AI 工作区（A/B 满列；C 隐藏列但实例保活，Composer 改浮动宿主） -->
        <div
          v-show="shellState !== 'focus'"
          ref="aiColumnRef"
          data-testid="shell-ai-column"
          class="order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <AIChatView
            ref="aiRef"
            class="min-h-0 w-full flex-1"
            hide-conversation-sidebar
          />
          <GlobalComposer
            v-if="shellState !== 'focus'"
            mode="inline"
            :host-width="aiColumnWidth"
            @height-change="onComposerHeightChange"
          />
        </div>

        <!-- 业务面板（B 态右侧固定宽；C 态满屏 + Composer 底部安全区） -->
        <div
          v-if="showPanel"
          :class="
            shellState === 'focus'
              ? 'order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
              : 'order-2 hidden h-full min-h-0 shrink-0 flex-col overflow-hidden md:flex'
          "
          :style="{
            ...(shellState === 'split' ? { width: effectivePanelWidth() + 'px' } : {}),
            ...(shellState === 'focus' ? { paddingBottom: focusComposerPad + 'px' } : {}),
          }"
        >
          <BusinessPanel
            :tabs="tabs"
            :active-tab-id="activeTabId"
            :layout="layout"
            @activate-tab="(id: string) => void sync.activateTab(id)"
            @close-tab="(id: string) => void sync.closeTab(id)"
            @close-panel="() => void sync.closePanel()"
            @toggle-focus="store.toggleFocus()"
            @start-resize="startPanelResize"
            @reset-width="resetPanelWidth"
          >
            <PanelErrorBoundary :reset-key="activeTabId">
              <router-view v-slot="{ Component }">
                <KeepAlive :max="MAX_BUSINESS_TABS">
                  <component
                    :is="Component"
                    v-if="Component"
                    :key="panelCacheKey($route.fullPath, $route.name)"
                  />
                </KeepAlive>
              </router-view>
            </PanelErrorBoundary>
          </BusinessPanel>
        </div>

        <!-- STATE C：相对业务工作区宿主居中的浮动 Composer（§8.4） -->
        <GlobalComposer
          v-if="shellState === 'focus'"
          mode="floating"
          :host-width="workspaceMainWidth"
          @height-change="onComposerHeightChange"
        />
      </div>
    </div>
  </div>
</template>



