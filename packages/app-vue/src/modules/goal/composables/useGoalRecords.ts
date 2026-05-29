/**
 * useGoalRecords — Goal records and reviews composable
 */

import { useI18n } from 'vue-i18n';
import { useGoalStore } from '../stores/goal-store';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { CreateGoalRecordReq, CreateGoalReviewReq } from '@dailyuse/contracts/goal';
import { executeGoalOperation, createGoalErrorHandler } from './goalOperations';

type GoalRecordEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['goalRecords'][number] };
type GoalReviewEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['goalReviews'][number] };
type KeyResultEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['keyResults'][number] };

export function useGoalRecords() {
  const store = useGoalStore();
  const service = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');
  const { t } = useI18n();

  const opOpts = {
    t,
    setError: (msg: string | null) => store.setError(msg),
    onError: createGoalErrorHandler(t, (msg) => store.setError(msg)),
  };

  // ── Records ──────────────────────────────────────────────────────────

  async function fetchRecords(goalId: string) {
    const data = await executeGoalOperation(
      () => service.getGoalRecordsByGoal(goalId),
      { ...opOpts, fallbackKey: 'goal.error.loadRecordsFailed', scope: 'fetchRecords' },
    );
    if (data) {
      store.setGoalRecords(
        (data.records ?? []).map((r: GoalRecordEntityLike) => r.toDTO()),
      );
    }
  }

  async function createRecord(goalId: string, req: CreateGoalRecordReq) {
    const { keyResultId, ...rest } = req;
    const data = await executeGoalOperation(
      () => service.createGoalRecord(goalId, keyResultId, sanitizeForIpc(rest)),
      { ...opOpts, fallbackKey: 'goal.error.createRecordFailed', scope: 'createRecord' },
    );
    if (data) {
      const dto = data.toDTO();
      // Refresh key results and records after creating a record
      await Promise.all([
        executeGoalOperation(
          () => service.getKeyResults(goalId),
          { ...opOpts, fallbackKey: 'goal.error.loadKRFailed', scope: 'fetchKeyResults' },
        ).then((kr) => {
          if (kr) store.setKeyResults((kr.keyResults ?? []).map((r: KeyResultEntityLike) => r.toDTO()));
        }),
        fetchRecords(goalId),
      ]);
      return dto;
    }
    return null;
  }

  async function createGoalRecord(
    goalId: string,
    keyResultId: string,
    data: { value: number; note?: string; recordedAt?: number },
  ) {
    return createRecord(goalId, { keyResultId, ...data } as CreateGoalRecordReq);
  }

  // ── Reviews ──────────────────────────────────────────────────────────

  async function fetchReviews(goalId: string) {
    const data = await executeGoalOperation(
      () => service.getGoalReviews(goalId),
      { ...opOpts, fallbackKey: 'goal.error.loadReviewsFailed', scope: 'fetchReviews' },
    );
    if (data) {
      store.setGoalReviews(
        (data.reviews ?? []).map((r: GoalReviewEntityLike) => r.toDTO()),
      );
    }
  }

  async function createReview(goalId: string, req: CreateGoalReviewReq) {
    const data = await executeGoalOperation(
      () => service.createGoalReview(goalId, sanitizeForIpc(req)),
      { ...opOpts, fallbackKey: 'goal.error.createReviewFailed', scope: 'createReview' },
    );
    if (data) {
      const dto = data.toDTO();
      store.addGoalReview(dto);
      return dto;
    }
    return null;
  }

  return {
    fetchRecords,
    createRecord,
    createGoalRecord,
    fetchReviews,
    createReview,
  };
}
