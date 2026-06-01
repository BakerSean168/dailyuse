/**
 * Repository Upload — extracted upload workflow from useRepository
 *
 * @module repository/composables/repositoryUpload
 */

import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import type { RepositoryUploadFailure, RepositoryUploadResult, RepositoryUploadProgress } from './useRepositoryUpload';
import { isUploadResponse, isTextLikeFile, guessMimeType } from './repositoryHelpers';

interface UploadDependencies {
  repositoryId: string;
  serviceUpload?: (
    repositoryId: string,
    request: {
      files: File[];
      tags?: string[];
      folderId?: string;
      overwritePolicy?: 'skip' | 'replace';
    },
  ) => Promise<Result<unknown>>;
  executeOperation: <T>(operation: () => Promise<Result<T>>, fallback: string) => Promise<{ ok: boolean; data?: T; error?: { code?: string; message?: string } }>;
  createResource: (data: {
    name: string;
    type: string;
    mimeType?: string;
    content?: string;
    folderId?: string;
  }) => Promise<ResourceClientDTO | null>;
  updateResourceMetadata: (resourceId: string, metadata: Record<string, unknown>) => Promise<ResourceClientDTO | null>;
  setProgress: (progress: RepositoryUploadProgress) => void;
}

export async function executeUploadResources(
  files: File[],
  tags: string[],
  folderId: string | undefined,
  deps: UploadDependencies,
): Promise<RepositoryUploadResult> {
  if (files.length === 0) {
    return { successes: [], failures: [] };
  }

  deps.setProgress({
    total: files.length,
    completed: 0,
    currentFileName: files[0]?.name ?? null,
  });

  if (typeof deps.serviceUpload === 'function') {
    const remoteResult = await deps.executeOperation(
      () =>
        deps.serviceUpload!(deps.repositoryId, {
          files,
          tags,
          folderId,
        }),
      '上传资源失败',
    );
    if (remoteResult.ok && isUploadResponse(remoteResult.data)) {
      const successes = remoteResult.data.successes.map(
        (item: { resource: ResourceClientDTO }) => item.resource,
      );
      const failures = remoteResult.data.failures.map((failure: RepositoryUploadFailure) => ({
        fileName: failure.fileName,
        message: failure.message,
        code: failure.code,
      }));

      deps.setProgress({
        total: files.length,
        completed: files.length,
        currentFileName: null,
      });

      return { successes, failures };
    }
  }

  const successes: ResourceClientDTO[] = [];
  const failures: RepositoryUploadFailure[] = [];

  for (const [index, file] of files.entries()) {
    deps.setProgress({
      total: files.length,
      completed: index,
      currentFileName: file.name,
    });

    if (!isTextLikeFile(file)) {
      failures.push({
        fileName: file.name,
        code: 'BINARY_UPLOAD_UNAVAILABLE',
        message: 'Binary upload requires backend support.',
      });
      continue;
    }

    try {
      const content = await file.text();
      const created = await deps.createResource({
        name: file.name,
        type: 'File',
        mimeType: file.type || guessMimeType(file.name),
        content,
        folderId,
      });

      if (!created) {
        failures.push({
          fileName: file.name,
          code: 'CREATE_FAILED',
          message: 'Failed to create repository resource.',
        });
        continue;
      }

      let uploadedResource = created;
      if (tags.length > 0) {
        const updated = await deps.updateResourceMetadata(created.id, {
          ...created.metadata,
          tags,
        });
        if (updated) {
          uploadedResource = updated;
        }
      }

      successes.push(uploadedResource);
    } catch (uploadError) {
      failures.push({
        fileName: file.name,
        code: 'READ_FAILED',
        message:
          uploadError instanceof Error
            ? uploadError.message
            : 'Unable to read the selected file.',
      });
    }
  }

  deps.setProgress({
    total: files.length,
    completed: files.length,
    currentFileName: null,
  });

  return { successes, failures };
}
