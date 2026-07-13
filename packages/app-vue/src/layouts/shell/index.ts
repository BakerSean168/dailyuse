/**
 * V2 Shell barrel (UI 重构 V2)
 *
 * ChatGPT 桌面式壳组件与 store。S0 阶段导出但未挂载；S1 由 App.vue 消费
 * AppShell 取代 MainLayout。
 */
export { default as AppShell } from './AppShell.vue';
export { default as WindowHeader } from './WindowHeader.vue';
export { default as ConversationSidebar } from './ConversationSidebar.vue';
export { default as BusinessPanel } from './BusinessPanel.vue';
export { default as GlobalComposer } from './GlobalComposer.vue';

export {
  useAppShellStore,
  MAX_BUSINESS_TABS,
  type BusinessTab,
  type ShellLayout,
  type ShellModule,
} from './useAppShellStore';
