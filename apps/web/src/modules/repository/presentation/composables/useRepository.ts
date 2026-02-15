/**
 * useRepository - 仓储模块主 composable
 *
 * 使用注入的 RepositoryClientService（Result 风格）进行业务调用。
 * 对 service 尚未覆盖的端点，回退到 resultHttpClient。
 */

import { computed, inject, ref } from 'vue';
import { useRepositoryStore } from '../stores/repositoryStore';
import { REPOSITORY_SERVICE_KEY } from '@/shared/di';
import { resultHttpClient } from '@/shared/http';
import type { RepositoryClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { CreateRepositoryRequest } from '@dailyuse/repository';
import type { Repository } from '@dailyuse/repository/domain-client';

const BASE = '/repositories';

export function useRepository() {
  const service = inject(REPOSITORY_SERVICE_KEY)!;
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

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  // ── Repositories ──
  async function fetchRepositories(_query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const result = await service.getRepositories();
      if (result.ok) {
        store.setRepositories(result.data.map((r: Repository) => r.toDTO()));
      } else {
        handleError(result.error.message || '加载仓库列表失败');
      }
    } finally { store.setLoading(false); }
  }

  async function fetchRepository(id: string) {
    store.setLoading(true); store.setError(null);
    try {
      const result = await service.getRepositoryById(id);
      if (result.ok) {
        const dto = result.data.toDTO();
        store.setCurrentRepository(dto);
        return dto;
      } else {
        handleError(result.error.message || '加载仓库失败');
        return null;
      }
    } finally { store.setLoading(false); }
  }

  async function createRepository(data: Record<string, unknown>) {
    savingId.value = 'new'; store.setError(null);
    try {
      const result = await service.createRepository(data as unknown as CreateRepositoryRequest);
      if (result.ok) {
        const dto = result.data.toDTO();
        store.addRepository(dto);
        return dto;
      } else {
        handleError(result.error.message || '创建仓库失败');
        return null;
      }
    } finally { savingId.value = null; }
  }

  // Service 尚未提供 updateRepository，回退到 resultHttpClient
  async function updateRepository(id: string, data: Record<string, unknown>) {
    savingId.value = id; store.setError(null);
    try {
      const result = await resultHttpClient.put<RepositoryClientDTO>(`${BASE}/${id}`, data);
      if (result.ok) {
        store.updateRepository(result.data);
        return result.data;
      } else {
        handleError(result.error.message || '更新仓库失败');
        return null;
      }
    } finally { savingId.value = null; }
  }

  async function deleteRepository(id: string) {
    savingId.value = id; store.setError(null);
    try {
      const result = await service.deleteRepository(id);
      if (result.ok) {
        store.removeRepository(id);
        return true;
      } else {
        handleError(result.error.message || '删除仓库失败');
        return false;
      }
    } finally { savingId.value = null; }
  }

  // ── Resources ──
  // Service 尚未提供 fetchResources，回退到 resultHttpClient
  async function fetchResources(repoId: string, query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const result = await resultHttpClient.get<{ data: ResourceClientDTO[]; total: number }>(`${BASE}/${repoId}/resources`, { params: query });
      if (result.ok) {
        store.setResources(result.data.data as ResourceClientDTO[]);
      } else {
        handleError(result.error.message || '加载资源列表失败');
      }
    } finally { store.setLoading(false); }
  }

  // Service 尚未提供 createResource，回退到 resultHttpClient
  async function createResource(repoId: string, data: Record<string, unknown>) {
    savingId.value = 'new-resource'; store.setError(null);
    try {
      const result = await resultHttpClient.post<ResourceClientDTO>(`${BASE}/${repoId}/resources`, data);
      if (result.ok) {
        store.addResource(result.data);
        return result.data;
      } else {
        handleError(result.error.message || '创建资源失败');
        return null;
      }
    } finally { savingId.value = null; }
  }

  async function deleteResource(repoId: string, resourceId: string) {
    savingId.value = resourceId; store.setError(null);
    try {
      const result = await service.deleteResource(resourceId);
      if (result.ok) {
        store.removeResource(resourceId);
        return true;
      } else {
        handleError(result.error.message || '删除资源失败');
        return false;
      }
    } finally { savingId.value = null; }
  }

  function setPage(p: number) { store.setPage(p); fetchRepositories(); }

  return {
    repositories, resources, currentRepository, currentResource,
    isLoading, isSaving, error, pagination,
    fetchRepositories, fetchRepository, createRepository, updateRepository, deleteRepository,
    fetchResources, createResource, deleteResource, setPage,
  };
}
