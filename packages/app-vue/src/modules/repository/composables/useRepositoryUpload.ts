/**
 * useRepositoryUpload - Upload orchestration for repository resources
 *
 * Extracted from useRepository to isolate upload state and workflow.
 */

import { ref } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { executeUploadResources } from './repositoryUpload';

export interface RepositoryUploadFailure {
  fileName: string;
  message: string;
  code: string;
}

export interface RepositoryUploadResult {
  successes: ResourceClientDTO[];
  failures: RepositoryUploadFailure[];
}

export interface RepositoryUploadProgress {
  total: number;
  completed: number;
  currentFileName: string | null;
}

interface UploadCapableService {
  uploadResources?(
    repositoryId: string,
    request: {
      files: File[];
      tags?: string[];
      folderId?: string;
      overwritePolicy?: 'skip' | 'replace';
    },
  ): Promise<Result<unknown>>;
}

interface UploadDependencies {
  service: UploadCapableService;
  executeOperation: <T>(
    operation: () => Promise<Result<T>>,
    fallbackMessage: string,
  ) => Promise<Result<T>>;
  getRepositoryId: () => string | null;
  createResource: (data: {
    name: string;
    type: string;
    mimeType?: string;
    content?: string;
    folderId?: string;
  }) => Promise<ResourceClientDTO | null>;
  updateResourceMetadata: (
    resourceId: string,
    metadata: Record<string, unknown>,
  ) => Promise<ResourceClientDTO | null>;
  onResourcesUploaded: (resources: ResourceClientDTO[]) => void;
}

export function useRepositoryUpload(deps: UploadDependencies) {
  const isUploading = ref(false);
  const uploadProgress = ref<RepositoryUploadProgress>({
    total: 0,
    completed: 0,
    currentFileName: null,
  });

  async function uploadResources(
    files: File[],
    tags: string[] = [],
    folderId?: string,
  ): Promise<RepositoryUploadResult> {
    const repositoryId = deps.getRepositoryId();
    if (!repositoryId || files.length === 0) {
      return { successes: [], failures: [] };
    }

    isUploading.value = true;
    try {
      const result = await executeUploadResources(files, tags, folderId, {
        repositoryId,
        serviceUpload: deps.service.uploadResources,
        executeOperation: deps.executeOperation,
        createResource: deps.createResource,
        updateResourceMetadata: deps.updateResourceMetadata,
        setProgress: (p) => {
          uploadProgress.value = p;
        },
      });

      deps.onResourcesUploaded(result.successes);

      return result;
    } finally {
      isUploading.value = false;
    }
  }

  return {
    isUploading,
    uploadProgress,
    uploadResources,
  };
}
