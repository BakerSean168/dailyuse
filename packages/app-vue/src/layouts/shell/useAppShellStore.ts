/**
 * App Shell UI Store (UI 重构 V2)
 *
 * 承载 ChatGPT 桌面式壳的视图状态：业务面板多 Tab 集合、布局态
 * （split / focus）、侧栏与面板宽度。localStorage 持久化实现"会话恢复"
 * （重启后还原上次打开的 Tabs + 各自路由 + 布局偏好，V2 §11 拍板）。
 *
 * 契约（docs/UI_REDESIGN_V2_PLAN.md + 2026-07-14 壳层诊断修订）：
 * - §2.3 多 Tab：胶囊/深链落 Tab（同 module 已开则激活，否则新开）；
 *   上限 8，超限时最久未激活的 Tab 作为候选返回给 UI 提示（不自动关，避免丢状态）。
 * - §1.1 三态：A 纯 AI（无 Tab）/ B 分栏（split）/ C 专注（focus）。
 * - STATE D 独立 Settings 不属于 BusinessTab / ShellModule。
 * - KeepAlive :include 由 tabs 派生，Tab 保活编辑器脏状态。
 *
 * 本 store 只存视图状态；URL 是活动 Tab 路由的持久化形式（§4），
 * router ↔ store 的双向同步在 useShellRouterSync（AppShell 消费），
 * 不在此处直连 router。
 */
import { defineStore } from 'pinia';
import { PANEL_MIN, computePanelGeometry } from './panel-geometry';

/** 面板可容纳的最大 Tab 数（V2 §2.3 建议 8）。 */
export const MAX_BUSINESS_TABS = 8;

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 260;
// 面板绝对像素上下限由 panel-geometry 动态计算；此处仅保留偏好默认值种子。
const PANEL_PREFERRED_DEFAULT = 450;

export type ShellLayout = 'split' | 'focus';

/**
 * 布局来源（诊断修订 §4.2）：
 * - default：新开业务面板的初始状态；
 * - user：最大化/最小化按钮触发，空间恢复后不自动改回；
 * - viewport：空间不足自动触发，可在空间恢复后回到 split。
 */
export type ShellLayoutReason = 'default' | 'user' | 'viewport';

/** 胶囊/深链可落地的业务模块标识。Settings 已升为独立场景，不在此列。 */
export type ShellModule =
  | 'goal'
  | 'task'
  | 'note'
  | 'reminder'
  | 'notification'
  | 'schedule';

export interface BusinessTab {
  id: string;
  module: ShellModule;
  route: string;
  title: string;
  lastActiveAt: number;
}

export interface OpenTabInput {
  module: ShellModule;
  route: string;
  title: string;
  intent: 'capsule' | 'deeplink';
}

export interface OpenTabResult {
  tabId: string;
  evictionCandidateId: string | null;
}

interface AppShellState {
  tabs: BusinessTab[];
  activeTabId: string | null;
  layout: ShellLayout;
  layoutReason: ShellLayoutReason;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  /**
   * 用户偏好面板宽度（像素）。
   * 渲染时用 computePanelGeometry clamp；窗口缩放不回写此值，
   * 避免把临时约束永久固化（侧栏折叠后应能回到更宽偏好）。
   */
  panelWidth: number;
}

const BUSINESS_MODULES = new Set<ShellModule>([
  'goal',
  'task',
  'note',
  'reminder',
  'notification',
  'schedule',
]);

let tabSeq = 0;
function nextTabId(module: ShellModule): string {
  tabSeq += 1;
  return `tab-${module}-${Date.now().toString(36)}-${tabSeq}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isBusinessModule(value: unknown): value is ShellModule {
  return typeof value === 'string' && BUSINESS_MODULES.has(value as ShellModule);
}

export const useAppShellStore = defineStore('app-shell', {
  state: (): AppShellState => ({
    tabs: [],
    activeTabId: null,
    layout: 'split',
    layoutReason: 'default',
    sidebarCollapsed: false,
    sidebarWidth: SIDEBAR_DEFAULT,
    panelWidth: PANEL_PREFERRED_DEFAULT,
  }),

  getters: {
    /** 当前激活的 Tab（无面板时为 undefined）。 */
    activeTab(state): BusinessTab | undefined {
      return state.tabs.find((t) => t.id === state.activeTabId);
    },
    /** 是否处于纯 AI 态（STATE A：无任何业务 Tab）。 */
    isChatOnly(state): boolean {
      return state.tabs.length === 0;
    },
    /** <KeepAlive :include> 的名单（= 全部 Tab id，LRU 已在 openTab 控量）。 */
    keepAliveInclude(state): string[] {
      return state.tabs.map((t) => t.id);
    },
  },

  actions: {
    /**
     * 打开一个业务 Tab（V2 §2.3 打开规则）。
     * - capsule 意图：同 module 已存在 → 激活并更新路由/标题；否则新开。
     * - deeplink 意图：同 route 已存在 → 激活；否则新开（不抢占当前 Tab）。
     * 新开后若超过上限，返回最久未激活 Tab 作为淘汰候选（UI 决定是否关）。
     */
    openTab(input: OpenTabInput): OpenTabResult {
      const now = Date.now();

      const existing =
        input.intent === 'capsule'
          ? this.tabs.find((t) => t.module === input.module)
          : this.tabs.find((t) => t.route === input.route);

      if (existing) {
        existing.route = input.route;
        existing.title = input.title;
        existing.lastActiveAt = now;
        this.activeTabId = existing.id;
        return { tabId: existing.id, evictionCandidateId: null };
      }

      const tab: BusinessTab = {
        id: nextTabId(input.module),
        module: input.module,
        route: input.route,
        title: input.title,
        lastActiveAt: now,
      };
      this.tabs.push(tab);
      this.activeTabId = tab.id;

      let evictionCandidateId: string | null = null;
      if (this.tabs.length > MAX_BUSINESS_TABS) {
        const candidate = this.tabs
          .filter((t) => t.id !== tab.id)
          .reduce<BusinessTab | null>(
            (oldest, t) => (!oldest || t.lastActiveAt < oldest.lastActiveAt ? t : oldest),
            null,
          );
        evictionCandidateId = candidate?.id ?? null;
      }

      return { tabId: tab.id, evictionCandidateId };
    },

    /** 激活已存在的 Tab，刷新其 LRU 时间戳。 */
    activateTab(tabId: string): void {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (!tab) return;
      tab.lastActiveAt = Date.now();
      this.activeTabId = tabId;
    },

    /**
     * 关闭一个 Tab。若关的是活动 Tab，则切到相邻 Tab（优先右侧，
     * 否则左侧）。关掉最后一个 Tab → 回 STATE A（activeTabId = null）。
     * 返回关闭后应导航到的路由（活动 Tab 的路由，或 null 表示回 '/'）。
     */
    closeTab(tabId: string): string | null {
      const index = this.tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return this.activeTab?.route ?? null;

      const wasActive = this.activeTabId === tabId;
      this.tabs.splice(index, 1);

      if (this.tabs.length === 0) {
        this.activeTabId = null;
        this.layout = 'split';
        this.layoutReason = 'default';
        return null;
      }

      if (wasActive) {
        const neighbor = this.tabs[index] ?? this.tabs[index - 1];
        if (neighbor) {
          neighbor.lastActiveAt = Date.now();
          this.activeTabId = neighbor.id;
          return neighbor.route;
        }
      }
      return this.activeTab?.route ?? null;
    },

    /** 关闭整个面板（面板头 ✕）：清空所有 Tab，回 STATE A。 */
    closeAllTabs(): void {
      this.tabs = [];
      this.activeTabId = null;
      this.layout = 'split';
      this.layoutReason = 'default';
    },

    /**
     * 清理历史持久化中的 Settings Tab 等非业务模块条目。
     * Settings 已升级为独立场景，不再属于 BusinessTab。
     */
    sanitizeLegacyTabs(): void {
      const next = this.tabs.filter(
        (tab) =>
          isBusinessModule(tab.module) &&
          // retired existing-note editor routes (/note/:id) no longer exist
          !(tab.route === '/note' || tab.route.startsWith('/note/') || tab.route.startsWith('/note?')),
      );
      if (next.length === this.tabs.length) return;
      this.tabs = next;
      if (this.activeTabId && !next.some((tab) => tab.id === this.activeTabId)) {
        this.activeTabId = next.length > 0 ? next[next.length - 1]!.id : null;
      }
      if (next.length === 0) {
        this.layout = 'split';
        this.layoutReason = 'default';
      }
    },

    /** 更新某 Tab 的当前路由（Tab 内导航时由 AppShell 回写）。 */
    setTabRoute(tabId: string, route: string): void {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (tab) tab.route = route;
    },

    setLayout(layout: ShellLayout, reason: ShellLayoutReason = 'default'): void {
      this.layout = layout;
      this.layoutReason = reason;
    },

    /** B ⇄ C 切换（分栏 ⇄ 专注）；用户显式操作。 */
    toggleFocus(): void {
      this.layout = this.layout === 'focus' ? 'split' : 'focus';
      this.layoutReason = 'user';
    },

    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    setSidebarCollapsed(collapsed: boolean): void {
      this.sidebarCollapsed = collapsed;
    },

    setSidebarWidth(width: number): void {
      this.sidebarWidth = clamp(width, SIDEBAR_MIN, SIDEBAR_MAX);
    },

    /**
     * 写入用户偏好面板宽度（仅用户拖拽/双击重置调用）。
     * 窗口 resize 不得调用此方法写入 clamp 结果。
     */
    setPanelWidth(width: number): void {
      if (!Number.isFinite(width)) return;
      this.panelWidth = Math.max(PANEL_MIN, Math.round(width));
    },

    /**
     * 按当前视口与侧栏占用计算合法有效宽度（不回写偏好）。
     * 渲染层 / 拖拽结束校验使用。
     */
    resolvePanelWidth(viewportWidth: number, sidebarOccupiedWidth: number): number {
      return computePanelGeometry({
        viewportWidth,
        sidebarOccupiedWidth,
        preferredPanelWidth: this.panelWidth,
      }).panelWidth;
    },

    /**
     * @deprecated 使用 resolvePanelWidth；保留别名以免外部残留调用。
     * 不再回写 panelWidth。
     */
    clampPanelWidthToViewport(viewportWidth: number, sidebarOccupiedWidth: number): number {
      return this.resolvePanelWidth(viewportWidth, sidebarOccupiedWidth);
    },
  },

  persist: {
    pick: [
      'tabs',
      'activeTabId',
      'layout',
      'layoutReason',
      'sidebarWidth',
      'panelWidth',
    ] as string[],
  },
});
