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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { inject } from 'vue';
import { MODULE_CAPSULES_KEY } from '../../di/keys';
import { defaultModuleCapsules } from '../../di/navigation';
import { useAppShellStore, MAX_BUSINESS_TABS, type ShellModule } from './useAppShellStore';
import { useShellRouterSync } from './useShellRouterSync';
import { useDesktopWindowControls } from '../../shared/composables/useDesktopWindowControls';
import { useNotification } from '../../modules/notification/composables/useNotification';
import { useAuthenticationStore } from '../../modules/authentication/stores/authentication-store';
import AIChatView from '../../modules/ai/views/AIChatView.vue';
import type { ConversationSummary } from '../../modules/ai/composables/types';
import WindowHeader from './WindowHeader.vue';
import ConversationSidebar from './ConversationSidebar.vue';
import BusinessPanel from './BusinessPanel.vue';

const { t } = useI18n();
const router = useRouter();
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
const activeModule = computed<string | null>(() => activeTab.value?.module ?? null);

// ── AI 常驻层（单实例；会话侧栏数据经 defineExpose 上浮） ──
const aiRef = ref<InstanceType<typeof AIChatView> | null>(null);

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

// ── 用户名（侧栏底部头像，→ 设置面板） ──
const authStore = useAuthenticationStore();
const userName = computed<string | undefined>(() => {
  const identifier = authStore.currentIdentity?.identifiers?.[0] as
    | { value?: string }
    | undefined;
  return identifier?.value || undefined;
});

// ── 通知未读角标（SSE 启动钩子推流，胶囊消费；V2 §8-7） ──
const notification = useNotification();

// ── 桌面窗控（既有 IPC 通道，V2 §9；Web 分支不渲染按钮） ──
const windowControls = useDesktopWindowControls();

onMounted(() => {
  void notification.refreshStats();
  if (isDesktop) windowControls.startListening();
});

onBeforeUnmount(() => {
  if (isDesktop) windowControls.stopListening();
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

function startPanelResize(e: MouseEvent) {
  e.preventDefault();
  const move = (ev: MouseEvent) => store.setPanelWidth(window.innerWidth - ev.clientX);
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}

// ── 胶囊 / 面板动作（导航细节在 useShellRouterSync） ──
function enterModule(id: string) {
  const capsule = capsules.find((item) => item.id === id);
  if (!capsule) return;
  void sync.openModule(capsule.id as ShellModule, capsule.route);
}

function openSchedule() {
  void sync.openModule('schedule', '/schedule/calendar');
}

function openSettings() {
  void sync.openModule('setting', '/settings');
}

/**
 * KeepAlive 缓存键 = 拥有该路由的 Tab id（同模块多 Tab 各自保活）。
 * 过渡帧里路由还停在旧 Tab 的路由上时，归属仍解析到旧 Tab，避免缓存串键。
 */
function panelTabKey(fullPath: string): string {
  return (
    tabs.value.find((tab) => tab.route === fullPath)?.id ?? activeTabId.value ?? 'panel'
  );
}
</script>

<template>
  <div
    class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground"
    :data-shell-state="shellState"
  >
    <!-- 顶部窗口栏：胶囊导航 + 日程胶囊 + 窗控 -->
    <WindowHeader
      :sidebar-collapsed="sidebarCollapsed"
      :active-module="activeModule"
      :unread-count="notification.unreadCount.value"
      :schedule-label="null"
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

    <!-- 主工作区 -->
    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <!-- 会话侧栏（A/B 态显示，C 态隐藏） -->
      <ConversationSidebar
        v-if="showSidebar"
        class="shrink-0"
        :style="{ width: sidebarWidth + 'px' }"
        :groups="conversationGroups"
        :active-conversation-id="activeConversationId"
        :user-name="userName"
        :loading="Boolean(aiRef?.conversationListLoading)"
        :is-desktop="isDesktop"
        @new-conversation="handleNewConversation"
        @select-conversation="handleSelectConversation"
        @delete-conversation="handleDeleteConversation"
        @open-search="handleNewConversation"
        @open-settings="openSettings"
        @open-help="openSettings"
        @start-resize="startSidebarResize"
      />

      <!-- 中央区：AI 常驻层 + 业务面板。
           三态只换 flex 方向与 order，AI 实例永不卸载（流式不中断）。 -->
      <div
        class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden"
        :class="shellState === 'focus' ? 'flex-col' : 'flex-row'"
      >
        <!-- AI 工作区（A/B 满列；C 退化为底部 Composer 条） -->
        <div
          :class="
            shellState === 'focus'
              ? 'order-2 w-full shrink-0 border-t border-border'
              : 'order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
          "
        >
          <AIChatView
            ref="aiRef"
            class="h-full w-full"
            hide-conversation-sidebar
            :composer-only="shellState === 'focus'"
          />
        </div>

        <!-- 业务面板（B 态右侧固定宽；C 态满屏） -->
        <div
          v-if="showPanel"
          :class="
            shellState === 'focus'
              ? 'order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
              : 'order-2 hidden h-full min-h-0 shrink-0 flex-col overflow-hidden md:flex'
          "
          :style="shellState === 'split' ? { width: panelWidth + 'px' } : undefined"
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
          >
            <router-view v-slot="{ Component }">
              <KeepAlive :max="MAX_BUSINESS_TABS">
                <component :is="Component" v-if="Component" :key="panelTabKey($route.fullPath)" />
              </KeepAlive>
            </router-view>
          </BusinessPanel>
        </div>
      </div>
    </div>
  </div>
</template>
