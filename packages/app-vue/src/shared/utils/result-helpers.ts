import { ref } from 'vue';
import { getI18nGlobal } from '../../plugins/i18n';
import { translateResultError } from './translate-result-error';

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
    const t = getI18nGlobal()?.t;
    if (!t) {
      error.value = result.error.message || msg;
      return null;
    }

    const translated = translateResultError(result.error, t, {
      fallbackKey: 'common.operationFailed',
    });
    error.value = translated === t('common.operationFailed') ? msg : translated;
    return null;
  }

  function clearError() {
    error.value = null;
  }

  return { error, handle, clearError };
}
