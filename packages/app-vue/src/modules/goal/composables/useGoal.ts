/**
 * useGoal - 目标模块主 composable
 *
 * 编排 GoalClientService 调用 + Store 更新 + 错误处理。
 * 通过 inject(GOAL_SERVICE_KEY) 获取服务实例，
 * 使用 Result<T> 模式替代 try/catch。
 *
 * Focus mode 和 filter/search 已拆分到独立 composable。
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGoalStore } from '../stores/goal-store';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { ResultError } from '@dailyuse/contracts/result';
import type {
  GoalClientDTO,
  CreateGoalReq,
  UpdateGoalReq,
  GetGoalAggregateRes,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  CreateGoalRecordReq,
  CreateGoalReviewReq,
} from '@dailyuse/contracts/goal';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { useFocusMode } from './useFocusMode';
import { useGoalFilters } from './useGoalFilters';

type GoalEntityLike = { toDTO(): GoalClientDTO };
type GoalFolderEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['goalFolders'][number] };
type KeyResultEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['keyResults'][number] };
type GoalReviewEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['goalReviews'][number] };
type GoalRecordEntityLike = { toDTO(): ReturnType<typeof useGoalStore>['goalRecords'][number] };

export function useGoal() {
  const store = useGoalStore();
  const service = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');
  const { t } = useI18n();
  const savingId = ref<string | null>(null);

  const goals = computed(() => store.goals);
  const currentGoal = computed(() => store.currentGoal);
  const keyResults = computed(() => store.keyResults);
  const goalFolders = computed(() => store.goalFolders);
  const goalReviews = computed(() => store.goalReviews);
  const goalRecords = computed(() => store.goalRecords);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(error: unknown, fallbackKey: string, scope?: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);

    if (!error || typeof error !== 'object') {
      console.error(message);
      return;
    }

    const err = error as ResultError;
    const details = err.details?.map((detail) => ({
      field: detail.field,
      code: detail.code,
      message: detail.message,
      value: detail.value,
    }));

    console.error(`[goal] ${scope ?? 'error'}`, {
      code: err.code,
      message: err.message,
      details,
      context: err.context,
      translatedMessage: message,
    });
  }

  // ── Goal CRUD ────────────────────────────────────────────────────────

  async function fetchGoals() {
    store.setLoading(true);
    store.setError(null);
    try {
      await service.archiveExpiredGoals?.();
      const searchQuery = store.searchQuery || undefined;
      const params = {
        systemView: store.systemView,
        page: store.pagination.page,
        pageSize: store.pagination.pageSize,
      };

      const result = searchQuery
        ? await service.searchGoals({ query: searchQuery, ...params })
        : await service.listGoals(params);

      if (result.ok) {
        store.setGoals(
          (result.data.goals ?? []).map((g: GoalEntityLike) => g.toDTO()),
          result.data.pagination?.total ?? 0,
        );
      } else {
        handleError(result.error, 'goal.error.loadListFailed', 'fetchGoals');
      }
    } catch (e: any) {
      handleError(e, 'goal.error.loadListException');
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchGoal(id: string): Promise<GoalClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    store.setKeyResults([]);
    store.setGoalRecords([]);
    store.setGoalReviews([]);
    try {
      const result = await service.getGoal(id);
      if (result.ok) {
        const dto = result.data.toDTO();
        store.setCurrentGoal(dto);
        return dto;
      } else {
        handleError(result.error, 'goal.error.loadFailed', 'fetchGoal');
        return null;
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function createGoal(req: CreateGoalReq) {
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await service.createGoal(sanitizeForIpc(req));
      if (result.ok) {
        const dto = result.data.toDTO();
        store.addGoal(dto);
        return dto;
      } else {
        handleError(result.error, 'goal.error.createFailed', 'createGoal');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function updateGoal(id: string, req: UpdateGoalReq) {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.updateGoal(id, sanitizeForIpc(req));
      if (result.ok) {
        const dto = result.data.toDTO();
        store.updateGoal(dto);
        return dto;
      } else {
        handleError(result.error, 'goal.error.updateFailed', 'updateGoal');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function deleteGoal(id: string) {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.deleteGoal(id);
      if (result.ok) {
        store.removeGoal(id);
        return true;
      } else {
        handleError(result.error, 'goal.error.deleteFailed', 'deleteGoal');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  // ── Folder CRUD ──────────────────────────────────────────────────────

  async function fetchFolders() {
    const result = await service.listGoalFolders();
    if (result.ok) {
      store.setGoalFolders((result.data ?? []).map((f: GoalFolderEntityLike) => f.toDTO()));
    } else {
      handleError(result.error, 'goal.error.loadFoldersFailed', 'fetchFolders');
    }
  }

  async function createFolder(req: CreateGoalFolderReq) {
    const result = await service.createGoalFolder(sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addGoalFolder(dto);
      return dto;
    } else {
      handleError(result.error, 'goal.error.createFolderFailed', 'createFolder');
      return null;
    }
  }

  async function updateFolder(id: string, req: UpdateGoalFolderReq) {
    const result = await service.updateGoalFolder(id, sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateGoalFolder(dto);
      return dto;
    } else {
      handleError(result.error, 'goal.error.updateFolderFailed', 'updateFolder');
      return null;
    }
  }

  async function deleteFolder(id: string) {
    const result = await service.deleteGoalFolder(id);
    if (result.ok) {
      store.removeGoalFolder(id);
      return true;
    } else {
      handleError(result.error, 'goal.error.deleteFolderFailed', 'deleteFolder');
      return false;
    }
  }

  // ── Key Result CRUD ──────────────────────────────────────────────────

  async function fetchKeyResults(goalId: string) {
    const result = await service.getKeyResults(goalId);
    if (result.ok) {
      store.setKeyResults(
        (result.data.keyResults ?? []).map((kr: KeyResultEntityLike) => kr.toDTO()),
      );
    } else {
      handleError(result.error, 'goal.error.loadKRFailed', 'fetchKeyResults');
    }
  }

  async function addKeyResult(goalId: string, req: AddKeyResultReq) {
    const result = await service.createKeyResult(goalId, sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addKeyResult(dto);
      return dto;
    } else {
      handleError(result.error, 'goal.error.addKRFailed', 'addKeyResult');
      return null;
    }
  }

  async function updateKeyResult(goalId: string, krId: string, req: UpdateKeyResultReq) {
    const result = await service.updateKeyResult(goalId, krId, sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateKeyResult(dto);
      return dto;
    } else {
      handleError(result.error, 'goal.error.updateKRFailed', 'updateKeyResult');
      return null;
    }
  }

  async function deleteKeyResult(goalId: string, krId: string) {
    const result = await service.deleteKeyResult(goalId, krId);
    if (result.ok) {
      store.removeKeyResult(krId);
      return true;
    } else {
      handleError(result.error, 'goal.error.deleteKRFailed', 'deleteKeyResult');
      return false;
    }
  }

  // ── Records ──────────────────────────────────────────────────────────

  async function fetchRecords(goalId: string) {
    const result = await service.getGoalRecordsByGoal(goalId);
    if (result.ok) {
      store.setGoalRecords(
        (result.data.records ?? []).map((r: GoalRecordEntityLike) => r.toDTO()),
      );
    } else {
      handleError(result.error, 'goal.error.loadRecordsFailed', 'fetchRecords');
    }
  }

  async function createRecord(goalId: string, req: CreateGoalRecordReq) {
    const { keyResultId, ...rest } = req;
    const result = await service.createGoalRecord(goalId, keyResultId, sanitizeForIpc(rest));
    if (result.ok) {
      const dto = result.data.toDTO();
      await Promise.all([fetchKeyResults(goalId), fetchRecords(goalId)]);
      return dto;
    } else {
      handleError(result.error, 'goal.error.createRecordFailed', 'createRecord');
      return null;
    }
  }

  async function createGoalRecord(
    goalId: string,
    keyResultId: string,
    data: { value: number; note?: string; recordedAt?: number },
  ) {
    return createRecord(goalId, { keyResultId, ...data } as CreateGoalRecordReq);
  }

  // ── Aggregate View ───────────────────────────────────────────────────

  async function getGoalAggregateView(goalId: string): Promise<GetGoalAggregateRes | null> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getGoalAggregateView(goalId);
      if (result.ok) {
        store.setCurrentGoal(result.data.goal);
        store.setKeyResults(result.data.keyResults ?? result.data.goal.keyResults ?? []);
        store.setGoalRecords(result.data.records ?? []);
        store.setGoalReviews(result.data.reviews ?? result.data.goal.reviews ?? []);
        return result.data;
      } else {
        handleError(result.error, 'goal.error.loadAggregateViewFailed', 'getGoalAggregateView');
        return null;
      }
    } finally {
      store.setLoading(false);
    }
  }

  // ── Reviews ──────────────────────────────────────────────────────────

  async function fetchReviews(goalId: string) {
    const result = await service.getGoalReviews(goalId);
    if (result.ok) {
      store.setGoalReviews(
        (result.data.reviews ?? []).map((r: GoalReviewEntityLike) => r.toDTO()),
      );
    } else {
      handleError(result.error, 'goal.error.loadReviewsFailed', 'fetchReviews');
    }
  }

  async function createReview(goalId: string, req: CreateGoalReviewReq) {
    const result = await service.createGoalReview(goalId, sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addGoalReview(dto);
      return dto;
    } else {
      handleError(result.error, 'goal.error.createReviewFailed', 'createReview');
      return null;
    }
  }

  // ── Sub-composables ──────────────────────────────────────────────────

  const focusMode = useFocusMode();
  const filters = useGoalFilters(fetchGoals);

  return {
    // View state
    goals,
    currentGoal,
    keyResults,
    goalFolders,
    goalReviews,
    goalRecords,
    isLoading,
    isSaving,
    error,
    // Goal CRUD
    fetchGoals,
    fetchGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    // Folder CRUD
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    // Key Result CRUD
    fetchKeyResults,
    addKeyResult,
    updateKeyResult,
    deleteKeyResult,
    // Records
    fetchRecords,
    createRecord,
    createGoalRecord,
    // Aggregate view
    getGoalAggregateView,
    // Reviews
    fetchReviews,
    createReview,
    // Focus mode (delegated)
    ...focusMode,
    // Filters (delegated)
    ...filters,
  };
}
