export { default as ActionableWrapper } from './ActionableWrapper.vue';
export type { MenuAction } from './types';
export { menuLabel, setMenuLocale, getMenuLocale } from './menu-labels';
export type { SupportedLocale } from './menu-labels';

// ── Page shells & shared UI states (UI_PAGE_REDESIGN_PLAN §0.5) ──
export { default as ListPageShell } from './ListPageShell.vue';
export { default as DetailPageShell } from './DetailPageShell.vue';
export { default as ModuleSidebar } from './ModuleSidebar.vue';
export { default as AppEmptyState } from './AppEmptyState.vue';
export { default as FilterBar } from './FilterBar.vue';
