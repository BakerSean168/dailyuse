/**
 * useReminder - 提醒模块主 composable
 *
 * 使用 @dailyuse/http-client 的 AxiosHttpClient 进行 HTTP 调用。
 */

import { computed, ref } from 'vue';
import { useReminderStore } from '../stores/reminderStore';
import { httpClient } from '@/shared/http';
import { HttpClientError } from '@dailyuse/http-client';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
} from '@dailyuse/contracts/reminder';

const TEMPLATES_BASE = '/reminder-templates';
const GROUPS_BASE = '/reminder-groups';

export function useReminder() {
  const store = useReminderStore();
  const savingId = ref<string | null>(null);

  const templates = computed(() => store.templates);
  const groups = computed(() => store.groups);
  const currentTemplate = computed(() => store.currentTemplate);
  const currentGroup = computed(() => store.currentGroup);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof HttpClientError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  // ── Templates ──
  async function fetchTemplates(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await httpClient.get<{ data: ReminderTemplateClientDTO[]; total: number }>(TEMPLATES_BASE, {
        params: { ...query, page: store.pagination.page, pageSize: store.pagination.pageSize },
      });
      store.setTemplates(res.data as ReminderTemplateClientDTO[], res.total);
    } catch (e) { handleError(e, '加载提醒模板失败'); }
    finally { store.setLoading(false); }
  }

  async function fetchTemplate(id: string) {
    store.setLoading(true); store.setError(null);
    try {
      const t = await httpClient.get<ReminderTemplateClientDTO>(`${TEMPLATES_BASE}/${id}`);
      store.setCurrentTemplate(t);
      return t;
    } catch (e) { handleError(e, '加载提醒模板失败'); return null; }
    finally { store.setLoading(false); }
  }

  async function createTemplate(data: Record<string, unknown>) {
    savingId.value = 'new'; store.setError(null);
    try {
      const t = await httpClient.post<ReminderTemplateClientDTO>(TEMPLATES_BASE, data);
      store.addTemplate(t);
      return t;
    } catch (e) { handleError(e, '创建提醒失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateTemplate(id: string, data: Record<string, unknown>) {
    savingId.value = id; store.setError(null);
    try {
      const t = await httpClient.put<ReminderTemplateClientDTO>(`${TEMPLATES_BASE}/${id}`, data);
      store.updateTemplate(t);
      return t;
    } catch (e) { handleError(e, '更新提醒失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteTemplate(id: string) {
    savingId.value = id; store.setError(null);
    try { await httpClient.delete<void>(`${TEMPLATES_BASE}/${id}`); store.removeTemplate(id); return true; }
    catch (e) { handleError(e, '删除提醒失败'); return false; }
    finally { savingId.value = null; }
  }

  // ── Groups ──
  async function fetchGroups(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await httpClient.get<{ data: ReminderGroupClientDTO[]; total: number }>(GROUPS_BASE, { params: query });
      store.setGroups(res.data as ReminderGroupClientDTO[]);
    } catch (e) { handleError(e, '加载提醒分组失败'); }
    finally { store.setLoading(false); }
  }

  async function createGroup(data: Record<string, unknown>) {
    savingId.value = 'new-group'; store.setError(null);
    try {
      const g = await httpClient.post<ReminderGroupClientDTO>(GROUPS_BASE, data);
      store.addGroup(g);
      return g;
    } catch (e) { handleError(e, '创建分组失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateGroup(id: string, data: Record<string, unknown>) {
    savingId.value = id; store.setError(null);
    try {
      const g = await httpClient.put<ReminderGroupClientDTO>(`${GROUPS_BASE}/${id}`, data);
      store.updateGroup(g);
      return g;
    } catch (e) { handleError(e, '更新分组失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteGroup(id: string) {
    savingId.value = id; store.setError(null);
    try { await httpClient.delete<void>(`${GROUPS_BASE}/${id}`); store.removeGroup(id); return true; }
    catch (e) { handleError(e, '删除分组失败'); return false; }
    finally { savingId.value = null; }
  }

  function setPage(p: number) { store.setPage(p); fetchTemplates(); }

  return {
    templates, groups, currentTemplate, currentGroup,
    isLoading, isSaving, error, pagination,
    fetchTemplates, fetchTemplate, createTemplate, updateTemplate, deleteTemplate,
    fetchGroups, createGroup, updateGroup, deleteGroup,
    setPage,
  };
}
