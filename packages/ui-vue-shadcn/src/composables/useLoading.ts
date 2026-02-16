import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { createLoadingStore, type LoadingState, type LoadingStore } from '@dailyuse/ui-core';

export interface UseLoadingReturn {
  /** Whether loading is active */
  isLoading: ComputedRef<boolean>;
  /** Loading message */
  message: ComputedRef<string | undefined>;
  /** Current state */
  state: ComputedRef<LoadingState>;
  /** Start loading */
  start: (message?: string) => void;
  /** Stop loading */
  stop: () => void;
  /** Execute async operation with loading state */
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

/**
 * Vue composable for loading state management
 * Wraps @dailyuse/ui-core loading logic with Vue reactivity
 */
export function useLoading(initialMessage?: string): UseLoadingReturn {
  const stateRef = ref<LoadingState>({
    isLoading: false,
    message: initialMessage,
  });

  const store = createLoadingStore({
    getState: () => stateRef.value,
    setState: (state) => {
      stateRef.value = state;
    },
  });

  return {
    isLoading: computed(() => stateRef.value.isLoading),
    message: computed(() => stateRef.value.message),
    state: computed(() => stateRef.value),
    start: store.start,
    stop: store.stop,
    withLoading: store.withLoading,
  };
}
