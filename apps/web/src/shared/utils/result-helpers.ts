/**
 * Result Handling Utilities for Vue Composables
 *
 * 统一处理 Result<T> 模式，简化 Composable 中的成功/失败分支。
 *
 * @module shared/utils/result-helpers
 */

import type { Result } from '@dailyuse/contracts/result';
import { ref } from 'vue';

/**
 * Composable-level Result handler
 *
 * @example
 * ```ts
 * const { error, handle, clearError } = useResultHandler();
 *
 * async function fetchGoals() {
 *   const result = await service.queryGoals(params);
 *   handle(result, (data) => store.setGoals(data.goals));
 * }
 * ```
 */
export function useResultHandler() {
  const error = ref<string | null>(null);

  function handle<T>(
    result: Result<T>,
    onSuccess: (data: T) => void,
    fallbackMsg = '操作失败',
  ): T | null {
    if (result.ok) {
      error.value = null;
      onSuccess(result.data);
      return result.data;
    }
    error.value = result.error.message || fallbackMsg;
    return null;
  }

  function clearError() {
    error.value = null;
  }

  return { error, handle, clearError };
}
