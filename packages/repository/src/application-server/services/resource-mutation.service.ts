/**
 * ResourceMutationService
 *
 * Centralizes resource create / update / move / delete workflow with
 * path availability checks, storage move, and mutation event emission.
 */
import type { IResourceRepository } from '../../domain-server/repositories/i-resource-repository';
import type { IRepositoryRepository } from '../../domain-server/repositories/i-repository-repository';
import type { IFolderRepository } from '../../domain-server/repositories/i-folder-repository';
import type { IStoragePort } from '../ports/i-storage-port';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import {
  REPOSITORY_RESOURCE_MUTATED_EVENT,
  RepositoryResourceMutationType,
  type RepositoryResourceMutatedEvent,
  type ResourceClientDTO,
  type ResourceType,
  type UploadResourceFileDTO,
  type UploadResourcesRequestDTO,
} from '@dailyuse/contracts/repository';
import type { IdentityId, RepositoryId, ResourceId } from '@dailyuse/contracts/primitives';
import { PathCalculator } from '../../domain-server/services/path-calculator';
import { eventBus } from '@dailyuse/utils/domain';
import type { CreateResourceUseCase } from '../use-cases/commands/create-resource.use-case';
import type { DeleteResourceUseCase } from '../use-cases/commands/delete-resource.use-case';
import type { UpdateResourceContentUseCase } from '../use-cases/commands/update-resource-content.use-case';

const repositoryEventBus = eventBus as unknown as {
  send(eventType: string, payload: unknown): void;
};

export interface ResourceMutationServiceDependencies {
  resourceRepository: IResourceRepository;
  repositoryRepository: IRepositoryRepository;
  folderRepository: IFolderRepository;
  storagePort: IStoragePort;
  createResource: CreateResourceUseCase;
  deleteResource: DeleteResourceUseCase;
  updateResourceContent: UpdateResourceContentUseCase;
}

export class ResourceMutationService {
  constructor(private readonly deps: ResourceMutationServiceDependencies) {}

  // ---------------------------------------------------------------------------
  // Public mutation methods
  // ---------------------------------------------------------------------------

  async createResource(
    data: {
      repositoryId: string;
      identityId: string;
      folderId?: string;
      name: string;
      type: string;
      path?: string;
      content?: string;
    },
  ): Promise<Result<ResourceClientDTO>> {
    const result = await this.deps.createResource.execute({
      repositoryId: data.repositoryId,
      identityId: data.identityId,
      folderId: data.folderId,
      name: data.name,
      type: data.type as any,
      path: data.path ?? `/${data.name}`,
      content: data.content,
    });
    if (!result.ok) return result;

    const createdResource = await this.deps.resourceRepository.findById(
      String(result.data.resource.id),
    );
    if (createdResource) {
      this.emitMutationEvent({
        identityId: createdResource.identityId as IdentityId,
        repositoryId: String(createdResource.repositoryId) as RepositoryId,
        resourceId: String(createdResource.id) as ResourceId,
        resourcePath: createdResource.path,
        mutation: RepositoryResourceMutationType.Created,
      });
    }
    return ok(result.data.resource);
  }

  async updateResource(
    id: string,
    data: {
      name?: string;
      metadata?: Record<string, unknown>;
      content?: string;
    },
  ): Promise<Result<ResourceClientDTO>> {
    let currentResource = await this.deps.resourceRepository.findById(id);
    if (!currentResource) {
      return error('NOT_FOUND', `Resource not found: ${id}`);
    }
    const pathChanged = data.name !== undefined;

    if (pathChanged) {
      const moveResult = await this.moveResourceInStorage(id, data.name);
      if (!moveResult.ok) return moveResult;
      currentResource = moveResult.data;
    }

    if (data.metadata !== undefined) {
      currentResource.updateMetadata(data.metadata);
    }

    await this.deps.resourceRepository.save(currentResource);

    if (data.content !== undefined) {
      const result = await this.deps.updateResourceContent.execute({
        id,
        content: data.content,
      });
      if (!result.ok) return result;

      const updatedResource = await this.deps.resourceRepository.findById(id);
      if (updatedResource) {
        this.emitMutationEvent({
          identityId: updatedResource.identityId as IdentityId,
          repositoryId: String(updatedResource.repositoryId) as RepositoryId,
          resourceId: String(updatedResource.id) as ResourceId,
          resourcePath: updatedResource.path,
          mutation: RepositoryResourceMutationType.ContentUpdated,
        });
      }
      return ok(result.data.resource);
    }

    if (pathChanged) {
      this.emitMutationEvent({
        identityId: currentResource.identityId as IdentityId,
        repositoryId: String(currentResource.repositoryId) as RepositoryId,
        resourceId: String(currentResource.id) as ResourceId,
        resourcePath: currentResource.path,
        mutation: RepositoryResourceMutationType.Moved,
      });
    }

    return ok(currentResource.toClientDTO());
  }

  async moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>> {
    const result = await this.moveResourceInStorage(id, undefined, targetFolderId);
    if (!result.ok) return result;

    this.emitMutationEvent({
      identityId: result.data.identityId as IdentityId,
      repositoryId: String(result.data.repositoryId) as RepositoryId,
      resourceId: String(result.data.id) as ResourceId,
      resourcePath: result.data.path,
      mutation: RepositoryResourceMutationType.Moved,
    });
    return ok(result.data.toClientDTO());
  }

  async deleteResource(id: string): Promise<Result<void>> {
    const resource = await this.deps.resourceRepository.findById(id);
    const result = await this.deps.deleteResource.execute({ id });
    if (!result.ok) return result;

    if (resource) {
      this.emitMutationEvent({
        identityId: resource.identityId as IdentityId,
        repositoryId: String(resource.repositoryId) as RepositoryId,
        resourceId: String(resource.id) as ResourceId,
        resourcePath: resource.path,
        mutation: RepositoryResourceMutationType.Deleted,
      });
    }
    return ok(undefined);
  }

  // ---------------------------------------------------------------------------
  // Upload workflow
  // ---------------------------------------------------------------------------

  async uploadResource(data: {
    repositoryId: string;
    identityId: string;
    type: ResourceType;
    file: UploadResourceFileDTO;
    metadata?: UploadResourcesRequestDTO;
  }): Promise<Result<{ resource: ResourceClientDTO }>> {
    const repository = await this.deps.repositoryRepository.findById(data.repositoryId);
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${data.repositoryId}`);
    }

    const normalizedName = this.normalizeFileName(data.file.name);
    const mimeType = this.normalizeMimeType(data.file.mimeType, normalizedName);
    const folderPathResult = await this.resolveUploadFolderPath(
      data.repositoryId,
      data.metadata?.folderId,
    );
    if (!folderPathResult.ok) {
      return folderPathResult;
    }

    const path = this.buildUploadResourcePath(folderPathResult.data, normalizedName, mimeType);
    const binaryContent = Buffer.from(data.file.contentBase64, 'base64');
    const textContent = this.isTextLikeMimeType(mimeType)
      ? binaryContent.toString('utf8')
      : undefined;
    const existing = await this.deps.resourceRepository.findByRepositoryIdAndPath(
      data.repositoryId,
      path,
    );

    if (existing && data.metadata?.overwritePolicy !== 'replace') {
      return error('CONFLICT', `Resource already exists at path: ${path}`);
    }

    if (existing && data.metadata?.overwritePolicy === 'replace') {
      const deleteResult = await this.deps.deleteResource.execute({ id: String(existing.id) });
      if (!deleteResult.ok) return deleteResult;
    }

    const result = await this.deps.createResource.execute({
      repositoryId: data.repositoryId,
      identityId: data.identityId,
      folderId: data.metadata?.folderId,
      name: normalizedName,
      type: data.type,
      path,
      content: textContent,
      binaryContent: textContent === undefined ? binaryContent : undefined,
      mimeType,
      metadata: {
        tags: this.normalizeTags(data.metadata?.tags),
        mimeType,
      },
    });
    if (!result.ok) return result;

    const createdResource = await this.deps.resourceRepository.findById(
      String(result.data.resource.id),
    );
    if (createdResource) {
      this.emitMutationEvent({
        identityId: createdResource.identityId as IdentityId,
        repositoryId: String(createdResource.repositoryId) as RepositoryId,
        resourceId: String(createdResource.id) as ResourceId,
        resourcePath: createdResource.path,
        mutation: RepositoryResourceMutationType.Created,
      });
    }
    return ok({ resource: result.data.resource });
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private emitMutationEvent(
    payload: Omit<RepositoryResourceMutatedEvent, 'timestamp'>,
  ): void {
    repositoryEventBus.send(REPOSITORY_RESOURCE_MUTATED_EVENT, {
      ...payload,
      timestamp: Date.now(),
    } satisfies RepositoryResourceMutatedEvent);
  }

  private async resolveParentPath(folderId?: string | null): Promise<Result<string | null>> {
    if (!folderId) {
      return ok(null);
    }

    const folder = await this.deps.folderRepository.findById(folderId);
    if (!folder) {
      return error('NOT_FOUND', `Folder not found: ${folderId}`);
    }

    return ok(folder.path);
  }

  private async ensureResourcePathAvailable(
    repositoryId: string,
    path: string,
    currentResourceId: string,
  ): Promise<Result<void>> {
    const existing = await this.deps.resourceRepository.findByRepositoryIdAndPath(repositoryId, path);
    if (existing && String(existing.id) !== currentResourceId) {
      return error('CONFLICT', `Resource already exists at path: ${path}`);
    }
    return ok(undefined);
  }

  private async moveResourceInStorage(
    resourceId: string,
    nextName?: string,
    nextFolderId?: string | null,
  ) {
    const resource = await this.deps.resourceRepository.findById(resourceId);
    if (!resource) {
      return error('NOT_FOUND', `Resource not found: ${resourceId}`);
    }

    const repository = await this.deps.repositoryRepository.findById(String(resource.repositoryId));
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${resource.repositoryId}`);
    }

    const targetFolderId = nextFolderId === undefined ? resource.folderId : nextFolderId;
    const targetName = nextName ?? resource.name;
    const parentPathResult = await this.resolveParentPath(targetFolderId);
    if (!parentPathResult.ok) return parentPathResult;
    const parentPath = parentPathResult.data;
    const targetPath = PathCalculator.buildPath(parentPath, targetName);

    if (targetPath === resource.path) {
      return ok(resource);
    }

    const pathAvailableResult = await this.ensureResourcePathAvailable(
      String(resource.repositoryId),
      targetPath,
      String(resource.id),
    );
    if (!pathAvailableResult.ok) return pathAvailableResult;

    await this.deps.storagePort.move({
      repositoryId: String(repository.id),
      fromPath: resource.path,
      toPath: targetPath,
      isFolder: false,
    });

    if (nextName !== undefined) {
      resource.rename(targetName);
    }
    if (nextFolderId !== undefined) {
      resource.moveTo(targetFolderId as any, targetPath);
    } else if (nextName !== undefined) {
      resource.moveTo(resource.folderId, targetPath);
    }

    await this.deps.resourceRepository.save(resource);
    return ok(resource);
  }

  private async resolveUploadFolderPath(
    repositoryId: string,
    folderId?: string,
  ): Promise<Result<string | null>> {
    if (!folderId) {
      return ok(null);
    }

    const folder = await this.deps.folderRepository.findById(folderId);
    if (!folder || folder.repositoryId !== repositoryId) {
      return error('NOT_FOUND', `Folder not found: ${folderId}`);
    }

    return ok(folder.path);
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags) {
      return [];
    }

    return tags.map((tag) => tag.trim()).filter(Boolean);
  }

  private normalizeFileName(fileName: string): string {
    const trimmed = fileName.trim();
    return trimmed.length > 0 ? trimmed : `upload-${Date.now()}`;
  }

  private normalizeMimeType(mimeType: string | undefined, fileName: string): string {
    if (mimeType && mimeType.trim()) return mimeType;
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.md')) return 'text/markdown';
    if (lower.endsWith('.txt')) return 'text/plain';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return 'application/octet-stream';
  }

  private buildUploadResourcePath(
    folderPath: string | null,
    fileName: string,
    mimeType: string,
  ): string {
    if (folderPath) {
      return PathCalculator.buildPath(folderPath, fileName);
    }

    const implicitParentPath = mimeType.startsWith('image/') ? '/images' : null;
    return PathCalculator.buildPath(implicitParentPath, fileName);
  }

  private isTextLikeMimeType(mimeType: string): boolean {
    return mimeType.startsWith('text/') || mimeType === 'application/json';
  }
}
