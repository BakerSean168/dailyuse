/**
 * Resource Memory Repository
 *
 * In-memory implementation of IResourceRepository for testing.
 */

import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
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

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (r) => String(r.repositoryId) === repositoryId,
    );
  }

  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<Resource | null> {
    return (
      Array.from(this.resources.values()).find(
        (r) => String(r.repositoryId) === repositoryId && r.path === path,
      ) ?? null
    );
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r) => String(r.folderId) === folderId);
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r) => r.identityId === identityId);
  }

  async existsByPath(repositoryId: string, path: string): Promise<boolean> {
    return Array.from(this.resources.values()).some(
      (r) => String(r.repositoryId) === repositoryId && r.path === path,
    );
  }

  async delete(id: string): Promise<void> {
    this.resources.delete(id);
  }

  async findByAccountId(identityId: string): Promise<Resource[]> {
    return this.findByIdentityId(identityId);
  }

  // Test helpers
  clear(): void {
    this.resources.clear();
  }

  seed(resources: Resource[]): void {
    resources.forEach((r) => this.resources.set(String(r.id), r));
  }
}
