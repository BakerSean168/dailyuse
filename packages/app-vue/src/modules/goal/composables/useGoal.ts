/**
 * useGoal - 目标模块主 composable
 *
 * 编排 GoalClientService 调用 + Store 更新 + 错误处理。
 * 通过 inject(GOAL_SERVICE_KEY) 获取服务实例，
 * 使用 Result<T> 模式替代 try/catch。
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGoalStore } from '../stores/goalStore';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { ResultError } from '@dailyuse/contracts/result';
import type {
  Goal,
  GoalFolder,
  KeyResult,
  GoalReview,
  GoalRecord,
} from '@dailyuse/goal/domain-client';
import type {
  GoalClientDTO,
  CreateGoalReq,
  UpdateGoalReq,
  GetGoalAggregateRes,
  GoalSystemView,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  CreateGoalRecordReq,
  CreateGoalReviewReq,
} from '@dailyuse/contracts/goal';

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
  const pagination = computed(() => store.pagination);
  const hasActiveFilter = computed(() => store.hasActiveFilter);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(msg: string, err?: ResultError, scope?: string): void {
    store.setError(msg);
    if (!err) {
      console.error(msg);
      return;
    }

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
    });
  }

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
          (result.data.goals ?? []).map((g: Goal) => g.toDTO()),
          result.data.pagination?.total ?? 0,
        );
      } else {
        handleError(
          result.error.message || t('goal.error.loadListFailed'),
          result.error,
          'fetchGoals',
        );
      }
    } catch (e: any) {
      handleError(e?.message || t('goal.error.loadListException'));
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchGoal(id: string): Promise<GoalClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    // Clear key results when switching goals to prevent stale data
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
        handleError(result.error.message || t('goal.error.loadFailed'), result.error, 'fetchGoal');
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
        handleError(
          result.error.message || t('goal.error.createFailed'),
          result.error,
          'createGoal',
        );
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
        handleError(
          result.error.message || t('goal.error.updateFailed'),
          result.error,
          'updateGoal',
        );
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
        handleError(
          result.error.message || t('goal.error.deleteFailed'),
          result.error,
          'deleteGoal',
        );
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function fetchFolders() {
    const result = await service.listGoalFolders();
    if (result.ok) {
      store.setGoalFolders((result.data ?? []).map((f: GoalFolder) => f.toDTO()));
    } else {
      handleError(
        result.error.message || t('goal.error.loadFoldersFailed'),
        result.error,
        'fetchFolders',
      );
    }
  }

  async function createFolder(req: CreateGoalFolderReq) {
    const result = await service.createGoalFolder(sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addGoalFolder(dto);
      return dto;
    } else {
      handleError(
        result.error.message || t('goal.error.createFolderFailed'),
        result.error,
        'createFolder',
      );
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
      handleError(
        result.error.message || t('goal.error.updateFolderFailed'),
        result.error,
        'updateFolder',
      );
      return null;
    }
  }

  async function deleteFolder(id: string) {
    const result = await service.deleteGoalFolder(id);
    if (result.ok) {
      store.removeGoalFolder(id);
      return true;
    } else {
      handleError(
        result.error.message || t('goal.error.deleteFolderFailed'),
        result.error,
        'deleteFolder',
      );
      return false;
    }
  }

  async function fetchKeyResults(goalId: string) {
    const result = await service.getKeyResults(goalId);
    if (result.ok) {
      store.setKeyResults((result.data.keyResults ?? []).map((kr: KeyResult) => kr.toDTO()));
    } else {
      handleError(
        result.error.message || t('goal.error.loadKRFailed'),
        result.error,
        'fetchKeyResults',
      );
    }
  }

  async function addKeyResult(goalId: string, req: AddKeyResultReq) {
    const result = await service.createKeyResult(goalId, sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addKeyResult(dto);
      return dto;
    } else {
      handleError(
        result.error.message || t('goal.error.addKRFailed'),
        result.error,
        'addKeyResult',
      );
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
      handleError(
        result.error.message || t('goal.error.updateKRFailed'),
        result.error,
        'updateKeyResult',
      );
      return null;
    }
  }

  async function deleteKeyResult(goalId: string, krId: string) {
    const result = await service.deleteKeyResult(goalId, krId);
    if (result.ok) {
      store.removeKeyResult(krId);
      return true;
    } else {
      handleError(
        result.error.message || t('goal.error.deleteKRFailed'),
        result.error,
        'deleteKeyResult',
      );
      return false;
    }
  }

  async function fetchRecords(goalId: string) {
    const result = await service.getGoalRecordsByGoal(goalId);
    if (result.ok) {
      store.setGoalRecords((result.data.records ?? []).map((r: GoalRecord) => r.toDTO()));
    } else {
      handleError(
        result.error.message || t('goal.error.loadRecordsFailed'),
        result.error,
        'fetchRecords',
      );
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
      handleError(
        result.error.message || t('goal.error.createRecordFailed'),
        result.error,
        'createRecord',
      );
      return null;
    }
  }

  /**
   * createGoalRecord - 便捷别名，接收 (goalId, keyResultId, data) 三参数
   * 供 GoalRecordDialog 等组件调用
   */
  async function createGoalRecord(
    goalId: string,
    keyResultId: string,
    data: { value: number; note?: string; recordedAt?: number },
  ) {
    return createRecord(goalId, { keyResultId, ...data } as CreateGoalRecordReq);
  }

  /**
   * getGoalAggregateView - 获取单个目标聚合视图（含关键结果等）
   * 供 GoalDAGVisualization 等组件调用
   */
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
        handleError(
          result.error.message || t('goal.error.loadAggregateViewFailed'),
          result.error,
          'getGoalAggregateView',
        );
        return null;
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchReviews(goalId: string) {
    const result = await service.getGoalReviews(goalId);
    if (result.ok) {
      store.setGoalReviews((result.data.reviews ?? []).map((r: GoalReview) => r.toDTO()));
    } else {
      handleError(
        result.error.message || t('goal.error.loadReviewsFailed'),
        result.error,
        'fetchReviews',
      );
    }
  }

  async function createReview(goalId: string, req: CreateGoalReviewReq) {
    const result = await service.createGoalReview(goalId, sanitizeForIpc(req));
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addGoalReview(dto);
      return dto;
    } else {
      handleError(
        result.error.message || t('goal.error.createReviewFailed'),
        result.error,
        'createReview',
      );
      return null;
    }
  }

  function setSystemView(v: GoalSystemView) {
    store.setSystemView(v);
    fetchGoals();
  }
  function setPage(p: number) {
    store.setPage(p);
    fetchGoals();
  }
  function clearFilters() {
    store.clearFilters();
    fetchGoals();
  }
  function search(q: string) {
    store.setSearchQuery(q);
    fetchGoals();
  }

  return {
    goals,
    currentGoal,
    keyResults,
    goalFolders,
    goalReviews,
    goalRecords,
    isLoading,
    isSaving,
    error,
    pagination,
    hasActiveFilter,
    fetchGoals,
    fetchGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    fetchKeyResults,
    addKeyResult,
    updateKeyResult,
    deleteKeyResult,
    fetchRecords,
    createRecord,
    createGoalRecord,
    getGoalAggregateView,
    fetchReviews,
    createReview,
    setSystemView,
    setPage,
    clearFilters,
    search,
  };
}
