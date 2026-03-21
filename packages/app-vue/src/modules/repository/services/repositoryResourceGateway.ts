import { computed } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { useRepository } from '../composables/useRepository';
import type { ResourceInsertionRecentEntry } from '../../editor/composables/useResourceInsertion';

interface RecentInsertionState {
  entries: ResourceInsertionRecentEntry[];
}

let recentInsertionState: RecentInsertionState | null = null;

function getRecentInsertionState(): RecentInsertionState {
  if (!recentInsertionState) {
    recentInsertionState = {
      entries: [],
    };
  }

  return recentInsertionState;
}

export function useRepositoryResourceGateway() {
  const repository = useRepository();
  const recentState = getRecentInsertionState();

  async function ensureReady() {
    console.info('[RepositoryResourceGateway] ensureReady:start', {
      repositoryId: repository.repositoryId.value,
      resourceCount: repository.resources.value.length,
    });

    await repository.initRepository();

    if (repository.repositoryId.value && repository.resources.value.length === 0) {
      console.info('[RepositoryResourceGateway] ensureReady:refresh-resources', {
        repositoryId: repository.repositoryId.value,
      });
      await repository.fetchResources();
    }

    console.info('[RepositoryResourceGateway] ensureReady:done', {
      repositoryId: repository.repositoryId.value,
      resourceCount: repository.resources.value.length,
    });
  }

  function getCachedResource(resourceId: string): ResourceClientDTO | null {
    const cached = repository.resources.value.find((item) => item.id === resourceId) ?? null;
    console.info('[RepositoryResourceGateway] getCachedResource', {
      resourceId,
      hit: Boolean(cached),
      repositoryId: repository.repositoryId.value,
    });
    return cached;
  }

  async function getResource(resourceId: string): Promise<ResourceClientDTO | null> {
    console.info('[RepositoryResourceGateway] getResource:start', {
      resourceId,
      repositoryId: repository.repositoryId.value,
    });
    const resource = await repository.getResourceById(resourceId);
    console.info('[RepositoryResourceGateway] getResource:done', {
      resourceId,
      hit: Boolean(resource),
      repositoryId: repository.repositoryId.value,
    });
    return resource;
  }

  async function refreshResources() {
    await repository.fetchResources();
  }

  function persistRecentEntry(entry: ResourceInsertionRecentEntry) {
    const deduped = recentState.entries.filter((item) => item.resourceId !== entry.resourceId);
    recentState.entries = [entry, ...deduped].slice(0, 20);
  }

  return {
    repositoryId: repository.repositoryId,
    resources: computed(() => repository.resources.value),
    isSaving: repository.isSaving,
    error: repository.error,
    ensureReady,
    getCachedResource,
    getResource,
    refreshResources,
    uploadResources: repository.uploadResources,
    readResourceAsDataUrl: repository.readResourceAsDataUrl,
    createMarkdownNote: repository.createMarkdownNote,
    searchResources: repository.searchResources,
    recentEntries: computed(() => recentState.entries),
    persistRecentEntry,
  };
}
