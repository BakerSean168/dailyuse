/**
 * useTask - 任务模块主 composable
 */

import { computed, ref } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { taskApi, TaskApiError } from '../services/taskApi';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskReq,
  UpdateTaskReq,
} from '@dailyuse/contracts/task';

export function useTask() {
  const store = useTaskStore();
  const savingId = ref<string | null>(null);

  const templates = computed(() => store.templates);
  const instances = computed(() => store.instances);
  const folders = computed(() => store.folders);
  const currentTemplate = computed(() => store.currentTemplate);
  const currentInstance = computed(() => store.currentInstance);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof TaskApiError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  // ========== Templates ==========
  async function fetchTemplates(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await taskApi.listTemplates({ ...query, page: store.pagination.page, pageSize: store.pagination.pageSize });
      store.setTemplates(res.data, res.total);
    } catch (e) { handleError(e, '加载任务模板失败'); }
    finally { store.setLoading(false); }
  }

  async function fetchTemplate(id: string) {
    store.setLoading(true); store.setError(null);
    try { const t = await taskApi.getTemplate(id); store.setCurrentTemplate(t); return t; }
    catch (e) { handleError(e, '加载任务模板失败'); return null; }
    finally { store.setLoading(false); }
  }

  async function createTemplate(req: CreateTaskReq) {
    savingId.value = 'new'; store.setError(null);
    try { const t = await taskApi.createTemplate(req); store.addTemplate(t); return t; }
    catch (e) { handleError(e, '创建任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateTemplate(id: string, req: UpdateTaskReq) {
    savingId.value = id; store.setError(null);
    try { const t = await taskApi.updateTemplate(id, req); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '更新任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteTemplate(id: string) {
    savingId.value = id; store.setError(null);
    try { await taskApi.deleteTemplate(id); store.removeTemplate(id); return true; }
    catch (e) { handleError(e, '删除任务失败'); return false; }
    finally { savingId.value = null; }
  }

  async function activateTemplate(id: string) {
    try { const t = await taskApi.activateTemplate(id); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '激活任务失败'); return null; }
  }

  async function pauseTemplate(id: string) {
    try { const t = await taskApi.pauseTemplate(id); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '暂停任务失败'); return null; }
  }

  async function archiveTemplate(id: string) {
    try { const t = await taskApi.archiveTemplate(id); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '归档任务失败'); return null; }
  }

  // ========== Instances ==========
  async function fetchInstances(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try { const res = await taskApi.listInstances(query); store.setInstances(res.data); }
    catch (e) { handleError(e, '加载任务实例失败'); }
    finally { store.setLoading(false); }
  }

  async function startInstance(id: string) {
    try { const i = await taskApi.startInstance(id); store.updateInstance(i); return i; }
    catch (e) { handleError(e, '开始任务失败'); return null; }
  }

  async function completeInstance(id: string) {
    try { const i = await taskApi.completeInstance(id); store.updateInstance(i); return i; }
    catch (e) { handleError(e, '完成任务失败'); return null; }
  }

  async function skipInstance(id: string) {
    try { const i = await taskApi.skipInstance(id); store.updateInstance(i); return i; }
    catch (e) { handleError(e, '跳过任务失败'); return null; }
  }

  // ========== Folders ==========
  async function fetchFolders() {
    try { const res = await taskApi.listFolders(); store.setFolders(res.data); }
    catch (e) { handleError(e, '加载任务文件夹失败'); }
  }

  function setPage(p: number) { store.setPage(p); fetchTemplates(); }

  return {
    templates, instances, folders, currentTemplate, currentInstance,
    isLoading, isSaving, error, pagination,
    fetchTemplates, fetchTemplate, createTemplate, updateTemplate, deleteTemplate,
    activateTemplate, pauseTemplate, archiveTemplate,
    fetchInstances, startInstance, completeInstance, skipInstance,
    fetchFolders, setPage,
  };
}
