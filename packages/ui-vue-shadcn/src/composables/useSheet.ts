import { reactive, type Component, markRaw } from 'vue';

export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

export interface SheetOptions {
  /** Sheet 标题 */
  title?: string;
  /** Sheet 描述 */
  description?: string;
  /** 动态渲染的 Vue 组件 */
  component: Component;
  /** 传给动态组件的 props */
  props?: Record<string, unknown>;
  /** 从哪个方向滑入 */
  side?: SheetSide;
  /** 自定义宽度 class，例如 'sm:max-w-lg' */
  class?: string;
  /** 关闭后的回调 */
  onClose?: () => void;
}

interface SheetState {
  open: boolean;
  title: string;
  description: string;
  component: Component | null;
  componentProps: Record<string, unknown>;
  side: SheetSide;
  class: string;
  onClose: (() => void) | null;
}

/**
 * Global singleton state for the sheet.
 */
const _state = reactive<SheetState>({
  open: false,
  title: '',
  description: '',
  component: null,
  componentProps: {},
  side: 'right',
  class: '',
  onClose: null,
});

/** Internal: read by <GlobalSheet /> */
export function _getSheetState(): SheetState {
  return _state;
}

/** Internal: close the sheet */
export function _closeSheet(): void {
  _state.open = false;
  if (_state.onClose) {
    _state.onClose();
  }
  // Reset after animation completes
  setTimeout(() => {
    _state.component = null;
    _state.componentProps = {};
    _state.title = '';
    _state.description = '';
    _state.onClose = null;
  }, 300);
}

/**
 * Open a global sheet with a dynamically rendered Vue component.
 *
 * @example
 * ```ts
 * import { useSheet } from '@dailyuse/ui-vue-shadcn'
 * import EditUserForm from './EditUserForm.vue'
 *
 * function openEdit() {
 *   useSheet({
 *     title: '编辑用户',
 *     component: EditUserForm,
 *     props: { userId: 123 },
 *     side: 'right',
 *     onClose: () => refreshList(),
 *   })
 * }
 * ```
 */
export function useSheet(options: SheetOptions): void {
  _state.title = options.title ?? '';
  _state.description = options.description ?? '';
  // markRaw prevents Vue from making the component object deeply reactive
  _state.component = markRaw(options.component);
  _state.componentProps = options.props ?? {};
  _state.side = options.side ?? 'right';
  _state.class = options.class ?? '';
  _state.onClose = options.onClose ?? null;
  _state.open = true;
}

/**
 * Close the global sheet programmatically.
 *
 * @example
 * ```ts
 * import { closeSheet } from '@dailyuse/ui-vue-shadcn'
 * closeSheet()
 * ```
 */
export function closeSheet(): void {
  _closeSheet();
}
