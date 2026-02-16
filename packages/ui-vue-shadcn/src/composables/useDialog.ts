import { ref, computed, type ComputedRef } from 'vue';
import { createDialogStore, type DialogState } from '@dailyuse/ui-core';

export interface UseDialogReturn {
  /** Whether dialog is open */
  isOpen: ComputedRef<boolean>;
  /** Dialog title */
  title: ComputedRef<string | undefined>;
  /** Dialog message */
  message: ComputedRef<string | undefined>;
  /** Current state */
  state: ComputedRef<DialogState>;
  /** Open dialog */
  open: (options?: { title?: string; message?: string }) => void;
  /** Close dialog */
  close: () => void;
  /** Show confirm dialog and return promise */
  confirm: (options: { title?: string; message: string }) => Promise<boolean>;
}

/**
 * Vue composable for dialog state management
 * Wraps @dailyuse/ui-core dialog logic with Vue reactivity
 */
export function useDialog(): UseDialogReturn {
  const stateRef = ref<DialogState>({
    isOpen: false,
    title: undefined,
    message: undefined,
  });

  let resolveConfirm: ((value: boolean) => void) | null = null;

  const store = createDialogStore({
    getState: () => stateRef.value,
    setState: (state) => {
      stateRef.value = state;
    },
  });

  const confirm = (options: { title?: string; message: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveConfirm = resolve;
      store.open(options);
    });
  };

  const close = () => {
    if (resolveConfirm) {
      resolveConfirm(false);
      resolveConfirm = null;
    }
    store.close();
  };

  return {
    isOpen: computed(() => stateRef.value.isOpen),
    title: computed(() => stateRef.value.title),
    message: computed(() => stateRef.value.message),
    state: computed(() => stateRef.value),
    open: store.open,
    close,
    confirm,
  };
}
