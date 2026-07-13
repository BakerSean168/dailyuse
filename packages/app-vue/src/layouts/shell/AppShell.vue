<script setup lang="ts">
/**
 * AppShell（UI 重构 V2 壳容器）
 *
 * ChatGPT 桌面式壳的三态布局根组件（docs/UI_REDESIGN_V2_PLAN.md §1.1 / §2）：
 *
 *   STATE A 纯 AI 态   = 无业务 Tab（store.isChatOnly）
 *   STATE B 分栏并行态 = 有 Tab 且 layout === 'split'
 *   STATE C 业务专注态 = 有 Tab 且 layout === 'focus'（侧栏隐藏、面板满屏）
 *
 * 组合 WindowHeader + ConversationSidebar + AIWorkspaceLayer(slot) +
 * BusinessPanel + GlobalComposer。视图状态全部走 useAppShellStore，
 * 组件内不持有本地布局 ref。
 *
 * ⚠ S0 骨架阶段：本组件"存在于树上、可编译、可交互（纯 store 操作），
 *    但尚未挂载到路由"。以下接线留待 S1：
 *    - router ↔ Tab 双向同步（enter-module / open-schedule 现只落 store，
 *      不 push 路由；Tab 内容区为 slot 占位，无 router-view）
 *    - AI 常驻层（ai-workspace slot 的真实内容 = AIWorkspaceLayer）
 *    - Composer 真实逻辑（composer slot 覆盖默认 GlobalComposer）
 *    - 会话列表数据 / 用户名 / 未读数 / 日程文案（现为空占位）
 *    - 桌面窗控 IPC（window-* 现为 no-op，S1 接 useDesktopWindowControls）
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useAppShellStore, type ShellModule } from './useAppShellStore';
import { defaultModuleCapsules } from '../../di/navigation';
import WindowHeader from './WindowHeader.vue';
import ConversationSidebar from './ConversationSidebar.vue';
import BusinessPanel from './BusinessPanel.vue';
import GlobalComposer from './GlobalComposer.vue';

const props = withDefaults(
  defineProps<{
    /** Web 端隐藏窗口控制/拖拽区（沿 isDesktopEnvironment 分支，V2 决策 #6）。 */
    isDesktop?: boolean;
  }>(),
  { isDesktop: false },
);

const { t } = useI18n();
const store = useAppShellStore();
const { tabs, activeTabId, activeTab, isChatOnly, layout, sidebarCollapsed, sidebarWidth, panelWidth } =
  storeToRefs(store);

/** STATE A/B/C 派生（§1.1）。 */
const shellState = computed<'chat' | 'split' | 'focus'>(() => {
  if (isChatOnly.value) return 'chat';
  return layout.value === 'focus' ? 'focus' : 'split';
});

/** 侧栏在专注态隐藏（C 态），或用户手动折叠。 */
const showSidebar = computed(() => shellState.value !== 'focus' && !sidebarCollapsed.value);
/** 业务面板仅在有 Tab（B/C 态）时渲染。 */
const showPanel = computed(() => shellState.value !== 'chat');
/** AI 工作区在专注态隐藏（面板满屏），A/B 态显示。 */
const showAiWorkspace = computed(() => shellState.value !== 'focus');
/** 当前激活模块 id（胶囊高亮）。 */
const activeModule = computed<string | null>(() => activeTab.value?.module ?? null);

// ── 拖拽调宽（侧栏 / 面板），逻辑参照原型 App.vue，状态回写 store ──
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

// ── 胶囊 / 面板交互（S0：纯 store 操作；S1 补 router.push + 深链） ──
function enterModule(id: string) {
  const capsule = defaultModuleCapsules.find((c) => c.id === id);
  if (!capsule) return;
  store.openTab({
    module: capsule.id as ShellModule,
    route: capsule.route,
    title: t(capsule.title),
    intent: 'capsule',
  });
}

function openSchedule() {
  store.openTab({
    module: 'schedule',
    route: '/schedule/calendar',
    title: t('nav.schedule'),
    intent: 'capsule',
  });
}

function openSettings() {
  // 设置默认以专注态打开（V2 §3）。
  store.openTab({
    module: 'setting',
    route: '/settings',
    title: t('nav.settings'),
    intent: 'capsule',
  });
  store.setLayout('focus');
}

function newConversation() {
  // 新对话 = 关面板回 STATE A（S1 补 useAIChatView 新建会话）。
  store.closeAllTabs();
}

// S1 接线的占位（router / IPC / AI）——S0 无操作。
const noop = () => {};
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
      :is-desktop="props.isDesktop"
      @toggle-sidebar="store.toggleSidebar()"
      @go-back="noop"
      @go-forward="noop"
      @enter-module="enterModule"
      @open-schedule="openSchedule"
      @window-minimize="noop"
      @window-toggle-maximize="noop"
      @window-close="noop"
    />

    <!-- 主工作区 -->
    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <!-- 会话侧栏（A/B 态显示，C 态隐藏）；width 走 style fallthrough 到根 aside -->
      <ConversationSidebar
        v-if="showSidebar"
        class="shrink-0"
        :style="{ width: sidebarWidth + 'px' }"
        :groups="[]"
        :active-conversation-id="null"
        :is-desktop="props.isDesktop"
        @new-conversation="newConversation"
        @select-conversation="noop"
        @open-search="noop"
        @open-settings="openSettings"
        @open-help="noop"
        @start-resize="startSidebarResize"
      />

      <!-- 中央区：AI 工作区 + 面板 -->
      <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <!-- ============ STATE C：业务面板满屏 ============ -->
        <template v-if="shellState === 'focus'">
          <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div class="min-h-0 flex-1 overflow-hidden">
              <BusinessPanel
                :tabs="tabs"
                :active-tab-id="activeTabId"
                :layout="layout"
                @activate-tab="store.activateTab($event)"
                @close-tab="store.closeTab($event)"
                @close-panel="store.closeAllTabs()"
                @toggle-focus="store.toggleFocus()"
                @start-resize="startPanelResize"
              >
                <slot name="business" />
              </BusinessPanel>
            </div>
            <!-- Composer 在专注态仍浮于底部（AI 一句话可达） -->
            <slot name="composer">
              <GlobalComposer @send="noop" />
            </slot>
          </div>
        </template>

        <!-- ============ STATE A/B：AI 工作区（+ 可选面板） ============ -->
        <template v-else>
          <!-- AI 工作区（欢迎态 / 消息时间线由 slot 提供，S1 接线） -->
          <div
            v-if="showAiWorkspace"
            class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
          >
            <div class="min-h-0 flex-1 overflow-y-auto">
              <slot name="ai-workspace">
                <!-- S0 占位：S1 挂 AIWorkspaceLayer -->
                <div
                  class="flex h-full items-center justify-center text-sm text-muted-foreground"
                >
                  {{ t('shell.aiWorkspacePlaceholder') }}
                </div>
              </slot>
            </div>
            <slot name="composer">
              <GlobalComposer @send="noop" />
            </slot>
          </div>

          <!-- 业务面板（B 态，动态宽度；自带左缘拖宽把手） -->
          <div
            v-if="showPanel"
            class="hidden h-full min-h-0 shrink-0 flex-col overflow-hidden md:flex"
            :style="{ width: panelWidth + 'px' }"
          >
            <BusinessPanel
              :tabs="tabs"
              :active-tab-id="activeTabId"
              :layout="layout"
              @activate-tab="store.activateTab($event)"
              @close-tab="store.closeTab($event)"
              @close-panel="store.closeAllTabs()"
              @toggle-focus="store.toggleFocus()"
              @start-resize="startPanelResize"
            >
              <slot name="business" />
            </BusinessPanel>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
