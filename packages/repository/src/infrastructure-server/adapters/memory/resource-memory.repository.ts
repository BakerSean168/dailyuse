/**
 * Resource Memory Repository
 *
 * In-memory implementation of IResourceRepository for testing.
 */

import type { IResourceRepository } from '../../domain-server';
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

  async findById(id: string): Promise<Resource | null> {
    return this.findById(id);
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

  async existsByPath(repositoryId: string, path: string): Promise<boolean> {
    return Array.from(this.resources.values()).some(
      (r: any) => String(r.repositoryId) === repositoryId && r.path === path,
    );
  }

  async delete(id: string): Promise<void> {
    this.resources.delete(id);
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    return this.findByRepositoryId(repositoryId);
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    return this.findByFolderId(folderId);
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
