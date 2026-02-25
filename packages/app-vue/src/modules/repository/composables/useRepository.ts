/**
 * useRepository - 仓储模块主 composable
 *
 * 使用注入的 RepositoryClientService（Result 风格）进行业务调用。
 * 对 service 尚未覆盖的端点，标注 TODO 待迁移。
 */

import { computed, ref } from 'vue';
import { useRepositoryStore } from '../stores/repositoryStore';
import { REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { RepositoryClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { CreateRepositoryRequest } from '@dailyuse/repository/infrastructure-client';
import type { Repository } from '@dailyuse/repository/domain-client';

export function useRepository() {
  const service = useStrictInject(REPOSITORY_SERVICE_KEY, 'RepositoryService');
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
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getRepositories();
      if (result.ok) {
        store.setRepositories(result.data.map((r: Repository) => r.toDTO()));
      } else {
        handleError(result.error.message || '加载仓库列表失败');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchRepository(id: string) {
    store.setLoading(true);
    store.setError(null);
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
    } finally {
      store.setLoading(false);
    }
  }

  async function createRepository(data: Record<string, unknown>) {
    savingId.value = 'new';
    store.setError(null);
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
    } finally {
      savingId.value = null;
    }
  }

  // TODO: Migrate to service call when RepositoryClientService supports updateRepository
  async function updateRepository(
    _id: string,
    _data: Record<string, unknown>,
  ): Promise<RepositoryClientDTO | null> {
    store.setError('updateRepository not yet migrated to service layer');
    console.warn(
      '[useRepository] updateRepository: TODO — migrate from resultHttpClient to service',
    );
    return null;
  }

  async function deleteRepository(id: string) {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.deleteRepository(id);
      if (result.ok) {
        store.removeRepository(id);
        return true;
      } else {
        handleError(result.error.message || '删除仓库失败');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  // ── Resources ──
  // TODO: Migrate to service call when RepositoryClientService supports fetchResources
  async function fetchResources(_repoId: string, _query?: Record<string, unknown>): Promise<void> {
    store.setError('fetchResources not yet migrated to service layer');
    console.warn('[useRepository] fetchResources: TODO — migrate from resultHttpClient to service');
  }

  // TODO: Migrate to service call when RepositoryClientService supports createResource
  async function createResource(
    _repoId: string,
    _data: Record<string, unknown>,
  ): Promise<ResourceClientDTO | null> {
    store.setError('createResource not yet migrated to service layer');
    console.warn('[useRepository] createResource: TODO — migrate from resultHttpClient to service');
    return null;
  }

  async function deleteResource(repoId: string, resourceId: string) {
    savingId.value = resourceId;
    store.setError(null);
    try {
      const result = await service.deleteResource(resourceId);
      if (result.ok) {
        store.removeResource(resourceId);
        return true;
      } else {
        handleError(result.error.message || '删除资源失败');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  function setPage(p: number) {
    store.setPage(p);
    fetchRepositories();
  }

  return {
    repositories,
    resources,
    currentRepository,
    currentResource,
    isLoading,
    isSaving,
    error,
    pagination,
    fetchRepositories,
    fetchRepository,
    createRepository,
    updateRepository,
    deleteRepository,
    fetchResources,
    createResource,
    deleteResource,
    setPage,
  };
}
