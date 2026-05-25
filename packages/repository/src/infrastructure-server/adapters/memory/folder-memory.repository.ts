/**
 * Folder Memory Repository
 *
 * In-memory implementation of IFolderRepository for testing.
 */

import type { IFolderRepository } from '../../../domain-server/repositories/i-folder-repository';
import type { Folder } from '../../../domain-server/entities/folder';

/**
 * Folder Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class FolderMemoryRepository implements IFolderRepository {
  private folders = new Map<string, Folder>();

  async save(folder: Folder): Promise<void> {
    this.folders.set(String(folder.id), folder);
  }

  async findById(id: string): Promise<Folder | null> {
    return this.folders.get(id) ?? null;
  }

  async findByRepositoryId(repositoryId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter((f) => f.repositoryId === repositoryId);
  }

  async findByParentId(parentId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter((f) => f.parentId === parentId);
  }

  async findRootFolders(repositoryId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (f) => f.repositoryId === repositoryId && !f.parentId,
    );
  }

  async delete(id: string): Promise<void> {
    this.folders.delete(id);
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    this.folders.forEach((folder, id) => {
      if (folder.repositoryId === repositoryId) {
        this.folders.delete(id);
      }
    });
  }

  async exists(id: string): Promise<boolean> {
    return this.folders.has(id);
  }

  // Test helpers
  clear(): void {
    this.folders.clear();
  }

  seed(folders: Folder[]): void {
    folders.forEach((f) => this.folders.set(String(f.id), f));
  }
}
