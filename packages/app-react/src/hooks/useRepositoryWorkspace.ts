import { useEffect, useMemo, useState } from 'react';

import type {
  RepositoryClientDTO,
  ResourceBookmarkClientDTO,
  ResourceClientDTO,
  SearchRequest,
  SearchResultItem,
  UploadResourceFileDTO,
  UploadResourcesRequestDTO,
  UploadResourcesResponseDTO,
} from '@dailyuse/contracts/repository';

import { useAppSession } from './useAppSession';
import { useRepositoryService } from './useRepositoryService';
import { getResourceDisplayName } from '../utils/entity-presentation';

export function useRepositoryWorkspace() {
  const service = useRepositoryService();
  const { isRemoteAuthenticated } = useAppSession();
  const [repository, setRepository] = useState<RepositoryClientDTO | null>(null);
  const [resources, setResources] = useState<ResourceClientDTO[]>([]);
  const [bookmarks, setBookmarks] = useState<ResourceBookmarkClientDTO[]>([]);
  const [activeResource, setActiveResource] = useState<ResourceClientDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteSearchResults, setRemoteSearchResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(isRemoteAuthenticated);
  const [isMutating, setIsMutating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadWorkspace(preferredResourceId?: string | null) {
    if (!isRemoteAuthenticated) {
      setRepository(null);
      setResources([]);
      setBookmarks([]);
      setActiveResource(null);
      setRemoteSearchResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const repositoryResult = await service.getCurrentRepository();
    if (!repositoryResult.ok) {
      setRepository(null);
      setResources([]);
      setBookmarks([]);
      setActiveResource(null);
      setError(repositoryResult.error.message);
      setIsLoading(false);
      return;
    }

    const repositoryValue = repositoryResult.data;
    if (!repositoryValue) {
      setRepository(null);
      setResources([]);
      setBookmarks([]);
      setActiveResource(null);
      setRemoteSearchResults([]);
      setIsLoading(false);
      return;
    }

    const repositoryDto = repositoryValue.toDTO();
    setRepository(repositoryDto);

    const [resourceResult, bookmarkResult] = await Promise.all([
      service.listResources(String(repositoryDto.id)),
      service.listBookmarks(String(repositoryDto.id)),
    ]);

    if (!resourceResult.ok) {
      setResources([]);
      setBookmarks([]);
      setActiveResource(null);
      setError(resourceResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!bookmarkResult.ok) {
      setResources(resourceResult.data);
      setBookmarks([]);
      setActiveResource(null);
      setError(bookmarkResult.error.message);
      setIsLoading(false);
      return;
    }

    setResources(resourceResult.data);
    setBookmarks(bookmarkResult.data);

    const targetId =
      preferredResourceId ?? activeResource?.id ?? resourceResult.data[0]?.id ?? null;
    if (targetId) {
      const selected =
        resourceResult.data.find((item) => String(item.id) === String(targetId)) ?? null;
      if (selected) {
        const detailResult = await service.getResource(String(selected.id));
        if (detailResult.ok) {
          setActiveResource(detailResult.data);
        } else {
          setError(detailResult.error.message);
          setActiveResource(selected);
        }
      } else {
        setActiveResource(null);
      }
    } else {
      setActiveResource(null);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadWorkspace();
  }, [isRemoteAuthenticated]);

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length === 0) {
      return resources;
    }

    return resources.filter((resource) => {
      const haystack = [getResourceDisplayName(resource), resource.path, resource.content ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [resources, searchQuery]);

  const bookmarkedResourceIds = useMemo(
    () => new Set(bookmarks.map((bookmark) => String(bookmark.resourceId))),
    [bookmarks],
  );

  async function refresh() {
    await loadWorkspace();
  }

  async function selectResource(id: string) {
    setIsMutating(true);
    setError(null);

    const result = await service.getResource(id);
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    setActiveResource(result.data);
    return true;
  }

  async function saveResource(content: string) {
    if (!activeResource) {
      return false;
    }

    setIsMutating(true);
    setError(null);

    const result = await service.updateResource(String(activeResource.id), { content });
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    await loadWorkspace(String(activeResource.id));
    return true;
  }

  async function createNote(name: string, content: string) {
    if (!repository) {
      return false;
    }

    setIsMutating(true);
    setError(null);

    const normalizedName = name.endsWith('.md') ? name : `${name}.md`;
    const result = await service.createResource(String(repository.id), {
      name: normalizedName,
      type: 'File',
      mimeType: 'text/markdown',
      content,
    });
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    await loadWorkspace(String(result.data.id));
    return true;
  }

  async function runRemoteSearch() {
    if (!repository) {
      return false;
    }

    const query = searchQuery.trim();
    if (query.length === 0) {
      setRemoteSearchResults([]);
      return true;
    }

    setIsSearching(true);
    setError(null);

    const result = await service.search({
      repositoryId: repository.id as SearchRequest['repositoryId'],
      query,
      mode: 'all',
      page: 1,
      pageSize: 20,
    });

    setIsSearching(false);

    if (!result.ok) {
      setRemoteSearchResults([]);
      setError(result.error.message);
      return false;
    }

    setRemoteSearchResults(result.data.results);
    return true;
  }

  async function toggleBookmark(resource: ResourceClientDTO) {
    if (!repository) {
      return false;
    }

    setIsMutating(true);
    setError(null);

    const existing = bookmarks.find(
      (bookmark) => String(bookmark.resourceId) === String(resource.id),
    );
    const result = existing
      ? await service.deleteBookmark(String(repository.id), String(existing.id))
      : await service.createBookmark(String(repository.id), {
          resourceId: resource.id,
          aliasName: getResourceDisplayName(resource),
        });

    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    const bookmarkResult = await service.listBookmarks(String(repository.id));
    if (bookmarkResult.ok) {
      setBookmarks(bookmarkResult.data);
    }

    return true;
  }

  async function deleteSelectedResource() {
    if (!activeResource) {
      return false;
    }

    setIsMutating(true);
    setError(null);

    const result = await service.deleteResource(String(activeResource.id));
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    await loadWorkspace();
    return true;
  }

  async function uploadFiles(
    files: UploadResourceFileDTO[],
    options?: { folderId?: string; tags?: string[] },
  ): Promise<UploadResourcesResponseDTO | null> {
    if (!repository) {
      return null;
    }

    if (files.length === 0) {
      return null;
    }

    setIsMutating(true);
    setError(null);

    const result = await service.uploadResources(String(repository.id), {
      files,
      folderId: options?.folderId as UploadResourcesRequestDTO['folderId'],
      tags: options?.tags,
    });

    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return null;
    }

    await loadWorkspace();
    return result.data;
  }

  return {
    activeResource,
    bookmarkedResourceIds,
    bookmarks,
    createNote,
    deleteSelectedResource,
    error,
    filteredResources,
    isLoading,
    isMutating,
    isRemoteAuthenticated,
    isSearching,
    refresh,
    remoteSearchResults,
    repository,
    resources,
    runRemoteSearch,
    saveResource,
    searchQuery,
    selectResource,
    setSearchQuery,
    toggleBookmark,
    uploadFiles,
  };
}
