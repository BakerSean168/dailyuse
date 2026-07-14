/**
 * Shell Router ↔ Tab Sync (UI 重构 V2 §4 + 2026-07-14 壳层诊断修订)
 *
 * URL 是活动 Tab 路由的持久化形式：
 * - URL → 面板：路由变化按 §2.3 打开规则落 Tab（精确路由已开 → 激活；
 *   活动 Tab 同模块 → 视为 Tab 内导航回写路由；否则新开 Tab 不抢占）。
 * - 面板 → URL：切 Tab = router.replace 到该 Tab 路由（不污染 history）；
 *   关最后一个 Tab / 面板 ✕ = router.push('/')。
 * - `/` = 无面板（STATE A）→ 清空 Tab 集合。
 * - `/settings` / `/account` = STATE D 独立设置场景：不创建 BusinessTab，
 *   不修改 layout；后台 tabs 保留，返回时恢复。
 * - 会话恢复：挂载时若 URL 为 `/` 且 store 里有持久化 Tab，则 replace 回
 *   活动 Tab 的路由（V2 §11 拍板：localStorage 恢复 Tab 列表）。
 *
 * 导航先行原则：关闭活动 Tab / 关面板先执行路由跳转，跳转成功才改 store,
 * 这样业务视图的路由离开守卫（编辑器未保存守卫等）可以照常拦截。
 */
import { onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import type { RouteLocationNormalizedGeneric } from 'vue-router';
import {
  useAppShellStore,
  type ShellLayoutReason,
  type ShellModule,
} from './useAppShellStore'
import { computePanelGeometry } from './panelGeometry';

/** 分栏放不下的窗口宽度阈值：新开面板自动升专注态（V2 §1.1 / §7）。 */
export const AUTO_FOCUS_VIEWPORT = 1024;

/** 路由前缀 → 业务模块归属（V2 §3 模块矩阵；Settings 已移出）。 */
const MODULE_PREFIXES: Array<[prefix: string, module: ShellModule]> = [
  ['/goals', 'goal'],
  ['/tasks', 'task'],
  ['/repository', 'note'],
  ['/note', 'note'],
  ['/governance', 'note'],
  ['/reminders', 'reminder'],
  ['/notifications', 'notification'],
  ['/sse-monitor', 'notification'],
  ['/schedule', 'schedule'],
];

/** Tab 标题的 i18n key（S1 用模块名；S2 起换具体对象名）。 */
export const MODULE_TITLE_KEYS: Record<ShellModule, string> = {
  goal: 'nav.capsule.goal',
  task: 'nav.capsule.task',
  note: 'nav.capsule.note',
  reminder: 'nav.capsule.reminder',
  notification: 'nav.capsule.notification',
  schedule: 'nav.schedule',
};

/** Settings / Account 独立场景：不落 BusinessTab。 */
export function isStandaloneSettingsPath(path: string): boolean {
  const bare = path.split('?')[0] ?? path;
  return bare === '/settings' || bare.startsWith('/settings/') || bare === '/account' || bare.startsWith('/account/');
}

/** 判定一条路由路径归属哪个业务模块；壳外/未知路径返回 null。 */
export function moduleForPath(path: string): ShellModule | null {
  if (isStandaloneSettingsPath(path)) return null;
  for (const [prefix, module] of MODULE_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return module;
  }
  return null;
}

/**
 * 新开业务面板时的布局建议（诊断修订 §4）：
 * - 窄窗口 → focus + viewport（可自动恢复）；
 * - 宽窗口 → 仅当当前不是用户主动 focus 时回到 split。
 */
export function resolveEntryLayout(
  viewportWidth: number,
  currentLayout: 'split' | 'focus',
  currentReason: ShellLayoutReason,
  /** 几何上是否还能同时保证 CHAT_MIN + PANEL_MIN；默认 true 兼容旧调用。 */
  canSplit = true,
): { layout: 'split' | 'focus'; reason: ShellLayoutReason } | null {
  if (viewportWidth < AUTO_FOCUS_VIEWPORT || !canSplit) {
    if (currentLayout === 'focus' && currentReason === 'viewport') return null;
    return { layout: 'focus', reason: 'viewport' };
  }
  if (currentReason === 'user' && currentLayout === 'focus') {
    return null;
  }
  if (currentLayout === 'split' && currentReason === 'default') {
    return null;
  }
  return { layout: 'split', reason: 'default' };
}

export function useShellRouterSync() {
  const router = useRouter();
  const route = useRoute();
  const store = useAppShellStore();
  const { t } = useI18n();

  function titleFor(module: ShellModule): string {
    return t(MODULE_TITLE_KEYS[module]);
  }

  function maybeAutoFocus(): void {
    if (typeof window === 'undefined') return;
    const geo = computePanelGeometry({
      viewportWidth: window.innerWidth,
      // 使用分栏态侧栏占用，避免 focus 隐藏侧栏后 canSplit 抖动。
      sidebarOccupiedWidth: store.sidebarCollapsed ? 0 : store.sidebarWidth,
    });
    const next = resolveEntryLayout(
      window.innerWidth,
      store.layout,
      store.layoutReason,
      geo.canSplit,
    );
    if (next) store.setLayout(next.layout, next.reason);
  }

  /** URL → 面板状态（V2 §4）。 */
  function syncRouteToStore(to: Pick<RouteLocationNormalizedGeneric, 'path' | 'fullPath' | 'meta'>): void {
    // STATE D：独立设置场景不创建/激活 BusinessTab，也不改 layout。
    if (isStandaloneSettingsPath(to.path) || to.meta?.shellScene === 'settings') {
      return;
    }

    if (to.path === '/') {
      // `/` = 无面板（STATE A）。
      if (store.tabs.length > 0) store.closeAllTabs();
      return;
    }

    const module = moduleForPath(to.path);
    if (!module) return; // 壳外路由（/auth 等）不影响面板状态。

    // 1. 精确路由已在某个 Tab 打开 → 激活它（深链不重复开）。
    const exact = store.tabs.find((tab) => tab.route === to.fullPath);
    if (exact) {
      store.activateTab(exact.id);
      return;
    }

    // 2. 活动 Tab 同模块 → Tab 内导航，回写路由。
    const active = store.activeTab;
    if (active && active.module === module) {
      store.setTabRoute(active.id, to.fullPath);
      return;
    }

    // 3. 其余（胶囊新开 / 深链 / AI 硬跳转）→ 新开 Tab，不抢占现有 Tab。
    const { evictionCandidateId } = store.openTab({
      module,
      route: to.fullPath,
      title: titleFor(module),
      intent: 'deeplink',
    });
    maybeAutoFocus();
    if (evictionCandidateId) {
      const candidate = store.tabs.find((tab) => tab.id === evictionCandidateId);
      toast.info(t('shell.panel.tabLimitHint', { title: candidate?.title ?? '' }));
    }
  }

  // ── 面板 → URL 的动作（AppShell 事件出口） ──

  /** 切换 Tab：先改 store 再 replace URL（不污染 history）。 */
  async function activateTab(tabId: string): Promise<void> {
    const tab = store.tabs.find((item) => item.id === tabId);
    if (!tab) return;
    store.activateTab(tabId);
    if (route.fullPath !== tab.route) {
      await router.replace(tab.route).catch(() => {});
    }
  }

  /**
   * 关闭 Tab。关活动 Tab = 先导航到相邻 Tab（replace）或 `/`（push），
   * 导航成功（未被未保存守卫取消）后再移除；关后台 Tab 直接移除。
   */
  async function closeTab(tabId: string): Promise<void> {
    const index = store.tabs.findIndex((item) => item.id === tabId);
    if (index === -1) return;

    if (store.activeTabId !== tabId) {
      store.closeTab(tabId);
      return;
    }

    const neighbor = store.tabs[index + 1] ?? store.tabs[index - 1];
    if (neighbor) {
      const failure = await router.replace(neighbor.route).catch(() => true);
      if (failure) return; // 守卫取消 → 保留 Tab。
      store.closeTab(tabId);
      return;
    }

    // 最后一个 Tab → 回 STATE A（afterEach 对 `/` 会清空集合）。
    const failure = await router.push('/').catch(() => true);
    if (failure) return;
    store.closeTab(tabId);
  }

  /** 面板头 ✕：关整个面板回 STATE A。 */
  async function closePanel(): Promise<void> {
    const failure = await router.push('/').catch(() => true);
    if (failure) return;
    store.closeAllTabs();
  }

  /**
   * 胶囊「进入」（V2 §2.3）：已有该模块 Tab → 激活；否则导航到模块落地路由
   * （afterEach 落成新 Tab）。Schedule 与其它业务模块规则一致，不再强制 focus。
   */
  async function openModule(module: ShellModule, landingRoute: string): Promise<void> {
    const existing = store.tabs.find((tab) => tab.module === module);
    if (existing) {
      await activateTab(existing.id);
      return;
    }
    await router.push(landingRoute).catch(() => {});
  }

  /** 打开独立设置场景：只改路由，不碰 tabs / layout。 */
  async function openSettings(path = '/settings'): Promise<void> {
    if (route.fullPath === path || (path === '/settings' && route.path === '/settings' && !route.query.tab)) {
      return;
    }
    await router.push(path).catch(() => {});
  }

  /** 从设置返回应用：优先恢复后台业务 Tab，否则 `/`。 */
  async function returnFromSettings(): Promise<void> {
    if (store.activeTab) {
      await router.push(store.activeTab.route).catch(() => {});
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    await router.push('/').catch(() => {});
  }

  /** 回 STATE A（新对话 / 关面板后的地面态）。 */
  async function goHome(): Promise<void> {
    if (route.path !== '/') {
      await router.push('/').catch(() => {});
    } else if (store.tabs.length > 0) {
      store.closeAllTabs();
    }
  }

  // ── 生命周期：afterEach 订阅 + 挂载恢复 ──

  let removeAfterEach: (() => void) | null = null;

  onMounted(() => {
    store.sanitizeLegacyTabs();

    // 持久化状态自愈：activeTabId 必须指向存在的 Tab。
    if (store.activeTabId && !store.tabs.some((tab) => tab.id === store.activeTabId)) {
      store.activeTabId = store.tabs.length > 0 ? store.tabs[store.tabs.length - 1]!.id : null;
    }
    if (store.tabs.length > 0 && !store.activeTabId) {
      store.activeTabId = store.tabs[store.tabs.length - 1]!.id;
    }

    removeAfterEach = router.afterEach((to, _from, failure) => {
      if (failure) return;
      syncRouteToStore(to);
    });

    // 独立设置深链：保留后台 tabs，不覆盖到业务 Tab。
    if (isStandaloneSettingsPath(route.path) || route.meta.shellScene === 'settings') {
      return;
    }

    // 会话恢复：URL 在 `/` 且有持久化 Tab → 回到活动 Tab 的路由。
    if (route.path === '/' && store.activeTab) {
      void router.replace(store.activeTab.route).catch(() => {});
      return;
    }
    // 深链启动：当前路由落 Tab。
    syncRouteToStore(route);
  });

  onUnmounted(() => {
    removeAfterEach?.();
    removeAfterEach = null;
  });

  return {
    activateTab,
    closeTab,
    closePanel,
    openModule,
    openSettings,
    returnFromSettings,
    goHome,
  };
}
