import { ref } from 'vue';
import { getI18nGlobal } from '../../plugins/i18n';

type Result<T> = { ok: true; data: T } | { ok: false; error: { message?: string } };

export function useResultHandler() {
  const error = ref<string | null>(null);

  function handle<T>(
    result: Result<T>,
    onSuccess: (data: T) => void,
    fallbackMsg?: string,
  ): T | null {
    const msg = fallbackMsg ?? getI18nGlobal()?.t('common.operationFailed') ?? '操作失败';
    if (result.ok) {
      error.value = null;
      onSuccess(result.data);
      return result.data;
    }
    error.value = result.error.message || msg;
    return null;
  }

  function clearError() {
    error.value = null;
  }

  return { error, handle, clearError };
}
