/**
 * V2 Shell barrel (UI 重构 V2)
 *
 * ChatGPT 桌面式壳组件与 store。S1 起 AppShell 取代 MainLayout 成为
 * 主路由树的父组件（router/index.ts 直接引用）；此处统一导出供宿主
 * 复用/覆写。
 */
export { default as AppShell } from './AppShell.vue';
export { default as WindowHeader } from './WindowHeader.vue';
export { default as ConversationSidebar } from './ConversationSidebar.vue';
export { default as BusinessPanel } from './BusinessPanel.vue';
export { default as PanelErrorBoundary } from './PanelErrorBoundary.vue';
export { default as GlobalComposer } from './GlobalComposer.vue';
export { default as StandaloneSettingsLayout } from './StandaloneSettingsLayout.vue';
export { default as ShellHomeRoute } from './shell-home-route';

export {
  useAppShellStore,
  MAX_BUSINESS_TABS,
  type BusinessTab,
  type ShellLayout,
  type ShellLayoutReason,
  type ShellModule,
} from './useAppShellStore';

export {
  useShellRouterSync,
  moduleForPath,
  isStandaloneSettingsPath,
  resolveEntryLayout,
  MODULE_TITLE_KEYS,
  AUTO_FOCUS_VIEWPORT,
} from './useShellRouterSync';

export {
  computePanelGeometry,
  panelWidthFromPointer,
  PANEL_MIN,
  PANEL_MAX_CAP,
  CHAT_MIN,
} from './panel-geometry';
