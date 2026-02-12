/**
 * useGoal - 目标模块主 composable
 *
 * 编排 API 调用 + Store 更新 + 错误处理。
 */

import { computed, ref } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import { goalApi, GoalApiError } from '../services/goalApi';
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
  UpdateGoalReviewReq,
} from '@dailyuse/contracts/goal';

export function useGoal() {
  const store = useGoalStore();
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

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof GoalApiError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  async function fetchGoals() {
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await goalApi.queryGoals({
        status: store.filterStatus ? [store.filterStatus] : undefined,
        keyword: store.searchQuery || undefined,
        page: store.pagination.page,
        pageSize: store.pagination.pageSize,
      });
      store.setGoals(res.data, res.pagination.total);
    } catch (e) { handleError(e, '加载目标列表失败'); }
    finally { store.setLoading(false); }
  }

  async function fetchGoal(id: string): Promise<GoalClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    try { const g = await goalApi.getGoal(id); store.setCurrentGoal(g); return g; }
    catch (e) { handleError(e, '加载目标失败'); return null; }
    finally { store.setLoading(false); }
  }

  async function createGoal(req: CreateGoalReq) {
    savingId.value = 'new'; store.setError(null);
    try { const g = await goalApi.createGoal(req); store.addGoal(g); return g; }
    catch (e) { handleError(e, '创建目标失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateGoal(id: string, req: UpdateGoalReq) {
    savingId.value = id; store.setError(null);
    try { const g = await goalApi.updateGoal(id, req); store.updateGoal(g); return g; }
    catch (e) { handleError(e, '更新目标失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteGoal(id: string) {
    savingId.value = id; store.setError(null);
    try { await goalApi.deleteGoal(id); store.removeGoal(id); return true; }
    catch (e) { handleError(e, '删除目标失败'); return false; }
    finally { savingId.value = null; }
  }

  async function fetchFolders() {
    try { const r = await goalApi.listFolders(); store.setGoalFolders(r.data); }
    catch (e) { handleError(e, '加载文件夹失败'); }
  }

  async function createFolder(req: CreateGoalFolderReq) {
    try { const f = await goalApi.createFolder(req); store.addGoalFolder(f); return f; }
    catch (e) { handleError(e, '创建文件夹失败'); return null; }
  }

  async function updateFolder(id: string, req: UpdateGoalFolderReq) {
    try { const f = await goalApi.updateFolder(id, req); store.updateGoalFolder(f); return f; }
    catch (e) { handleError(e, '更新文件夹失败'); return null; }
  }

  async function deleteFolder(id: string) {
    try { await goalApi.deleteFolder(id); store.removeGoalFolder(id); return true; }
    catch (e) { handleError(e, '删除文件夹失败'); return false; }
  }

  async function fetchKeyResults(goalId: string) {
    try { const r = await goalApi.getKeyResults(goalId); store.setKeyResults(r.data); }
    catch (e) { handleError(e, '加载关键结果失败'); }
  }

  async function addKeyResult(goalId: string, req: AddKeyResultReq) {
    try { const kr = await goalApi.addKeyResult(goalId, req); store.addKeyResult(kr); return kr; }
    catch (e) { handleError(e, '添加关键结果失败'); return null; }
  }

  async function updateKeyResult(goalId: string, krId: string, req: UpdateKeyResultReq) {
    try { const kr = await goalApi.updateKeyResult(goalId, krId, req); store.updateKeyResult(kr); return kr; }
    catch (e) { handleError(e, '更新关键结果失败'); return null; }
  }

  async function deleteKeyResult(goalId: string, krId: string) {
    try { await goalApi.deleteKeyResult(goalId, krId); store.removeKeyResult(krId); return true; }
    catch (e) { handleError(e, '删除关键结果失败'); return false; }
  }

  async function fetchRecords(goalId: string) {
    try { const r = await goalApi.getRecords(goalId); store.setGoalRecords(r.data); }
    catch (e) { handleError(e, '加载进度记录失败'); }
  }

  async function createRecord(goalId: string, req: CreateGoalRecordReq) {
    try { const r = await goalApi.createRecord(goalId, req); store.addGoalRecord(r); return r; }
    catch (e) { handleError(e, '创建进度记录失败'); return null; }
  }

  async function fetchReviews(goalId: string) {
    try { const r = await goalApi.getReviews(goalId); store.setGoalReviews(r.data); }
    catch (e) { handleError(e, '加载复盘失败'); }
  }

  async function createReview(goalId: string, req: CreateGoalReviewReq) {
    try { const r = await goalApi.createReview(goalId, req); store.addGoalReview(r); return r; }
    catch (e) { handleError(e, '创建复盘失败'); return null; }
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
