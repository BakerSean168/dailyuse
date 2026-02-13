/**
 * useTask - 任务模块主 composable
 *
 * 使用 @dailyuse/http-client 的 AxiosHttpClient 进行 HTTP 调用。
 */

import { computed, ref } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { httpClient } from '@/shared/http';
import { HttpClientError } from '@dailyuse/http-client';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskFolderClientDTO,
  CreateTaskReq,
  UpdateTaskReq,
  GetInstancesByRangeRes,
} from '@dailyuse/contracts/task';

const TEMPLATE_URL = '/task-templates';
const INSTANCE_URL = '/task-instances';

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
    const msg = err instanceof HttpClientError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  // ========== Templates ==========
  async function fetchTemplates(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await httpClient.get<{ data: TaskTemplateClientDTO[]; total: number }>(TEMPLATE_URL, {
        params: { ...query, page: store.pagination.page, pageSize: store.pagination.pageSize },
      });
      store.setTemplates(res.data, res.total);
    } catch (e) { handleError(e, '加载任务模板失败'); }
    finally { store.setLoading(false); }
  }

  async function fetchTemplate(id: string) {
    store.setLoading(true); store.setError(null);
    try { const t = await httpClient.get<TaskTemplateClientDTO>(`${TEMPLATE_URL}/${id}`); store.setCurrentTemplate(t); return t; }
    catch (e) { handleError(e, '加载任务模板失败'); return null; }
    finally { store.setLoading(false); }
  }

  async function createTemplate(req: CreateTaskReq) {
    savingId.value = 'new'; store.setError(null);
    try { const t = await httpClient.post<TaskTemplateClientDTO>(TEMPLATE_URL, req); store.addTemplate(t); return t; }
    catch (e) { handleError(e, '创建任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateTemplate(id: string, req: UpdateTaskReq) {
    savingId.value = id; store.setError(null);
    try { const t = await httpClient.put<TaskTemplateClientDTO>(`${TEMPLATE_URL}/${id}`, req); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '更新任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteTemplate(id: string) {
    savingId.value = id; store.setError(null);
    try { await httpClient.delete<void>(`${TEMPLATE_URL}/${id}`); store.removeTemplate(id); return true; }
    catch (e) { handleError(e, '删除任务失败'); return false; }
    finally { savingId.value = null; }
  }

  async function activateTemplate(id: string) {
    try { const t = await httpClient.post<TaskTemplateClientDTO>(`${TEMPLATE_URL}/${id}/activate`); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '激活任务失败'); return null; }
  }

  async function pauseTemplate(id: string) {
    try { const t = await httpClient.post<TaskTemplateClientDTO>(`${TEMPLATE_URL}/${id}/pause`); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '暂停任务失败'); return null; }
  }

  async function archiveTemplate(id: string) {
    try { const t = await httpClient.post<TaskTemplateClientDTO>(`${TEMPLATE_URL}/${id}/archive`); store.updateTemplate(t); return t; }
    catch (e) { handleError(e, '归档任务失败'); return null; }
  }

  // ========== Instances ==========
  async function fetchInstances(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try { const res = await httpClient.get<GetInstancesByRangeRes>(INSTANCE_URL, { params: query }); store.setInstances(res.data); }
    catch (e) { handleError(e, '加载任务实例失败'); }
    finally { store.setLoading(false); }
  }

  async function startInstance(id: string) {
    try { const i = await httpClient.post<TaskInstanceClientDTO>(`${INSTANCE_URL}/${id}/start`); store.updateInstance(i); return i; }
    catch (e) { handleError(e, '开始任务失败'); return null; }
  }

  async function completeInstance(id: string) {
    try { const i = await httpClient.post<TaskInstanceClientDTO>(`${INSTANCE_URL}/${id}/complete`); store.updateInstance(i); return i; }
    catch (e) { handleError(e, '完成任务失败'); return null; }
  }

  async function skipInstance(id: string) {
    try { const i = await httpClient.post<TaskInstanceClientDTO>(`${INSTANCE_URL}/${id}/skip`); store.updateInstance(i); return i; }
    catch (e) { handleError(e, '跳过任务失败'); return null; }
  }

  // ========== Folders ==========
  async function fetchFolders() {
    try { const res = await httpClient.get<{ data: TaskFolderClientDTO[]; total: number }>(`${TEMPLATE_URL}/folders`); store.setFolders(res.data); }
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
