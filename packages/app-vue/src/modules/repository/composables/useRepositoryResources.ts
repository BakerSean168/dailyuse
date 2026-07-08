/**
 * useRepositoryResources - Core resource CRUD operations
 *
 * Extracted from useRepository to isolate resource lifecycle concerns.
 */

import { ref } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import type { Repository } from '@dailyuse/repository/client';
import { logEditorIssue, summarizeResourceForDebug } from '../../../shared/utils/editor-issue-debug';
import {
  buildUntitledNoteName,
  normalizeNoteName,
  ensureUniqueNoteName,
  guessMimeType,
  getResultErrorMessage,
} from './repositoryHelpers';

interface ResourceServiceLike {
  getCurrentRepository(): Promise<Result<Repository | null>>;
  listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>>;
  createResource(repositoryId: string, request: Record<string, unknown>): Promise<Result<ResourceClientDTO>>;
  updateResource(resourceId: string, request: Record<string, unknown>): Promise<Result<ResourceClientDTO>>;
  deleteResource(resourceId: string): Promise<Result<void>>;
  renameResource?(resourceId: string, name: string): Promise<Result<ResourceClientDTO>>;
  getResource?(resourceId: string): Promise<Result<ResourceClientDTO>>;
}

interface ResourceDependencies {
  service: ResourceServiceLike;
  executeOperation: <T>(op: () => Promise<Result<T>>, fallback: string) => Promise<Result<T>>;
  handleError: (msg: string) => void;
  getRepositoryId: () => string | null;
  getResources: () => ResourceClientDTO[];
  addResource: (resource: ResourceClientDTO) => void;
  updateResourceInStore: (resource: ResourceClientDTO) => void;
  removeResource: (resourceId: string) => void;
  refreshTree: () => Promise<unknown>;
}

export function useRepositoryResources(deps: ResourceDependencies) {
  const savingId = ref<string | null>(null);
  const isSaving = ref(false);

  function setSaving(id: string | null) {
    savingId.value = id;
    isSaving.value = id !== null;
  }

  function findCached(resourceId: string): ResourceClientDTO | null {
    return deps.getResources().find((r) => r.id === resourceId) ?? null;
  }

  async function fetchResources(): Promise<void> {
    const repositoryId = deps.getRepositoryId();
    if (!repositoryId) return;
    const result = await deps.executeOperation(
      () => deps.service.listResources(repositoryId), '加载资源失败',
    );
    if (result.ok) {
      for (const r of result.data ?? []) deps.updateResourceInStore(r);
      await deps.refreshTree();
    }
  }

  async function createResource(data: {
    name: string; type: string; mimeType?: string; content?: string; folderId?: string;
  }): Promise<ResourceClientDTO | null> {
    const repositoryId = deps.getRepositoryId();
    if (!repositoryId) return null;
    setSaving('new');
    try {
      const result = await deps.executeOperation(
        () => deps.service.createResource(repositoryId, { ...data }), '创建资源失败',
      );
      if (result.ok && result.data) {
        deps.addResource(result.data);
        await deps.refreshTree();
        return result.data;
      }
      deps.handleError(result.ok ? '创建资源返回空数据' : getResultErrorMessage(result, '创建资源失败'));
      return null;
    } finally {
      setSaving(null);
    }
  }

  async function deleteResource(resourceId: string): Promise<boolean> {
    setSaving(resourceId);
    try {
      const result = await deps.executeOperation(
        () => deps.service.deleteResource(resourceId), '删除资源失败',
      );
      if (result.ok) {
        deps.removeResource(resourceId);
        await deps.refreshTree();
        return true;
      }
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function getResourceById(resourceId: string): Promise<ResourceClientDTO | null> {
    if (typeof deps.service.getResource !== 'function') {
      const cached = findCached(resourceId);
      logEditorIssue('repository:get-resource:cache-only', { resourceId, resource: summarizeResourceForDebug(cached) });
      return cached;
    }

    try {
      const result = await deps.executeOperation(
        () => deps.service.getResource!(resourceId), '加载资源失败',
      );
      if (result.ok && result.data) {
        deps.updateResourceInStore(result.data);
        logEditorIssue('repository:get-resource:service-hit', { resourceId, resource: summarizeResourceForDebug(result.data) });
        return result.data;
      }
      const cached = findCached(resourceId);
      logEditorIssue('repository:get-resource:fallback-cache', {
        resourceId, errorCode: !result.ok ? result.error?.code ?? null : null, resource: summarizeResourceForDebug(cached),
      });
      return cached;
    } catch (cause) {
      const cached = findCached(resourceId);
      logEditorIssue('repository:get-resource:exception-fallback', {
        resourceId, cause: cause instanceof Error ? cause.message : String(cause), resource: summarizeResourceForDebug(cached),
      });
      return cached;
    }
  }

  async function readResourceAsDataUrl(resource: ResourceClientDTO): Promise<string> {
    const source = (await getResourceById(resource.id)) ?? resource;
    if (typeof source.content !== 'string' || source.content.length === 0) {
      throw new Error('Resource content is unavailable.');
    }
    const mimeType = source.mimeType || guessMimeType(source.name);
    const normalized = source.content.trim();
    return normalized.startsWith('data:') ? normalized : `data:${mimeType};base64,${normalized.replace(/\s+/g, '')}`;
  }

  async function updateResourceMetadata(resourceId: string, metadata: Record<string, unknown>): Promise<ResourceClientDTO | null> {
    setSaving(resourceId);
    try {
      const result = await deps.executeOperation(
        () => deps.service.updateResource(resourceId, { metadata }), '更新资源元数据失败',
      );
      if (result.ok && result.data) {
        deps.updateResourceInStore(result.data);
        await deps.refreshTree();
        return result.data;
      }
      deps.handleError(result.ok ? '更新资源元数据返回空数据' : result.error?.message || '更新资源元数据失败');
      return null;
    } finally {
      setSaving(null);
    }
  }

  async function createMarkdownNote(name?: string, initialContent = '', folderId?: string): Promise<ResourceClientDTO | null> {
    const requestedName = normalizeNoteName(name ?? buildUntitledNoteName());
    const noteName = ensureUniqueNoteName(
      requestedName, deps.getResources().filter((r) => r.folderId === (folderId ?? null)),
    );
    return createResource({ name: noteName, type: 'File', mimeType: 'text/markdown', content: initialContent, folderId });
  }

  async function renameResource(resourceId: string, name: string): Promise<ResourceClientDTO | null> {
    if (typeof deps.service.renameResource !== 'function') {
      deps.handleError('当前环境不支持重命名资源');
      return null;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      deps.handleError('资源名称不能为空');
      return null;
    }
    const result = await deps.executeOperation(
      () => deps.service.renameResource!(resourceId, trimmedName), '重命名资源失败',
    );
    if (result.ok && result.data) {
      deps.updateResourceInStore(result.data);
      await deps.refreshTree();
      return result.data;
    }
    deps.handleError(result.ok ? '重命名资源返回空数据' : getResultErrorMessage(result, '重命名资源失败'));
    return null;
  }

  return {
    isSaving, fetchResources, createResource, deleteResource,
    getResourceById, readResourceAsDataUrl, updateResourceMetadata,
    createMarkdownNote, renameResource,
  };
}
