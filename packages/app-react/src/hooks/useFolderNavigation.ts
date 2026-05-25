import { useCallback, useEffect, useState } from 'react';

import type { FolderClientDTO, ResourceClientDTO, TreeNode } from '@dailyuse/contracts/repository';

import { useAppSession } from './useAppSession';
import { useRepositoryService } from './useRepositoryService';

export interface FolderBreadcrumb {
  id: string | null;
  name: string;
}

/**
 * A unified item type for rendering folder contents.
 * This avoids type conversion issues with branded IDs.
 */
export interface FolderNavigationItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  parentId: string | null;
  hasChildren?: boolean;
  size?: number;
  extension?: string;
  updatedAt?: number;
}

export function useFolderNavigation(repositoryId?: string) {
  const service = useRepositoryService();
  const { isRemoteAuthenticated } = useAppSession();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderClientDTO[]>([]);
  const [resources, setResources] = useState<ResourceClientDTO[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([{ id: null, name: 'Root' }]);
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFolderContents = useCallback(
    async (folderId: string | null, repoId?: string) => {
      const effectiveRepoId = repoId ?? repositoryId;
      if (!isRemoteAuthenticated || !effectiveRepoId) {
        setFolders([]);
        setResources([]);
        setFileTree([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      if (folderId === null) {
        // Load root level: get file tree for folders, resources list for files
        const [treeResult, resourcesResult] = await Promise.all([
          service.getFileTree(effectiveRepoId),
          service.listResources(effectiveRepoId),
        ]);

        if (!treeResult.ok) {
          setError(treeResult.error.message);
          setIsLoading(false);
          return;
        }

        setFileTree(treeResult.data.tree);

        // Extract top-level folders from tree (folders have simpler structure)
        const topFolders: FolderClientDTO[] = treeResult.data.tree
          .filter((node: TreeNode): node is TreeNode & { type: 'folder' } => node.type === 'folder')
          .map((node: TreeNode & { type: 'folder' }) => ({
            id: node.id as FolderClientDTO['id'],
            repositoryId: node.repositoryId as FolderClientDTO['repositoryId'],
            parentId: node.parentId as FolderClientDTO['parentId'],
            name: node.name,
            path: node.path,
            order: 0,
            isExpanded: node.isExpanded ?? false,
            metadata: {},
            createdAt: node.updatedAt ? node.updatedAt.getTime() : Date.now(),
            updatedAt: node.updatedAt ? node.updatedAt.getTime() : Date.now(),
            children: null,
            depth: 0,
            isRoot: node.parentId === null,
            hasChildren: (node.children?.length ?? 0) > 0,
            pathParts: node.path.split('/').filter(Boolean),
            displayName: node.name,
            createdAtText: '',
            updatedAtText: '',
          }));

        setFolders(topFolders);

        // Use actual resource list for root-level files (folderId is null)
        if (resourcesResult.ok) {
          const rootResources = resourcesResult.data.filter(
            (resource: ResourceClientDTO) => resource.folderId === null,
          );
          setResources(rootResources);
        } else {
          setResources([]);
        }

        setIsLoading(false);
        return;
      }

      // Load specific folder contents via API
      const result = await service.getFolderContents(folderId);
      if (!result.ok) {
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      setFolders(result.data.folders);
      setResources(result.data.resources);
      setIsLoading(false);
    },
    [isRemoteAuthenticated, repositoryId, service],
  );

  const navigateToFolder = useCallback(
    async (folderId: string | null, folderName?: string) => {
      setCurrentFolderId(folderId);

      if (folderId === null) {
        setBreadcrumbs([{ id: null, name: 'Root' }]);
      } else {
        const existingIndex = breadcrumbs.findIndex(
          (breadcrumb: FolderBreadcrumb) => breadcrumb.id === folderId,
        );
        if (existingIndex >= 0) {
          setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
        } else {
          setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName ?? 'Folder' }]);
        }
      }

      await loadFolderContents(folderId);
    },
    [breadcrumbs, loadFolderContents],
  );

  const navigateUp = useCallback(async () => {
    if (breadcrumbs.length <= 1) {
      return;
    }
    const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
    await navigateToFolder(parentBreadcrumb.id, parentBreadcrumb.name);
  }, [breadcrumbs, navigateToFolder]);

  const refresh = useCallback(async () => {
    await loadFolderContents(currentFolderId);
  }, [currentFolderId, loadFolderContents]);

  // Create folder
  const createFolder = useCallback(
    async (name: string): Promise<boolean> => {
      if (!repositoryId) {
        return false;
      }

      setIsMutating(true);
      setError(null);

      const result = await service.createFolder({
        repositoryId,
        name,
        parentId: currentFolderId ?? undefined,
      });

      setIsMutating(false);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      await refresh();
      return true;
    },
    [repositoryId, currentFolderId, service, refresh],
  );

  // Rename folder
  const renameFolder = useCallback(
    async (folderId: string, newName: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      const result = await service.renameFolder(folderId, newName);
      setIsMutating(false);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      await refresh();
      return true;
    },
    [service, refresh],
  );

  // Move folder
  const moveFolder = useCallback(
    async (folderId: string, targetParentId: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      const result = await service.moveFolder(folderId, targetParentId);
      setIsMutating(false);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      await refresh();
      return true;
    },
    [service, refresh],
  );

  // Delete folder
  const deleteFolder = useCallback(
    async (folderId: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      const result = await service.deleteFolder(folderId);
      setIsMutating(false);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      await refresh();
      return true;
    },
    [service, refresh],
  );

  // Rename resource
  const renameResource = useCallback(
    async (resourceId: string, newName: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      const result = await service.renameResource(resourceId, newName);
      setIsMutating(false);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      await refresh();
      return true;
    },
    [service, refresh],
  );

  // Move resource
  const moveResource = useCallback(
    async (resourceId: string, targetFolderId: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      const result = await service.moveResource(resourceId, targetFolderId);
      setIsMutating(false);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      await refresh();
      return true;
    },
    [service, refresh],
  );

  // Delete resource
  const deleteResource = useCallback(
    async (resourceId: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      const result = await service.deleteResource(resourceId);
      setIsMutating(false);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      await refresh();
      return true;
    },
    [service, refresh],
  );

  // Initial load
  useEffect(() => {
    if (isRemoteAuthenticated && repositoryId) {
      void loadFolderContents(currentFolderId, repositoryId);
    }
  }, [isRemoteAuthenticated, repositoryId]);

  const isAtRoot = currentFolderId === null;

  // Convert to unified items for simpler UI rendering
  const items: FolderNavigationItem[] = [
    ...folders.map((folder: FolderClientDTO) => ({
      id: folder.id,
      name: folder.name,
      type: 'folder' as const,
      path: folder.path,
      parentId: folder.parentId,
      hasChildren: folder.hasChildren,
      updatedAt: folder.updatedAt,
    })),
    ...resources.map((resource: ResourceClientDTO) => ({
      id: String(resource.id),
      name: resource.name,
      type: 'file' as const,
      path: resource.path,
      parentId: resource.folderId ? String(resource.folderId) : null,
      size: resource.size,
      extension: resource.extension,
      updatedAt: resource.updatedAt,
    })),
  ];

  return {
    // State
    repositoryId,
    currentFolderId,
    folders,
    resources,
    items,
    breadcrumbs,
    fileTree,
    isLoading,
    isMutating,
    error,
    isRemoteAuthenticated,
    isAtRoot,

    // Navigation
    navigateToFolder,
    navigateUp,
    refresh,

    // Folder operations
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,

    // Resource operations
    renameResource,
    moveResource,
    deleteResource,
  };
}
