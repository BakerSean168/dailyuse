/**
 * useGoalFolders — Goal folder CRUD composable
 */

import { useI18n } from 'vue-i18n';
import { useGoalStore } from '../stores/goal-store';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { CreateGoalFolderReq, UpdateGoalFolderReq } from '@memoflow/contracts/goal';
import { executeGoalOperation, executeGoalAction, createGoalErrorHandler } from './goalOperations';

type GoalFolderEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['goalFolders'][number] };

export function useGoalFolders() {
  const store = useGoalStore();
  const service = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');
  const { t } = useI18n();

  const opOpts = {
    t,
    setError: (msg: string | null) => store.setError(msg),
    onError: createGoalErrorHandler(t, (msg) => store.setError(msg)),
  };

  async function fetchFolders() {
    const data = await executeGoalOperation(
      () => service.listGoalFolders(),
      { ...opOpts, fallbackKey: 'goal.error.loadFoldersFailed', scope: 'fetchFolders' },
    );
    if (data) {
      store.setGoalFolders((data ?? []).map((f: GoalFolderEntityLike) => f.toDTO()));
    }
  }

  async function createFolder(req: CreateGoalFolderReq) {
    const data = await executeGoalOperation(
      () => service.createGoalFolder(sanitizeForIpc(req)),
      { ...opOpts, fallbackKey: 'goal.error.createFolderFailed', scope: 'createFolder' },
    );
    if (data) {
      const dto = data.toDTO();
      store.addGoalFolder(dto);
      return dto;
    }
    return null;
  }

  async function updateFolder(id: string, req: UpdateGoalFolderReq) {
    const data = await executeGoalOperation(
      () => service.updateGoalFolder(id, sanitizeForIpc(req)),
      { ...opOpts, fallbackKey: 'goal.error.updateFolderFailed', scope: 'updateFolder' },
    );
    if (data) {
      const dto = data.toDTO();
      store.updateGoalFolder(dto);
      return dto;
    }
    return null;
  }

  async function deleteFolder(id: string) {
    const ok = await executeGoalAction(
      () => service.deleteGoalFolder(id),
      { ...opOpts, fallbackKey: 'goal.error.deleteFolderFailed', scope: 'deleteFolder' },
    );
    if (ok) store.removeGoalFolder(id);
    return ok;
  }

  return {
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
