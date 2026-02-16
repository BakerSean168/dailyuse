/**
 * useRepository Hook
 *
 * 仓库管理 Hook
 * Story-011: Repository Module UI
 */

import { useState, useCallback, useEffect } from 'react';
import { repositoryApplicationService } from '@dailyuse/repository/application-client';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
} from '@dailyuse/contracts/repository';

interface RepositoryState {
  repositories: RepositoryClientDTO[];
  currentRepository: RepositoryClientDTO | null;
  currentFolder: FolderClientDTO | null;
  folders: FolderClientDTO[];
  resources: ResourceClientDTO[];
  loading: boolean;
  error: string | null;
}

interface UseRepositoryReturn extends RepositoryState {
  // Repository operations
  loadRepositories: () => Promise<void>;
  selectRepository: (id: string) => Promise<void>;
  createRepository: (
    name: string,
    type: string,
    description?: string,
  ) => Promise<RepositoryClientDTO | null>;
  deleteRepository: (id: string) => Promise<void>;

  // Folder operations
  selectFolder: (id: string) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<FolderClientDTO | null>;
  renameFolder: (id: string, name: string) => Promise<void>;
  moveFolder: (id: string, targetParentId: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Resource operations
  getResource: (id: string) => Promise<ResourceClientDTO | null>;
  renameResource: (id: string, name: string) => Promise<void>;
  moveResource: (id: string, targetFolderId: string) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;

  // Search
  search: (query: string) => Promise<ResourceClientDTO[]>;

  // Navigation
  goToRoot: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRepository(): UseRepositoryReturn {
  const [state, setState] = useState<RepositoryState>({
    repositories: [],
    currentRepository: null,
    currentFolder: null,
    folders: [],
    resources: [],
    loading: false,
    error: null,
  });

  // Load all repositories
  const loadRepositories = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const repositories = await repositoryApplicationService.listRepositories();
      setState((prev) => ({
        ...prev,
        repositories,
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Select a repository
  const selectRepository = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const repository = await repositoryApplicationService.getRepository(id);
      const fileTree = await repositoryApplicationService.getFileTree(id);

      // Extract folders and resources from tree
      const extractedFolders: FolderClientDTO[] = [];
      const extractedResources: ResourceClientDTO[] = [];

      // Traverse tree to extract items (simplified - root level only)
      if (fileTree.tree) {
        for (const node of fileTree.tree) {
          if (node.type === 'folder') {
            extractedFolders.push({
              id: node.id,
              repositoryId: node.repositoryId,
              parentId: node.parentId || undefined,
              name: node.name,
              path: node.path,
            } as FolderClientDTO);
          }
        }
      }

      setState((prev) => ({
        ...prev,
        currentRepository: repository,
        currentFolder: null,
        folders: extractedFolders,
        resources: extractedResources,
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Create repository
  const createRepository = useCallback(async (name: string, type: string, description?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const repository = await repositoryApplicationService.createRepository({
        name,
        type,
        description,
      });
      setState((prev) => ({
        ...prev,
        repositories: [...prev.repositories, repository],
        loading: false,
      }));
      return repository;
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
      return null;
    }
  }, []);

  // Delete repository
  const deleteRepository = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.deleteRepository(id);
      setState((prev) => ({
        ...prev,
        repositories: prev.repositories.filter((r) => r.id !== id),
        currentRepository: prev.currentRepository?.id === id ? null : prev.currentRepository,
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Select folder
  const selectFolder = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const contents = await repositoryApplicationService.getFolderContents(id);
        // Find the folder from the current folders
        const folder = state.folders.find((f) => f.id === id) || null;

        setState((prev) => ({
          ...prev,
          currentFolder: folder,
          folders: contents.folders,
          resources: contents.resources,
          loading: false,
        }));
      } catch (e) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (e as Error).message,
        }));
      }
    },
    [state.folders],
  );

  // Create folder
  const createFolder = useCallback(
    async (name: string, parentId?: string) => {
      if (!state.currentRepository) return null;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const folder = await repositoryApplicationService.createFolder({
          repositoryId: state.currentRepository.id,
          parentId,
          name,
        });

        setState((prev) => ({
          ...prev,
          folders: [...prev.folders, folder],
          loading: false,
        }));
        return folder;
      } catch (e) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (e as Error).message,
        }));
        return null;
      }
    },
    [state.currentRepository],
  );

  // Rename folder
  const renameFolder = useCallback(async (id: string, name: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const updated = await repositoryApplicationService.renameFolder(id, name);
      setState((prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.id === id ? updated : f)),
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Move folder
  const moveFolder = useCallback(
    async (id: string, targetParentId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await repositoryApplicationService.moveFolder(id, targetParentId);
        // Refresh the current folder
        if (state.currentFolder) {
          await selectFolder(state.currentFolder.id);
        } else if (state.currentRepository) {
          await selectRepository(state.currentRepository.id);
        }
      } catch (e) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (e as Error).message,
        }));
      }
    },
    [state.currentFolder, state.currentRepository, selectFolder, selectRepository],
  );

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.deleteFolder(id);
      setState((prev) => ({
        ...prev,
        folders: prev.folders.filter((f) => f.id !== id),
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Get resource
  const getResource = useCallback(async (id: string) => {
    try {
      return await repositoryApplicationService.getResource(id);
    } catch (e) {
      setState((prev) => ({
        ...prev,
        error: (e as Error).message,
      }));
      return null;
    }
  }, []);

  // Rename resource
  const renameResource = useCallback(async (id: string, name: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const updated = await repositoryApplicationService.renameResource(id, name);
      setState((prev) => ({
        ...prev,
        resources: prev.resources.map((r) => (r.id === id ? updated : r)),
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Move resource
  const moveResource = useCallback(async (id: string, targetFolderId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.moveResource(id, targetFolderId);
      // Remove from current list
      setState((prev) => ({
        ...prev,
        resources: prev.resources.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Delete resource
  const deleteResource = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.deleteResource(id);
      setState((prev) => ({
        ...prev,
        resources: prev.resources.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  // Search
  const search = useCallback(
    async (query: string) => {
      if (!state.currentRepository) return [];

      try {
        const result = await repositoryApplicationService.search({
          repositoryId: state.currentRepository.id,
          query,
          mode: 'all',
        });
        // Convert SearchResultItems to ResourceClientDTOs
        return result.results.map(
          (item: {
            resourceId: string;
            resourceName: string;
            resourcePath: string;
            resourceType: string;
          }) =>
            ({
              id: item.resourceId,
              name: item.resourceName,
              path: item.resourcePath,
              type: item.resourceType,
            }) as unknown as ResourceClientDTO,
        );
      } catch (e) {
        setState((prev) => ({
          ...prev,
          error: (e as Error).message,
        }));
        return [];
      }
    },
    [state.currentRepository],
  );

  // Go to root
  const goToRoot = useCallback(async () => {
    if (state.currentRepository) {
      await selectRepository(state.currentRepository.id);
    }
  }, [state.currentRepository, selectRepository]);

  // Refresh
  const refresh = useCallback(async () => {
    if (state.currentFolder) {
      await selectFolder(state.currentFolder.id);
    } else if (state.currentRepository) {
      await selectRepository(state.currentRepository.id);
    } else {
      await loadRepositories();
    }
  }, [
    state.currentFolder,
    state.currentRepository,
    selectFolder,
    selectRepository,
    loadRepositories,
  ]);

  // Initial load
  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  return {
    ...state,
    loadRepositories,
    selectRepository,
    createRepository,
    deleteRepository,
    selectFolder,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    getResource,
    renameResource,
    moveResource,
    deleteResource,
    search,
    goToRoot,
    refresh,
  };
}

export type { RepositoryState, UseRepositoryReturn };
export default useRepository;
