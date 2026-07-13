/**
 * Shell Router ↔ Tab Sync (UI 重构 V2 §4)
 *
 * URL 是活动 Tab 路由的持久化形式：
 * - URL → 面板：路由变化按 §2.3 打开规则落 Tab（精确路由已开 → 激活；
 *   活动 Tab 同模块 → 视为 Tab 内导航回写路由；否则新开 Tab 不抢占）。
 * - 面板 → URL：切 Tab = router.replace 到该 Tab 路由（不污染 history）；
 *   关最后一个 Tab / 面板 ✕ = router.push('/')。
 * - `/` = 无面板（STATE A）→ 清空 Tab 集合。
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
import { useAppShellStore, type ShellModule } from './useAppShellStore';

/** 分栏放不下的窗口宽度阈值：新开面板自动升专注态（V2 §1.1 / §7）。 */
const AUTO_FOCUS_VIEWPORT = 1024;

/** 路由前缀 → 业务模块归属（V2 §3 模块矩阵；一条路由都不删）。 */
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
  ['/settings', 'setting'],
  ['/account', 'setting'],
];

/** Tab 标题的 i18n key（S1 用模块名；S2 起换具体对象名）。 */
export const MODULE_TITLE_KEYS: Record<ShellModule, string> = {
  goal: 'nav.capsule.goal',
  task: 'nav.capsule.task',
  note: 'nav.capsule.note',
  reminder: 'nav.capsule.reminder',
  notification: 'nav.capsule.notification',
  schedule: 'nav.schedule',
  setting: 'nav.settings',
};

/** 判定一条路由路径归属哪个业务模块；壳外/未知路径返回 null。 */
export function moduleForPath(path: string): ShellModule | null {
  for (const [prefix, module] of MODULE_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return module;
  }
  return null;
}

export function useShellRouterSync() {
  const router = useRouter();
  const route = useRoute();
  const store = useAppShellStore();
  const { t } = useI18n();

  function titleFor(module: ShellModule): string {
    return t(MODULE_TITLE_KEYS[module]);
  }

  function maybeAutoFocus(module: ShellModule): void {
    // Settings 默认专注态打开（V2 §3）；窄窗口分栏放不下时自动升专注态。
    if (module === 'setting') {
      store.setLayout('focus');
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < AUTO_FOCUS_VIEWPORT) {
      store.setLayout('focus');
    }
  }

  /** URL → 面板状态（V2 §4）。 */
  function syncRouteToStore(to: Pick<RouteLocationNormalizedGeneric, 'path' | 'fullPath'>): void {
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
    maybeAutoFocus(module);
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
   * （afterEach 落成新 Tab）。
   */
  async function openModule(module: ShellModule, landingRoute: string): Promise<void> {
    const existing = store.tabs.find((tab) => tab.module === module);
    if (existing) {
      await activateTab(existing.id);
      if (module === 'setting') store.setLayout('focus');
      return;
    }
    await router.push(landingRoute).catch(() => {});
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
    goHome,
  };
}
