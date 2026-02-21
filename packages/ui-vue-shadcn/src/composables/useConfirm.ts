import { reactive } from 'vue';

export type ConfirmVariant = 'default' | 'destructive';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmVariant;
  resolve: ((value: boolean) => void) | null;
}

/**
 * Global singleton state — shared across the entire app.
 * One <GlobalConfirmDialog /> reads this and one `useConfirm()` call writes to it.
 */
const _state = reactive<ConfirmState>({
  open: false,
  title: '',
  description: '',
  confirmText: '确认',
  cancelText: '取消',
  variant: 'default',
  resolve: null,
});

/**
 * Internal API used by <GlobalConfirmDialog /> to respond to user clicks.
 * Do NOT call this from business code — use `useConfirm()` instead.
 */
export function _resolveConfirm(value: boolean): void {
  if (_state.resolve) {
    _state.resolve(value);
    _state.resolve = null;
  }
  _state.open = false;
}

/** Read-only view of the state for the dialog component. */
export function _getConfirmState(): ConfirmState {
  return _state;
}

/**
 * Show a styled AlertDialog and return a Promise that resolves to `true`
 * when the user clicks "Confirm", or `false` when they cancel / close.
 *
 * @example
 * ```ts
 * import { useConfirm } from '@dailyuse/ui-vue-shadcn'
 *
 * const confirmed = await useConfirm({
 *   title: '确认删除该账号？',
 *   description: '此操作不可逆，数据将被永久清除。',
 *   confirmText: '确认删除',
 *   cancelText: '手滑了',
 *   variant: 'destructive',
 * })
 *
 * if (!confirmed) return
 * await deleteAccount()
 * ```
 */
export function useConfirm(options: ConfirmOptions = {}): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    _state.title = options.title ?? '确认';
    _state.description = options.description ?? '';
    _state.confirmText = options.confirmText ?? '确认';
    _state.cancelText = options.cancelText ?? '取消';
    _state.variant = options.variant ?? 'default';
    _state.resolve = resolve;
    _state.open = true;
  });
}
