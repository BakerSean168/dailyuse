/**
 * Resource Memory Repository
 *
 * In-memory implementation of IResourceRepository for testing.
 */

import type { IResourceRepository } from '../../ports/resource-repository.port';
import type { Resource } from '../../../domain-server/entities/resource';

/**
 * Resource Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class ResourceMemoryRepository implements IResourceRepository {
  private resources = new Map<string, Resource>();

  async save(resource: Resource): Promise<void> {
    this.resources.set(String(resource.id), resource);
  }

  async findById(id: string): Promise<Resource | null> {
    return this.resources.get(id) ?? null;
  }

  async findByUuid(uuid: string): Promise<Resource | null> {
    return this.findById(uuid);
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r) => String(r.repositoryId) === repositoryId);
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r) => String(r.folderId) === folderId);
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r: any) => r.identityId === identityId);
  }

  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    return Array.from(this.resources.values()).some(
      (r: any) => String(r.repositoryId) === repositoryUuid && r.path === path,
    );
  }

  async delete(id: string): Promise<void> {
    this.resources.delete(id);
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]> {
    return this.findByRepositoryId(repositoryUuid);
  }

  async findByFolderUuid(folderUuid: string): Promise<Resource[]> {
    return this.findByFolderId(folderUuid);
  }

  async findByAccountUuid(accountUuid: string): Promise<Resource[]> {
    return this.findByIdentityId(accountUuid);
  }

  // Test helpers
  clear(): void {
    this.resources.clear();
  }

  seed(resources: Resource[]): void {
    resources.forEach((r) => this.resources.set(String(r.id), r));
  }
}
