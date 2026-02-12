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
    this.resources.set((resource as any).uuid, resource);
  }

  async findByUuid(uuid: string): Promise<Resource | null> {
    return this.resources.get(uuid) ?? null;
  }

  async findById(uuid: string): Promise<Resource | null> {
    return this.findByUuid(uuid);
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r: any) => r.repositoryUuid === repositoryUuid);
  }

  async findByFolderUuid(folderUuid: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r: any) => r.folderUuid === folderUuid);
  }

  async findByAccountUuid(accountUuid: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r: any) => r.accountUuid === accountUuid);
  }

  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    return Array.from(this.resources.values()).some(
      (r: any) => r.repositoryUuid === repositoryUuid && r.path === path,
    );
  }

  async delete(uuid: string): Promise<void> {
    this.resources.delete(uuid);
  }

  // Test helpers
  clear(): void {
    this.resources.clear();
  }

  seed(resources: Resource[]): void {
    resources.forEach((r: any) => this.resources.set(r.uuid, r));
  }
}
