/**
 * useTask - 任务模块主 composable
 *
 * 通过 inject 获取 TaskClientService，所有方法返回 Result<T>。
 */

import { computed, inject, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useTaskStore } from '../stores/taskStore';
import { TASK_SERVICE_KEY } from '../../../di/keys';
import type {
  CreateTaskReq,
  UpdateTaskReq,
} from '@dailyuse/contracts/task';
import type { TaskTemplate, TaskInstance } from '@dailyuse/task/domain-client';

export function useTask() {
  const service = inject(TASK_SERVICE_KEY);
  if (!service) throw new Error('TASK_SERVICE_KEY not provided');
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

  function handleError(message: string): void {
    store.setError(message);
    toast.error('操作失败', { description: message });
  }

  // ========== Templates ==========
  async function fetchTemplates(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    const result = await service.listTemplates({
      ...query,
      page: store.pagination.page,
      limit: store.pagination.pageSize,
    } as Parameters<typeof service.listTemplates>[0]);
    if (result.ok) {
      store.setTemplates(result.data.templates.map((t: TaskTemplate) => t.toDTO()), result.data.total);
    } else {
      handleError(result.error.message || '加载任务模板失败');
    }
    store.setLoading(false);
  }

  async function fetchTemplate(id: string) {
    store.setLoading(true); store.setError(null);
    const result = await service.getTemplate(id);
    store.setLoading(false);
    if (result.ok) { const dto = result.data.toDTO(); store.setCurrentTemplate(dto); return dto; }
    handleError(result.error.message || '加载任务模板失败');
    return null;
  }

  async function createTemplate(req: CreateTaskReq) {
    savingId.value = 'new'; store.setError(null);
    const result = await service.createTemplate(req);
    savingId.value = null;
    if (result.ok) {
      const dto = result.data.toDTO();
      store.addTemplate(dto);
      toast.success('任务创建成功');
      return dto;
    }
    handleError(result.error.message || '创建任务失败');
    return null;
  }

  async function updateTemplate(id: string, req: UpdateTaskReq) {
    savingId.value = id; store.setError(null);
    const result = await service.updateTemplate(id, req);
    savingId.value = null;
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success('任务更新成功');
      return dto;
    }
    handleError(result.error.message || '更新任务失败');
    return null;
  }

  async function deleteTemplate(id: string) {
    savingId.value = id; store.setError(null);
    const result = await service.deleteTemplate(id);
    savingId.value = null;
    if (result.ok) {
      store.removeTemplate(id);
      toast.success('任务删除成功');
      return true;
    }
    handleError(result.error.message || '删除任务失败');
    return false;
  }

  async function activateTemplate(id: string) {
    const result = await service.activateTemplate(id);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success('任务已激活');
      return dto;
    }
    handleError(result.error.message || '激活任务失败');
    return null;
  }

  async function pauseTemplate(id: string) {
    const result = await service.pauseTemplate(id);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success('任务已暂停');
      return dto;
    }
    handleError(result.error.message || '暂停任务失败');
    return null;
  }

  async function archiveTemplate(id: string) {
    const result = await service.archiveTemplate(id);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success('任务已归档');
      return dto;
    }
    handleError(result.error.message || '归档任务失败');
    return null;
  }

  // ========== Instances ==========
  async function fetchInstances(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    const result = await service.listInstances(query as Parameters<typeof service.listInstances>[0]);
    if (result.ok) {
      store.setInstances(result.data.map((i: TaskInstance) => i.toDTO()));
    } else {
      handleError(result.error.message || '加载任务实例失败');
    }
    store.setLoading(false);
  }

  async function startInstance(id: string) {
    const result = await service.startInstance(id);
    if (result.ok) { const dto = result.data.toDTO(); store.updateInstance(dto); return dto; }
    handleError(result.error.message || '开始任务失败');
    return null;
  }

  async function completeInstance(id: string) {
    const result = await service.completeInstance(id);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      toast.success('任务完成');
      return dto;
    }
    handleError(result.error.message || '完成任务失败');
    return null;
  }

  async function skipInstance(id: string) {
    const result = await service.skipInstance(id);
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      toast.success('任务已跳过');
      return dto;
    }
    handleError(result.error.message || '跳过任务失败');
    return null;
  }

  // ========== Folders ==========
  async function fetchFolders() {
    // TODO: Backend API for task folders is not implemented yet.
    // Ensure this feature is implemented on backend before enabling.
    console.warn('fetchFolders: Task folders feature is not implemented on backend yet.');
    /*
    const result = await service.listFolders();
    if (result.ok) { store.setFolders(result.data.map(f => f.toDTO())); }
    else { handleError(result.error.message || '加载任务文件夹失败'); }
    */
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
