/**
 * useGoal - 目标模块主 composable
 *
 * 编排 GoalClientService 调用 + Store 更新 + 错误处理。
 * 通过 inject(GOAL_SERVICE_KEY) 获取服务实例，
 * 使用 Result<T> 模式替代 try/catch。
 *
 * 子实体操作已拆分：
 * - useFocusMode: focus mode
 * - useGoalFilters: filter/search
 * - useGoalFolders: folder CRUD
 * - useKeyResults: key result CRUD
 * - useGoalRecords: records + reviews
 * - goalOperations: 共享 orchestration helpers
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGoalStore } from '../stores/goal-store';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type {
  GoalClientDTO,
  CreateGoalReq,
  UpdateGoalReq,
  GetGoalAggregateRes,
} from '@dailyuse/contracts/goal';
import { executeGoalOperation, executeGoalAction, createGoalErrorHandler } from './goalOperations';
import { useFocusMode } from './useFocusMode';
import { useGoalFilters } from './useGoalFilters';
import { useGoalFolders } from './useGoalFolders';
import { useKeyResults } from './useKeyResults';
import { useGoalRecords } from './useGoalRecords';

type GoalEntityLike = { toDTO(): GoalClientDTO };

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

  const opOpts = {
    t,
    setError: (msg: string | null) => store.setError(msg),
    onError: createGoalErrorHandler(t, (msg) => store.setError(msg)),
  };

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
        opOpts.onError(result.error, 'goal.error.loadListFailed', 'fetchGoals');
      }
    } catch (e: unknown) {
      opOpts.onError(e, 'goal.error.loadListException', 'fetchGoals');
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
      const data = await executeGoalOperation(() => service.getGoal(id), {
        ...opOpts,
        fallbackKey: 'goal.error.loadFailed',
        scope: 'fetchGoal',
      });
      if (data) {
        const dto = data.toDTO();
        store.setCurrentGoal(dto);
        return dto;
      }
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  async function createGoal(req: CreateGoalReq) {
    savingId.value = 'new';
    store.setError(null);
    try {
      const data = await executeGoalOperation(
        () => service.createGoal(sanitizeForIpc(req)),
        { ...opOpts, fallbackKey: 'goal.error.createFailed', scope: 'createGoal' },
      );
      if (data) {
        const dto = data.toDTO();
        store.addGoal(dto);
        return dto;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateGoal(id: string, req: UpdateGoalReq) {
    savingId.value = id;
    store.setError(null);
    try {
      const data = await executeGoalOperation(
        () => service.updateGoal(id, sanitizeForIpc(req)),
        { ...opOpts, fallbackKey: 'goal.error.updateFailed', scope: 'updateGoal' },
      );
      if (data) {
        const dto = data.toDTO();
        store.updateGoal(dto);
        return dto;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteGoal(id: string) {
    savingId.value = id;
    store.setError(null);
    try {
      const ok = await executeGoalAction(
        () => service.deleteGoal(id),
        { ...opOpts, fallbackKey: 'goal.error.deleteFailed', scope: 'deleteGoal' },
      );
      if (ok) store.removeGoal(id);
      return ok;
    } finally {
      savingId.value = null;
    }
  }

  // ── Aggregate View ───────────────────────────────────────────────────

  async function getGoalAggregateView(goalId: string): Promise<GetGoalAggregateRes | null> {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await executeGoalOperation(
        () => service.getGoalAggregateView(goalId),
        { ...opOpts, fallbackKey: 'goal.error.loadAggregateViewFailed', scope: 'getGoalAggregateView' },
      );
      if (data) {
        store.setCurrentGoal(data.goal);
        store.setKeyResults(data.keyResults ?? data.goal.keyResults ?? []);
        store.setGoalRecords(data.records ?? []);
        store.setGoalReviews(data.reviews ?? data.goal.reviews ?? []);
        return data;
      }
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  // ── Sub-composables ──────────────────────────────────────────────────

  const focusMode = useFocusMode();
  const filters = useGoalFilters(fetchGoals);
  const folders = useGoalFolders();
  const keyResultOps = useKeyResults();
  const recordOps = useGoalRecords();

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
    // Aggregate view
    getGoalAggregateView,
    // Focus mode (delegated)
    ...focusMode,
    // Filters (delegated)
    ...filters,
    // Folder CRUD (delegated)
    ...folders,
    // Key Result CRUD (delegated)
    ...keyResultOps,
    // Records + Reviews (delegated)
    ...recordOps,
  };
}
