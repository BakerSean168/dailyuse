/**
 * useGoal - 目标模块主 composable
 *
 * 编排 GoalClientService 调用 + Store 更新 + 错误处理。
 * 通过 inject(GOAL_SERVICE_KEY) 获取服务实例，
 * 使用 Result<T> 模式替代 try/catch。
 */

import { computed, inject, ref } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import { GOAL_SERVICE_KEY } from '@/shared/di';
import type { Goal, GoalFolder, KeyResult, GoalReview, GoalRecord } from '@dailyuse/goal/domain-client';
import type {
  GoalClientDTO,
  CreateGoalReq,
  UpdateGoalReq,
  GoalStatus,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  CreateGoalRecordReq,
  CreateGoalReviewReq,
} from '@dailyuse/contracts/goal';

export function useGoal() {
  const store = useGoalStore();
  const service = inject(GOAL_SERVICE_KEY)!;
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

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  async function fetchGoals() {
    store.setLoading(true);
    store.setError(null);
    try {
      const searchQuery = store.searchQuery || undefined;
      const params = {
        status: store.filterStatus || undefined,
        page: store.pagination.page,
        limit: store.pagination.pageSize,
      };

      const result = searchQuery
        ? await service.searchGoals({ query: searchQuery, ...params })
        : await service.listGoals(params);

      if (result.ok) {
        store.setGoals(
          result.data.goals.map((g: Goal) => g.toDTO()),
          result.data.pagination.total,
        );
      } else {
        handleError(result.error.message || '加载目标列表失败');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchGoal(id: string): Promise<GoalClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getGoal(id);
      if (result.ok) {
        const dto = result.data.toDTO();
        store.setCurrentGoal(dto);
        return dto;
      } else {
        handleError(result.error.message || '加载目标失败');
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
      const result = await service.createGoal(req);
      if (result.ok) {
        const dto = result.data.toDTO();
        store.addGoal(dto);
        return dto;
      } else {
        handleError(result.error.message || '创建目标失败');
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
      const result = await service.updateGoal(id, req);
      if (result.ok) {
        const dto = result.data.toDTO();
        store.updateGoal(dto);
        return dto;
      } else {
        handleError(result.error.message || '更新目标失败');
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
        handleError(result.error.message || '删除目标失败');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function fetchFolders() {
    const result = await service.listGoalFolders();
    if (result.ok) {
      store.setGoalFolders(result.data.map((f: GoalFolder) => f.toDTO()));
    } else {
      handleError(result.error.message || '加载文件夹失败');
    }
  }

  async function createFolder(req: CreateGoalFolderReq) {
    const result = await service.createGoalFolder(req);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addGoalFolder(dto);
      return dto;
    } else {
      handleError(result.error.message || '创建文件夹失败');
      return null;
    }
  }

  async function updateFolder(id: string, req: UpdateGoalFolderReq) {
    const result = await service.updateGoalFolder(id, req);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateGoalFolder(dto);
      return dto;
    } else {
      handleError(result.error.message || '更新文件夹失败');
      return null;
    }
  }

  async function deleteFolder(id: string) {
    const result = await service.deleteGoalFolder(id);
    if (result.ok) {
      store.removeGoalFolder(id);
      return true;
    } else {
      handleError(result.error.message || '删除文件夹失败');
      return false;
    }
  }

  async function fetchKeyResults(goalId: string) {
    const result = await service.getKeyResults(goalId);
    if (result.ok) {
      store.setKeyResults(result.data.keyResults.map((kr: KeyResult) => kr.toDTO()));
    } else {
      handleError(result.error.message || '加载关键结果失败');
    }
  }

  async function addKeyResult(goalId: string, req: AddKeyResultReq) {
    const result = await service.createKeyResult(goalId, req);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addKeyResult(dto);
      return dto;
    } else {
      handleError(result.error.message || '添加关键结果失败');
      return null;
    }
  }

  async function updateKeyResult(goalId: string, krId: string, req: UpdateKeyResultReq) {
    const result = await service.updateKeyResult(goalId, krId, req);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateKeyResult(dto);
      return dto;
    } else {
      handleError(result.error.message || '更新关键结果失败');
      return null;
    }
  }

  async function deleteKeyResult(goalId: string, krId: string) {
    const result = await service.deleteKeyResult(goalId, krId);
    if (result.ok) {
      store.removeKeyResult(krId);
      return true;
    } else {
      handleError(result.error.message || '删除关键结果失败');
      return false;
    }
  }

  async function fetchRecords(goalId: string) {
    const result = await service.getGoalRecordsByGoal(goalId);
    if (result.ok) {
      store.setGoalRecords(result.data.records.map((r: GoalRecord) => r.toDTO()));
    } else {
      handleError(result.error.message || '加载进度记录失败');
    }
  }

  async function createRecord(goalId: string, req: CreateGoalRecordReq) {
    const { keyResultId, ...rest } = req;
    const result = await service.createGoalRecord(goalId, keyResultId, rest);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addGoalRecord(dto);
      return dto;
    } else {
      handleError(result.error.message || '创建进度记录失败');
      return null;
    }
  }

  async function fetchReviews(goalId: string) {
    const result = await service.getGoalReviews(goalId);
    if (result.ok) {
      store.setGoalReviews(result.data.reviews.map((r: GoalReview) => r.toDTO()));
    } else {
      handleError(result.error.message || '加载复盘失败');
    }
  }

  async function createReview(goalId: string, req: CreateGoalReviewReq) {
    const result = await service.createGoalReview(goalId, req);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addGoalReview(dto);
      return dto;
    } else {
      handleError(result.error.message || '创建复盘失败');
      return null;
    }
  }

  function setFilterStatus(s: GoalStatus | null) { store.setFilterStatus(s); fetchGoals(); }
  function setPage(p: number) { store.setPage(p); fetchGoals(); }
  function clearFilters() { store.clearFilters(); fetchGoals(); }
  function search(q: string) { store.setSearchQuery(q); fetchGoals(); }

  return {
    goals, currentGoal, keyResults, goalFolders, goalReviews, goalRecords,
    isLoading, isSaving, error, pagination, hasActiveFilter,
    fetchGoals, fetchGoal, createGoal, updateGoal, deleteGoal,
    fetchFolders, createFolder, updateFolder, deleteFolder,
    fetchKeyResults, addKeyResult, updateKeyResult, deleteKeyResult,
    fetchRecords, createRecord, fetchReviews, createReview,
    setFilterStatus, setPage, clearFilters, search,
  };
}
