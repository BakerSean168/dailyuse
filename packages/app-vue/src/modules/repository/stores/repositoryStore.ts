/**
 * Repository Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 */

import { defineStore } from 'pinia';
import type { RepositoryClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';

export interface RepositoryState {
  repositories: RepositoryClientDTO[];
  resources: ResourceClientDTO[];
  currentRepository: RepositoryClientDTO | null;
  currentResource: ResourceClientDTO | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  isInitialized: boolean;
}

export const useRepositoryStore = defineStore('repository', {
  state: (): RepositoryState => ({
    repositories: [],
    resources: [],
    currentRepository: null,
    currentResource: null,
    isLoading: false,
    error: null,
    pagination: { page: 1, pageSize: 20, total: 0 },
    isInitialized: false,
  }),

  actions: {
    setRepositories(items: RepositoryClientDTO[], total?: number) {
      this.repositories = items;
      if (total !== undefined) this.pagination.total = total;
    },
    addRepository(r: RepositoryClientDTO) { this.repositories.push(r); },
    updateRepository(r: RepositoryClientDTO) {
      const idx = this.repositories.findIndex((x) => x.id === r.id);
      if (idx >= 0) this.repositories[idx] = r;
    },
    removeRepository(id: string) {
      this.repositories = this.repositories.filter((r) => r.id !== id);
    },
    setCurrentRepository(r: RepositoryClientDTO | null) { this.currentRepository = r; },

    setResources(items: ResourceClientDTO[]) { this.resources = items; },
    addResource(r: ResourceClientDTO) { this.resources.push(r); },
    updateResource(r: ResourceClientDTO) {
      const idx = this.resources.findIndex((x) => x.id === r.id);
      if (idx >= 0) this.resources[idx] = r;
    },
    removeResource(id: string) {
      this.resources = this.resources.filter((r) => r.id !== id);
    },
    setCurrentResource(r: ResourceClientDTO | null) { this.currentResource = r; },

    setLoading(v: boolean) { this.isLoading = v; },
    setError(e: string | null) { this.error = e; },
    setPage(p: number) { this.pagination.page = p; },
    setInitialized(v: boolean) { this.isInitialized = v; },

    reset() { this.$reset(); },
  },

  persist: {
    pick: ['pagination'] as string[],
  },
});

export type RepositoryStoreType = ReturnType<typeof useRepositoryStore>;
