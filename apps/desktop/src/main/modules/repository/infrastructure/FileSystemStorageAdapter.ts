/**
 * FileSystemStorageAdapter
 *
 * Implements IStoragePort for local file system operations.
 * This adapter handles actual file I/O operations for the Repository module.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import type {
  IStoragePort,
  StorageWriteRequest,
  StorageMoveRequest,
  StorageDeleteRequest,
} from '@dailyuse/repository/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FileSystemStorageAdapter');

export class FileSystemStorageAdapter implements IStoragePort {
  private baseStoragePath: string;

  constructor() {
    // Use app's userData directory for repositories
    this.baseStoragePath = path.join(app.getPath('userData'), 'repositories');
    this.ensureBaseDirectory();
  }

  private async ensureBaseDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.baseStoragePath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create base storage directory', error);
      throw new Error(`Failed to create storage directory: ${error}`);
    }
  }

  /**
   * Get the full path for a repository resource
   */
  private getFullPath(repositoryId: string, resourcePath: string): string {
    return path.join(this.baseStoragePath, repositoryId, resourcePath);
  }

  /**
   * Write file or create folder
   */
  async write(request: StorageWriteRequest): Promise<void> {
    const fullPath = this.getFullPath(request.repositoryId, request.path);
    logger.debug(`Writing to: ${fullPath}`, { isFolder: request.isFolder });

    try {
      if (request.isFolder) {
        // Create folder
        await fs.mkdir(fullPath, { recursive: true });
      } else {
        // Create parent directory if needed
        const dirPath = path.dirname(fullPath);
        await fs.mkdir(dirPath, { recursive: true });

        // Write file content
        const content = request.content ?? '';
        await fs.writeFile(fullPath, content, 'utf8');
      }
    } catch (error) {
      logger.error(`Failed to write ${request.isFolder ? 'folder' : 'file'}`, error);
      throw new Error(`Storage write failed: ${error}`);
    }
  }

  /**
   * Move file or folder
   */
  async move(request: StorageMoveRequest): Promise<void> {
    const fromPath = this.getFullPath(request.repositoryId, request.fromPath);
    const toPath = this.getFullPath(request.repositoryId, request.toPath);
    logger.debug(`Moving from ${fromPath} to ${toPath}`);

    try {
      // Ensure target directory exists
      const targetDir = path.dirname(toPath);
      await fs.mkdir(targetDir, { recursive: true });

      // Rename (move) the file/folder
      await fs.rename(fromPath, toPath);
    } catch (error) {
      logger.error('Failed to move resource', error);
      throw new Error(`Storage move failed: ${error}`);
    }
  }

  /**
   * Delete file or folder
   */
  async delete(request: StorageDeleteRequest): Promise<void> {
    const fullPath = this.getFullPath(request.repositoryId, request.path);
    logger.debug(`Deleting: ${fullPath}`, { isFolder: request.isFolder });

    try {
      const stats = await fs.stat(fullPath).catch(() => null);
      if (!stats) {
        // Already deleted or doesn't exist
        logger.debug(`Resource not found, skipping delete: ${fullPath}`);
        return;
      }

      if (request.isFolder || stats.isDirectory()) {
        // Delete folder recursively
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        // Delete file
        await fs.unlink(fullPath);
      }
    } catch (error) {
      logger.error('Failed to delete resource', error);
      throw new Error(`Storage delete failed: ${error}`);
    }
  }

  /**
   * Read file content (helper method for RepositoryContentAdapter)
   */
  async readFile(repositoryId: string, resourcePath: string): Promise<string> {
    const fullPath = this.getFullPath(repositoryId, resourcePath);
    logger.debug(`Reading file: ${fullPath}`);

    try {
      const content = await fs.readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      logger.error('Failed to read file', error);
      throw new Error(`Storage read failed: ${error}`);
    }
  }

  /**
   * Check if path exists (helper method)
   */
  async exists(repositoryId: string, resourcePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(repositoryId, resourcePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
