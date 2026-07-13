/**
 * useViewportBreakpoint — 响应式断点统一入口（UI_PAGE_REDESIGN_PLAN §0.4）
 *
 * 断点对齐 tailwind 默认：sm 640 / md 768 / lg 1024 / xl 1280。
 * 各页不得自造断点值；能用纯 tailwind 响应类时优先用类，
 * 只有 JS 行为分支（如禁用拖拽、切换 Sheet 渲染）才用本 composable。
 */

import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue';

export const VIEWPORT_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type ViewportBreakpointKey = keyof typeof VIEWPORT_BREAKPOINTS;

function useMinWidth(px: number): Readonly<Ref<boolean>> {
  const matches = ref(true);

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return matches;
  }

  const query = window.matchMedia(`(min-width: ${px}px)`);
  matches.value = query.matches;

  const listener = (event: MediaQueryListEvent) => {
    matches.value = event.matches;
  };
  query.addEventListener('change', listener);

  if (getCurrentScope()) {
    onScopeDispose(() => {
      query.removeEventListener('change', listener);
    });
  }

  return matches;
}

export function useViewportBreakpoint() {
  return {
    /** ≥640px */
    isSmUp: useMinWidth(VIEWPORT_BREAKPOINTS.sm),
    /** ≥768px */
    isMdUp: useMinWidth(VIEWPORT_BREAKPOINTS.md),
    /** ≥1024px */
    isLgUp: useMinWidth(VIEWPORT_BREAKPOINTS.lg),
    /** ≥1280px */
    isXlUp: useMinWidth(VIEWPORT_BREAKPOINTS.xl),
  };
}
