import { ref } from 'vue';

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message?: string } };

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
