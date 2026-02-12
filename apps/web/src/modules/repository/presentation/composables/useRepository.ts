/**
 * useRepository - 仓储模块主 composable
 */

import { computed, ref } from 'vue';
import { useRepositoryStore } from '../stores/repositoryStore';
import { repositoryApi, RepositoryApiError } from '../services/repositoryApi';
import type { RepositoryClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';

export function useRepository() {
  const store = useRepositoryStore();
  const savingId = ref<string | null>(null);

  const repositories = computed(() => store.repositories);
  const resources = computed(() => store.resources);
  const currentRepository = computed(() => store.currentRepository);
  const currentResource = computed(() => store.currentResource);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof RepositoryApiError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  // ── Repositories ──
  async function fetchRepositories(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await repositoryApi.listRepositories({
        ...query, page: store.pagination.page, pageSize: store.pagination.pageSize,
      });
      store.setRepositories(res.data as RepositoryClientDTO[], res.total);
    } catch (e) { handleError(e, '加载仓库列表失败'); }
    finally { store.setLoading(false); }
  }

  async function fetchRepository(id: string) {
    store.setLoading(true); store.setError(null);
    try {
      const r = await repositoryApi.getRepository(id) as RepositoryClientDTO;
      store.setCurrentRepository(r);
      return r;
    } catch (e) { handleError(e, '加载仓库失败'); return null; }
    finally { store.setLoading(false); }
  }

  async function createRepository(data: Record<string, unknown>) {
    savingId.value = 'new'; store.setError(null);
    try {
      const r = await repositoryApi.createRepository(data) as RepositoryClientDTO;
      store.addRepository(r);
      return r;
    } catch (e) { handleError(e, '创建仓库失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateRepository(id: string, data: Record<string, unknown>) {
    savingId.value = id; store.setError(null);
    try {
      const r = await repositoryApi.updateRepository(id, data) as RepositoryClientDTO;
      store.updateRepository(r);
      return r;
    } catch (e) { handleError(e, '更新仓库失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteRepository(id: string) {
    savingId.value = id; store.setError(null);
    try { await repositoryApi.deleteRepository(id); store.removeRepository(id); return true; }
    catch (e) { handleError(e, '删除仓库失败'); return false; }
    finally { savingId.value = null; }
  }

  // ── Resources ──
  async function fetchResources(repoId: string, query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await repositoryApi.listResources(repoId, query);
      store.setResources(res.data as ResourceClientDTO[]);
    } catch (e) { handleError(e, '加载资源列表失败'); }
    finally { store.setLoading(false); }
  }

  async function createResource(repoId: string, data: Record<string, unknown>) {
    savingId.value = 'new-resource'; store.setError(null);
    try {
      const r = await repositoryApi.createResource(repoId, data) as ResourceClientDTO;
      store.addResource(r);
      return r;
    } catch (e) { handleError(e, '创建资源失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteResource(repoId: string, resourceId: string) {
    savingId.value = resourceId; store.setError(null);
    try { await repositoryApi.deleteResource(repoId, resourceId); store.removeResource(resourceId); return true; }
    catch (e) { handleError(e, '删除资源失败'); return false; }
    finally { savingId.value = null; }
  }

  function setPage(p: number) { store.setPage(p); fetchRepositories(); }

  return {
    repositories, resources, currentRepository, currentResource,
    isLoading, isSaving, error, pagination,
    fetchRepositories, fetchRepository, createRepository, updateRepository, deleteRepository,
    fetchResources, createResource, deleteResource, setPage,
  };
}
