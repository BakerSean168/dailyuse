/**
 * RepositoryContentAdapter
 *
 * Implements IRepositoryContentPort for the Editor module.
 * This adapter bridges the Editor module to the Repository module,
 * enabling the editor to read/write file contents without direct file system access.
 */

import type {
  IRepositoryContentPort,
  RepositoryContentReadResult,
  RepositoryContentWriteRequest,
} from '@dailyuse/editor/application-server';
import type { IResourceRepository } from '@dailyuse/repository/domain-server';
import type { IRepositoryRepository } from '@dailyuse/repository/domain-server';
import type { IStoragePort } from '@dailyuse/repository/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryContentAdapter');

/**
 * Adapter that connects Editor module to Repository module
 */
export class RepositoryContentAdapter implements IRepositoryContentPort {
  constructor(
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {}

  /**
   * Get content of a resource by its UUID
   */
  async getContent(resourceId: string): Promise<RepositoryContentReadResult> {
    logger.debug(`Getting content for resource: ${resourceId}`);

    try {
      // Get resource metadata from repository
      const resource = await this.resourceRepository.findById(resourceId);
      if (!resource) {
        throw new Error(`Resource not found: ${resourceId}`);
      }

      // Get repository metadata
      const repository = await this.repositoryRepository.findById(String(resource.repositoryId));
      if (!repository) {
        throw new Error(`Repository not found: ${resource.repositoryId}`);
      }

      // Read file content from storage
      let content: string | null = null;
      if (!resource.isFolder) {
        try {
          // Use the storage port to read file
          // Note: IStoragePort doesn't have a read method, but our FileSystemStorageAdapter does
          // We'll need to extend or cast to access it
          const storageAdapter = this.storagePort as any;
          if (storageAdapter.readFile) {
            content = await storageAdapter.readFile(
              String(resource.repositoryId),
              resource.path,
            );
          } else {
            // Fallback: return null for folders or if no read method
            content = null;
          }
        } catch (error) {
          logger.warn(`Failed to read file content for ${resourceId}`, error);
          content = null;
        }
      }

      return {
        resourceId: resource.uuid,
        name: resource.name,
        content,
        mimeType: resource.mimeType ?? null,
      };
    } catch (error) {
      logger.error(`Failed to get content for resource ${resourceId}`, error);
      throw error;
    }
  }

  /**
   * Save content for a resource
   */
  async saveContent(request: RepositoryContentWriteRequest): Promise<void> {
    logger.debug(`Saving content for resource: ${request.resourceId}`);

    try {
      // Get resource metadata
      const resource = await this.resourceRepository.findById(request.resourceId);
      if (!resource) {
        throw new Error(`Resource not found: ${request.resourceId}`);
      }

      if (resource.isFolder) {
        throw new Error(`Cannot save content to a folder: ${request.resourceId}`);
      }

      // Get repository metadata
      const repository = await this.repositoryRepository.findById(String(resource.repositoryId));
      if (!repository) {
        throw new Error(`Repository not found: ${resource.repositoryId}`);
      }

      // Write to storage
      await this.storagePort.write({
        repositoryId: String(resource.repositoryId),
        path: resource.path,
        content: request.content,
        isFolder: false,
      });

      // Update resource metadata (size, etc.)
      const newSize = Buffer.byteLength(request.content, 'utf8');
      const oldSize = resource.size ?? 0;
      const sizeDelta = newSize - oldSize;

      resource.updateContent({
        content: request.content,
        size: newSize,
      });
      await this.resourceRepository.save(resource);

      // Update repository statistics if size changed
      if (sizeDelta !== 0) {
        repository.updateStats({
          totalSize: Math.max(0, repository.stats.totalSize + sizeDelta),
        });
        await this.repositoryRepository.save(repository);
      }

      logger.debug(`Successfully saved content for resource: ${request.resourceId}`);
    } catch (error) {
      logger.error(`Failed to save content for resource ${request.resourceId}`, error);
      throw error;
    }
  }
}
