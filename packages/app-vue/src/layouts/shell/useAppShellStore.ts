/**
 * App Shell UI Store (UI 重构 V2)
 *
 * 承载 ChatGPT 桌面式壳的视图状态：业务面板多 Tab 集合、布局态
 * （split / focus）、侧栏与面板宽度。localStorage 持久化实现"会话恢复"
 * （重启后还原上次打开的 Tabs + 各自路由 + 布局偏好，V2 §11 拍板）。
 *
 * 契约（docs/UI_REDESIGN_V2_PLAN.md）：
 * - §2.3 多 Tab：胶囊/深链落 Tab（同 module 已开则激活，否则新开）；
 *   上限 8，超限时最久未激活的 Tab 作为候选返回给 UI 提示（不自动关，避免丢状态）。
 * - §1.1 三态：A 纯 AI（无 Tab）/ B 分栏（split）/ C 专注（focus）。
 * - KeepAlive :include 由 tabs 派生，Tab 保活编辑器脏状态。
 *
 * 本 store 只存视图状态；URL 是活动 Tab 路由的持久化形式（§4），
 * router ↔ store 的双向同步在 AppShell 接线（S1），不在此处直连 router。
 */
import { defineStore } from 'pinia';

/** 面板可容纳的最大 Tab 数（V2 §2.3 建议 8）。 */
export const MAX_BUSINESS_TABS = 8;

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 260;
const PANEL_MIN = 320;
const PANEL_MAX = 750;
const PANEL_DEFAULT = 450;

export type ShellLayout = 'split' | 'focus';

/** 胶囊/深链可落地的业务模块标识。 */
export type ShellModule =
  | 'goal'
  | 'task'
  | 'note'
  | 'reminder'
  | 'notification'
  | 'schedule'
  | 'setting';

export interface BusinessTab {
  /** 稳定标识，作为 <KeepAlive> include 名与 Tab key。 */
  id: string;
  /** 所属业务模块（决定图标与"同模块激活而非新开"规则）。 */
  module: ShellModule;
  /** 该 Tab 当前的路由 fullPath（切换 Tab 时 router.replace 到此）。 */
  route: string;
  /** Tab 标题（模块名或具体对象名，如「🎯 知行 UI 重构」）。 */
  title: string;
  /** 最近激活时间戳（LRU 淘汰候选依据）。 */
  lastActiveAt: number;
}

interface OpenTabInput {
  module: ShellModule;
  route: string;
  title: string;
  /**
   * 打开方式：'capsule' 同模块已存在则激活现有（不新开）；
   * 'deeplink' 同路由已开着才激活，否则一律新开（AI 产物/深链不抢占）。
   */
  intent: 'capsule' | 'deeplink';
}

interface OpenTabResult {
  /** 落地的 Tab id（激活的或新开的）。 */
  tabId: string;
  /**
   * 超过 MAX_BUSINESS_TABS 时，最久未激活的 Tab id，供 UI 提示用户关闭。
   * 未超限则为 null。不自动关闭（避免丢未保存状态）。
   */
  evictionCandidateId: string | null;
}

interface AppShellState {
  tabs: BusinessTab[];
  activeTabId: string | null;
  layout: ShellLayout;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  panelWidth: number;
}

let tabSeq = 0;
function nextTabId(module: ShellModule): string {
  tabSeq += 1;
  return `tab-${module}-${Date.now().toString(36)}-${tabSeq}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const useAppShellStore = defineStore('app-shell', {
  state: (): AppShellState => ({
    tabs: [],
    activeTabId: null,
    layout: 'split',
    sidebarCollapsed: false,
    sidebarWidth: SIDEBAR_DEFAULT,
    panelWidth: PANEL_DEFAULT,
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
    },

    /** 更新某 Tab 的当前路由（Tab 内导航时由 AppShell 回写）。 */
    setTabRoute(tabId: string, route: string): void {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (tab) tab.route = route;
    },

    setLayout(layout: ShellLayout): void {
      this.layout = layout;
    },

    /** B ⇄ C 切换（分栏 ⇄ 专注）。 */
    toggleFocus(): void {
      this.layout = this.layout === 'focus' ? 'split' : 'focus';
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

    setPanelWidth(width: number): void {
      this.panelWidth = clamp(width, PANEL_MIN, PANEL_MAX);
    },
  },

  persist: {
    pick: ['tabs', 'activeTabId', 'layout', 'sidebarWidth', 'panelWidth'] as string[],
  },
});
