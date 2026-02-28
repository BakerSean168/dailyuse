/**
 * useRepository - 仓储模块主 composable
 *
 * 单仓库模型 — 自动初始化用户的唯一仓库，聚焦于资源操作。
 */

import { computed, ref } from 'vue';
import { useRepositoryStore } from '../stores/repositoryStore';
import { REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { Repository } from '@dailyuse/repository/domain-client';

export function useRepository() {
  const service = useStrictInject(REPOSITORY_SERVICE_KEY, 'RepositoryService');
  const store = useRepositoryStore();
  const savingId = ref<string | null>(null);

  const repositoryId = computed(() => store.repositoryId);
  const resources = computed(() => store.resources);
  const resourcesByType = computed(() => store.resourcesByType);
  const currentResource = computed(() => store.currentResource);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  // ── Repository init (single-repo) ──
  /**
   * Initialize the user's single repository.
   * Fetches the list and picks the first one (or creates one if none exist).
   */
  async function initRepository() {
    if (store.isInitialized && store.repositoryId) return;

    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getRepositories();
      if (result.ok) {
        const repos = (result.data ?? []).map((r: Repository) => r.toDTO());
        if (repos.length > 0) {
          store.setRepositoryId(repos[0].id);
        }
        // If no repos exist, repositoryId stays null — workspace shows empty state
      } else {
        handleError(result.error.message || '加载仓库失败');
      }
    } finally {
      store.setLoading(false);
      store.setInitialized(true);
    }
  }

  // ── Resources ──
  async function fetchResources(): Promise<void> {
    if (!store.repositoryId) return;
    store.setLoading(true);
    store.setError(null);
    try {
      // TODO: Migrate to service call when RepositoryClientService supports fetchResources
      console.warn('[useRepository] fetchResources: TODO — migrate to service');
      store.setResources([]);
    } finally {
      store.setLoading(false);
    }
  }

  async function createResource(data: Record<string, unknown>): Promise<ResourceClientDTO | null> {
    if (!store.repositoryId) return null;
    savingId.value = 'new';
    store.setError(null);
    try {
      // TODO: Migrate to service call when RepositoryClientService supports createResource
      console.warn('[useRepository] createResource: TODO — migrate to service');
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteResource(resourceId: string) {
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

  async function saveResourceContent(resourceId: string, content: string) {
    savingId.value = resourceId;
    store.setError(null);
    try {
      // TODO: Migrate to service call
      console.warn('[useRepository] saveResourceContent: TODO — migrate to service');
      return false;
    } finally {
      savingId.value = null;
    }
  }

  // ── Tabs convenience ──
  function openResource(resource: ResourceClientDTO) {
    store.setCurrentResource(resource);
    store.openTab(resource.id);
  }

  return {
    repositoryId,
    resources,
    resourcesByType,
    currentResource,
    isLoading,
    isSaving,
    error,
    initRepository,
    fetchResources,
    createResource,
    deleteResource,
    saveResourceContent,
    openResource,
  };
}
