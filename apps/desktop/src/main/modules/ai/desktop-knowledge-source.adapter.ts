import * as path from 'node:path';
import { createHash } from 'node:crypto';

import { app } from 'electron';
import type { IKnowledgeSourcePort, KnowledgeSourceResource } from '@dailyuse/ai/application-server';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { FsStorageAdapter } from '@dailyuse/repository';
import {
  createRepositoryPowerSyncModule,
  type RepositoryModuleInstance,
} from '@dailyuse/repository/infrastructure-server';

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter((token) => token.length > 1);
}

function isQueryableResource(resource: ResourceClientDTO): boolean {
  return (
    resource.isActive &&
    !resource.isDeleted &&
    (resource.mimeType.startsWith('text/') ||
      resource.extension === '.md' ||
      resource.extension === '.txt')
  );
}

function scoreResource(resource: ResourceClientDTO, query: string): number {
  const tokens = new Set(tokenize(query));
  const haystack = `${resource.name} ${resource.path} ${resource.content ?? ''}`.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  if (query.trim() && resource.name.toLowerCase().includes(query.trim().toLowerCase())) {
    score += 2;
  }

  return score;
}

export class DesktopKnowledgeSourceAdapter implements IKnowledgeSourcePort {
  private readonly repositoryModule: RepositoryModuleInstance;

  constructor(db: IElectronDatabase) {
    const storageBaseDir = path.join(app.getPath('userData'), 'repository-storage');
    this.repositoryModule = createRepositoryPowerSyncModule(db, {
      storagePort: new FsStorageAdapter(storageBaseDir),
    });
  }

  async listRelevantResources(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeSourceResource[]> {
    const hydrated = await this.loadQueryableResources(identityId);

    return hydrated
      .map((resource) => ({
        resource,
        score: scoreResource(resource, query),
      }))
      .filter(({ score }) => score > 0 || query.trim().length === 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ resource }) => this.toKnowledgeResource(identityId, resource));
  }

  async listIndexableResources(
    identityId: string,
    limit: number,
  ): Promise<KnowledgeSourceResource[]> {
    const hydrated = await this.loadQueryableResources(identityId);
    return hydrated.slice(0, limit).map((resource) => this.toKnowledgeResource(identityId, resource));
  }

  async getResourceById(
    identityId: string,
    resourceId: string,
  ): Promise<KnowledgeSourceResource | null> {
    const repositoryId = await this.resolveActiveRepositoryId(identityId);
    if (!repositoryId) {
      return null;
    }

    const result = await this.repositoryModule.api.getResource(resourceId);
    if (!result.ok) {
      return null;
    }

    const resource = result.data as ResourceClientDTO;
    if (String(resource.repositoryId) !== repositoryId || !isQueryableResource(resource)) {
      return null;
    }

    return resource.content ? this.toKnowledgeResource(identityId, resource) : null;
  }

  private async loadQueryableResources(identityId: string): Promise<ResourceClientDTO[]> {
    const repositoryId = await this.resolveActiveRepositoryId(identityId);
    if (!repositoryId) {
      return [];
    }

    const listResult = await this.repositoryModule.api.listResources(repositoryId);
    if (!listResult.ok) {
      return [];
    }

    const resources = (listResult.data as ResourceClientDTO[]).filter(isQueryableResource);
    const hydrated = await Promise.all(
      resources.map(async (resource) => {
        const result = await this.repositoryModule.api.getResource(String(resource.id));
        return result.ok ? (result.data as ResourceClientDTO) : null;
      }),
    );

    return hydrated.filter((resource): resource is ResourceClientDTO => !!resource && !!resource.content);
  }

  private async resolveActiveRepositoryId(identityId: string): Promise<string | null> {
    const repositoryResult = await this.repositoryModule.api.findActiveRepository(identityId);
    if (!repositoryResult.ok) {
      return null;
    }

    return String((repositoryResult.data as { id: string }).id);
  }

  private toKnowledgeResource(
    identityId: string,
    resource: ResourceClientDTO,
  ): KnowledgeSourceResource {
    return {
      identityId,
      repositoryId: String(resource.repositoryId),
      resourceId: String(resource.id),
      resourcePath: resource.path,
      title: resource.name,
      mimeType: resource.mimeType,
      content: resource.content ?? '',
      metadata: {
        ...resource.metadata,
        resourceVersion: resource.version,
        contentDigest: createHash('sha256')
          .update(resource.content ?? '')
          .digest('hex'),
      },
    };
  }
}
