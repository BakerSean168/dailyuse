/**
 * StoredResourceHydrationService
 *
 * Responsible for hydrating stored resource content (text vs binary).
 */
import type { IStoragePort } from '../ports/IStoragePort';

export interface StoredResourceHydrationServiceDependencies {
  storagePort: IStoragePort;
}

export class StoredResourceHydrationService {
  constructor(private readonly deps: StoredResourceHydrationServiceDependencies) {}

  async hydrateContent<
    T extends { repositoryId: string; path: string; content: string | null; mimeType: string },
  >(resource: T | null): Promise<T | null> {
    if (!resource || resource.content) {
      return resource;
    }

    const storedBytes = await this.deps.storagePort.read({
      repositoryId: resource.repositoryId,
      path: resource.path,
    });
    if (!storedBytes) {
      return resource;
    }

    const textLike =
      resource.mimeType.startsWith('text/') || resource.mimeType === 'application/json';

    return {
      ...resource,
      content: textLike
        ? Buffer.from(storedBytes).toString('utf8')
        : Buffer.from(storedBytes).toString('base64'),
    };
  }
}
