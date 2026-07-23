/**
 * Residual 973: createComposableHandleError sole factory.
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useScheduleStore } from '../stores/schedule-store';
import { SCHEDULE_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { IScheduleService } from '../../../di/types';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error';

export interface ScheduleContext {
  store: ReturnType<typeof useScheduleStore>;
  service: IScheduleService;
  t: ReturnType<typeof useI18n>['t'];
  savingId: ReturnType<typeof ref<string | null>>;
  handleError: (error: unknown, fallbackKey: string) => void;
}

export function createScheduleContext(): ScheduleContext {
  const service = useStrictInject(SCHEDULE_SERVICE_KEY, 'ScheduleService');
  const { t } = useI18n();
  const store = useScheduleStore();
  const savingId = ref<string | null>(null);

  const handleError = createComposableHandleError({
    t,
    setError: (message) => store.setError(message),
  });

  return {
    store,
    service,
    t,
    savingId,
    handleError,
  };
}
