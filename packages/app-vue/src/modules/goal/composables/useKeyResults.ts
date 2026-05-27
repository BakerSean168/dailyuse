/**
 * useKeyResults — Key result CRUD composable
 */

import { useI18n } from 'vue-i18n';
import { useGoalStore } from '../stores/goal-store';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { AddKeyResultReq, UpdateKeyResultReq } from '@dailyuse/contracts/goal';
import { executeGoalOperation, executeGoalAction, createGoalErrorHandler } from './goalOperations';

type KeyResultEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['keyResults'][number] };

export function useKeyResults() {
  const store = useGoalStore();
  const service = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');
  const { t } = useI18n();

  const opOpts = {
    t,
    setError: (msg: string | null) => store.setError(msg),
    onError: createGoalErrorHandler(t, (msg) => store.setError(msg)),
  };

  async function fetchKeyResults(goalId: string) {
    const data = await executeGoalOperation(
      () => service.getKeyResults(goalId),
      { ...opOpts, fallbackKey: 'goal.error.loadKRFailed', scope: 'fetchKeyResults' },
    );
    if (data) {
      store.setKeyResults(
        (data.keyResults ?? []).map((kr: KeyResultEntityLike) => kr.toDTO()),
      );
    }
  }

  async function addKeyResult(goalId: string, req: AddKeyResultReq) {
    const data = await executeGoalOperation(
      () => service.createKeyResult(goalId, sanitizeForIpc(req)),
      { ...opOpts, fallbackKey: 'goal.error.addKRFailed', scope: 'addKeyResult' },
    );
    if (data) {
      const dto = data.toDTO();
      store.addKeyResult(dto);
      return dto;
    }
    return null;
  }

  async function updateKeyResult(goalId: string, krId: string, req: UpdateKeyResultReq) {
    const data = await executeGoalOperation(
      () => service.updateKeyResult(goalId, krId, sanitizeForIpc(req)),
      { ...opOpts, fallbackKey: 'goal.error.updateKRFailed', scope: 'updateKeyResult' },
    );
    if (data) {
      const dto = data.toDTO();
      store.updateKeyResult(dto);
      return dto;
    }
    return null;
  }

  async function deleteKeyResult(goalId: string, krId: string) {
    const ok = await executeGoalAction(
      () => service.deleteKeyResult(goalId, krId),
      { ...opOpts, fallbackKey: 'goal.error.deleteKRFailed', scope: 'deleteKeyResult' },
    );
    if (ok) store.removeKeyResult(krId);
    return ok;
  }

  return {
    fetchKeyResults,
    addKeyResult,
    updateKeyResult,
    deleteKeyResult,
  };
}
