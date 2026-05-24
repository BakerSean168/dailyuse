import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { getResourceDisplayName } from '../../modules/repository/utils/resource-presentation';

const STORAGE_KEY = 'dailyuse:debug:editor-issues';
const QUERY_KEY = 'debug-editor-issues';
const GLOBAL_KEY = '__DAILYUSE_DEBUG__';

interface EditorIssueDebugRoot {
  editorIssues?: boolean;
}

function getDebugRoot(): EditorIssueDebugRoot | null {
  const root = (globalThis as Record<string, unknown>)[GLOBAL_KEY];
  return root && typeof root === 'object' ? (root as EditorIssueDebugRoot) : null;
}

export function isEditorIssueDebugEnabled(): boolean {
  try {
    if (getDebugRoot()?.editorIssues) {
      return true;
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get(QUERY_KEY) === '1') {
        return true;
      }

      if (window.localStorage?.getItem(STORAGE_KEY) === '1') {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export function logEditorIssue(scope: string, payload?: unknown): void {
  if (!isEditorIssueDebugEnabled()) {
    return;
  }

  console.info(`[EditorIssueDebug] ${scope}`, payload ?? {});
}

export function summarizeResourceForDebug(
  resource: Partial<
    Pick<
      ResourceClientDTO,
      'id' | 'name' | 'path' | 'extension' | 'mimeType' | 'folderId' | 'type'
    >
  > | null | undefined,
) {
  if (!resource) {
    return null;
  }

  return {
    id: resource.id ?? null,
    name: resource.name ?? null,
    displayName: resource.name ? getResourceDisplayName(resource as Pick<ResourceClientDTO, 'name' | 'path'>) : null,
    path: resource.path ?? null,
    extension: resource.extension ?? null,
    mimeType: resource.mimeType ?? null,
    folderId: resource.folderId ?? null,
    type: resource.type ?? null,
  };
}
