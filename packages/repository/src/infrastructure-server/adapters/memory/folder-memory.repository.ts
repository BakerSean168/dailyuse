/**
 * Folder Memory Repository
 *
 * In-memory implementation of IFolderRepository for testing.
 */

import type { IFolderRepository } from '../../ports/folder-repository.port';
import type { Folder } from '@/domain-server';

/**
 * Folder Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class FolderMemoryRepository implements IFolderRepository {
  private folders = new Map<string, Folder>();

  async save(folder: Folder): Promise<void> {
    this.folders.set((folder as any).uuid, folder);
  }

  async findByUuid(uuid: string): Promise<Folder | null> {
    return this.folders.get(uuid) ?? null;
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter((f: any) => f.repositoryUuid === repositoryUuid);
  }

  async findByParentUuid(parentUuid: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter((f: any) => f.parentUuid === parentUuid);
  }

  async findRootFolders(repositoryUuid: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (f: any) => f.repositoryUuid === repositoryUuid && !f.parentUuid,
    );
  }

  async delete(uuid: string): Promise<void> {
    this.folders.delete(uuid);
  }

  async deleteByRepositoryUuid(repositoryUuid: string): Promise<void> {
    this.folders.forEach((f: any, uuid) => {
      if (f.repositoryUuid === repositoryUuid) {
        this.folders.delete(uuid);
      }
    });
  }

  async exists(uuid: string): Promise<boolean> {
    return this.folders.has(uuid);
  }

  // Test helpers
  clear(): void {
    this.folders.clear();
  }

  seed(folders: Folder[]): void {
    folders.forEach((f: any) => this.folders.set(f.uuid, f));
  }
}
