import * as fs from 'fs';
import * as path from 'path';
import type {
  IStoragePort,
  StorageWriteRequest,
  StorageMoveRequest,
  StorageDeleteRequest,
} from '../../../application-server/ports/IStoragePort';

/**
 * File System Storage Adapter
 *
 * Implements IStoragePort for local file system storage.
 * Saves files under a configured base directory.
 */
export class FsStorageAdapter implements IStoragePort {
  constructor(private readonly baseDir: string) {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  private getAbsolutePath(repositoryId: string, itemPath: string): string {
    const baseRepoDir = path.resolve(this.baseDir, repositoryId);
    const fullPath = path.resolve(baseRepoDir, itemPath.replace(/^\//, ''));

    // Ensure the resolved path exactly falls within the expected repository directory
    if (!fullPath.startsWith(baseRepoDir + path.sep) && fullPath !== baseRepoDir) {
      throw new Error(`Storage error: Invalid path traversal detected: ${itemPath}`);
    }
    return fullPath;
  }

  async write(request: StorageWriteRequest): Promise<void> {
    const fullPath = this.getAbsolutePath(request.repositoryId, request.path);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    if (request.isFolder) {
      if (!fs.existsSync(fullPath)) {
        await fs.promises.mkdir(fullPath, { recursive: true });
      }
    } else {
      if (typeof request.content === 'string' || request.content == null) {
        await fs.promises.writeFile(fullPath, request.content ?? '', 'utf8');
      } else {
        await fs.promises.writeFile(fullPath, request.content);
      }
    }
  }

  async move(request: StorageMoveRequest): Promise<void> {
    const fromPath = this.getAbsolutePath(request.repositoryId, request.fromPath);
    const toPath = this.getAbsolutePath(request.repositoryId, request.toPath);

    if (!fs.existsSync(fromPath)) {
      throw new Error(`Storage error: Source path does not exist: ${request.fromPath}`);
    }

    const toDir = path.dirname(toPath);
    if (!fs.existsSync(toDir)) {
      await fs.promises.mkdir(toDir, { recursive: true });
    }

    await fs.promises.rename(fromPath, toPath);
  }

  async delete(request: StorageDeleteRequest): Promise<void> {
    const fullPath = this.getAbsolutePath(request.repositoryId, request.path);

    if (!fs.existsSync(fullPath)) {
      return; // Already deleted or doesn't exist
    }

    const stats = await fs.promises.stat(fullPath);
    if (stats.isDirectory()) {
      await fs.promises.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(fullPath);
    }
  }
}
