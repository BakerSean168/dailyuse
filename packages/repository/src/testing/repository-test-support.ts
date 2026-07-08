import { FsStorageAdapter } from '../server/infrastructure/adapters/fs/fs-storage.adapter';
import { FolderMemoryRepository } from '../server/infrastructure/adapters/memory/folder-memory.repository';
import { RepositoryMemoryRepository } from '../server/infrastructure/adapters/memory/repository-memory.repository';
import { ResourceBookmarkMemoryRepository } from '../server/infrastructure/adapters/memory/resource-bookmark-memory.repository';
import { ResourceMemoryRepository } from '../server/infrastructure/adapters/memory/resource-memory.repository';
import { createRepositoryModule } from '../server/infrastructure/repository.module';

export interface RepositoryMemoryTestRepositories {
  readonly resourceRepository: ResourceMemoryRepository;
  readonly repositoryRepository: RepositoryMemoryRepository;
  readonly folderRepository: FolderMemoryRepository;
  readonly resourceBookmarkRepository: ResourceBookmarkMemoryRepository;
}

export function createRepositoryMemoryTestRepositories(): RepositoryMemoryTestRepositories {
  return {
    resourceRepository: new ResourceMemoryRepository(),
    repositoryRepository: new RepositoryMemoryRepository(),
    folderRepository: new FolderMemoryRepository(),
    resourceBookmarkRepository: new ResourceBookmarkMemoryRepository(),
  };
}

export function createTestFsStorage(tempDir: string): FsStorageAdapter {
  return new FsStorageAdapter(tempDir);
}

export function createRepositoryModuleForTests(options: {
  readonly tempDir: string;
  readonly autoCreateCanonicalRepository?: boolean;
  readonly repositories?: Partial<RepositoryMemoryTestRepositories>;
  readonly storagePort?: FsStorageAdapter;
}) {
  const repositories = {
    ...createRepositoryMemoryTestRepositories(),
    ...options.repositories,
  };

  const storagePort = options.storagePort ?? createTestFsStorage(options.tempDir);

  return {
    ...repositories,
    storagePort,
    module: createRepositoryModule({
      ...repositories,
      storagePort,
      autoCreateCanonicalRepository: options.autoCreateCanonicalRepository,
    }),
  };
}
