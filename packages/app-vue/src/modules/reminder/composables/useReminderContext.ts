import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReminderStore } from '../stores/reminder-store';
import { REMINDER_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { IReminderService } from '../../../di/types';
import type { Result } from '@dailyuse/contracts/result';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';

type DesktopApi = { invoke?: (channel: string, ...args: unknown[]) => Promise<unknown> } | undefined;

export interface ReminderContext {
  store: ReturnType<typeof useReminderStore>;
  service: IReminderService;
  desktopApi: DesktopApi;
  t: ReturnType<typeof useI18n>['t'];
  savingId: ReturnType<typeof ref<string | null>>;
  executeReminderOperation: <T>(operation: () => Promise<Result<T>>, fallbackKey: string) => Promise<Result<T>>;
}

export function createReminderContext(): ReminderContext {
  const service = useStrictInject(REMINDER_SERVICE_KEY, 'ReminderService');
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const { t } = useI18n();
  const store = useReminderStore();
  const savingId = ref<string | null>(null);

  function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);
    console.error(message);
  }

  async function executeReminderOperation<T>(
    operation: () => Promise<Result<T>>,
    fallbackKey: string,
  ) {
    return executeDesktopAuthenticatedResult({
      operation,
      logScope: 'Reminder',
      t,
      fallbackKey,
      desktopApi,
      onError: (error) => {
        handleError(error, fallbackKey);
      },
    });
  }

  return {
    store,
    service,
    desktopApi,
    t,
    savingId,
    executeReminderOperation,
  };
}
