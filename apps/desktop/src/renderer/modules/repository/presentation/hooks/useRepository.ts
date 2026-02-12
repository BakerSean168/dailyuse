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
  selectRepository: (uuid: string) => Promise<void>;
  createRepository: (
    name: string,
    type: string,
    description?: string,
  ) => Promise<RepositoryClientDTO | null>;
  deleteRepository: (uuid: string) => Promise<void>;

  // Folder operations
  selectFolder: (uuid: string) => Promise<void>;
  createFolder: (name: string, parentUuid?: string) => Promise<FolderClientDTO | null>;
  renameFolder: (uuid: string, name: string) => Promise<void>;
  moveFolder: (uuid: string, targetParentUuid: string) => Promise<void>;
  deleteFolder: (uuid: string) => Promise<void>;

  // Resource operations
  getResource: (uuid: string) => Promise<ResourceClientDTO | null>;
  renameResource: (uuid: string, name: string) => Promise<void>;
  moveResource: (uuid: string, targetFolderUuid: string) => Promise<void>;
  deleteResource: (uuid: string) => Promise<void>;

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
  const selectRepository = useCallback(async (uuid: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const repository = await repositoryApplicationService.getRepository(uuid);
      const fileTree = await repositoryApplicationService.getFileTree(uuid);

      // Extract folders and resources from tree
      const extractedFolders: FolderClientDTO[] = [];
      const extractedResources: ResourceClientDTO[] = [];

      // Traverse tree to extract items (simplified - root level only)
      if (fileTree.tree) {
        for (const node of fileTree.tree) {
          if (node.type === 'folder') {
            extractedFolders.push({
              uuid: node.uuid,
              repositoryUuid: node.repositoryUuid,
              parentUuid: node.parentUuid || undefined,
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
  const deleteRepository = useCallback(async (uuid: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.deleteRepository(uuid);
      setState((prev) => ({
        ...prev,
        repositories: prev.repositories.filter((r) => r.uuid !== uuid),
        currentRepository: prev.currentRepository?.uuid === uuid ? null : prev.currentRepository,
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
    async (uuid: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const contents = await repositoryApplicationService.getFolderContents(uuid);
        // Find the folder from the current folders
        const folder = state.folders.find((f) => f.uuid === uuid) || null;

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
    async (name: string, parentUuid?: string) => {
      if (!state.currentRepository) return null;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const folder = await repositoryApplicationService.createFolder({
          repositoryUuid: state.currentRepository.uuid,
          parentUuid,
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
  const renameFolder = useCallback(async (uuid: string, name: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const updated = await repositoryApplicationService.renameFolder(uuid, name);
      setState((prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.uuid === uuid ? updated : f)),
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
    async (uuid: string, targetParentUuid: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await repositoryApplicationService.moveFolder(uuid, targetParentUuid);
        // Refresh the current folder
        if (state.currentFolder) {
          await selectFolder(state.currentFolder.uuid);
        } else if (state.currentRepository) {
          await selectRepository(state.currentRepository.uuid);
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
  const deleteFolder = useCallback(async (uuid: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.deleteFolder(uuid);
      setState((prev) => ({
        ...prev,
        folders: prev.folders.filter((f) => f.uuid !== uuid),
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
  const getResource = useCallback(async (uuid: string) => {
    try {
      return await repositoryApplicationService.getResource(uuid);
    } catch (e) {
      setState((prev) => ({
        ...prev,
        error: (e as Error).message,
      }));
      return null;
    }
  }, []);

  // Rename resource
  const renameResource = useCallback(async (uuid: string, name: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const updated = await repositoryApplicationService.renameResource(uuid, name);
      setState((prev) => ({
        ...prev,
        resources: prev.resources.map((r) => (r.uuid === uuid ? updated : r)),
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
  const moveResource = useCallback(async (uuid: string, targetFolderUuid: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.moveResource(uuid, targetFolderUuid);
      // Remove from current list
      setState((prev) => ({
        ...prev,
        resources: prev.resources.filter((r) => r.uuid !== uuid),
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
  const deleteResource = useCallback(async (uuid: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await repositoryApplicationService.deleteResource(uuid);
      setState((prev) => ({
        ...prev,
        resources: prev.resources.filter((r) => r.uuid !== uuid),
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
          repositoryUuid: state.currentRepository.uuid,
          query,
          mode: 'all',
        });
        // Convert SearchResultItems to ResourceClientDTOs
        return result.results.map(
          (item: {
            resourceUuid: string;
            resourceName: string;
            resourcePath: string;
            resourceType: string;
          }) =>
            ({
              uuid: item.resourceUuid,
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
      await selectRepository(state.currentRepository.uuid);
    }
  }, [state.currentRepository, selectRepository]);

  // Refresh
  const refresh = useCallback(async () => {
    if (state.currentFolder) {
      await selectFolder(state.currentFolder.uuid);
    } else if (state.currentRepository) {
      await selectRepository(state.currentRepository.uuid);
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
