import { describe, expect, it, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FsStorageAdapter } from '../../infrastructure-server/adapters/fs/fs-storage.adapter';
import { ResourceMemoryRepository } from '../../infrastructure-server/adapters/memory/resource-memory.repository';
import { RepositoryMemoryRepository } from '../../infrastructure-server/adapters/memory/repository-memory.repository';
import { FolderMemoryRepository } from '../../infrastructure-server/adapters/memory/folder-memory.repository';
import { ResourceMutationService } from '../services/resource-mutation.service';
import { CreateResourceUseCase } from '../use-cases/commands/create-resource.use-case';
import { DeleteResourceUseCase } from '../use-cases/commands/delete-resource.use-case';
import { UpdateResourceContentUseCase } from '../use-cases/commands/update-resource-content.use-case';
import { Repository } from '../../domain-server/aggregates/repository';
import { Folder } from '../../domain-server/entities/folder';
import {
  REPOSITORY_RESOURCE_MUTATED_EVENT,
  RepositoryResourceMutationType,
  ResourceType,
  type RepositoryResourceMutatedEvent,
} from '@dailyuse/contracts/repository';
import { eventBus } from '@dailyuse/utils';

const tempDirs: string[] = [];

async function createTestEnv() {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'resource-mutation-'));
  tempDirs.push(tempDir);

  const storage = new FsStorageAdapter(tempDir);
  const resourceRepository = new ResourceMemoryRepository();
  const repositoryRepository = new RepositoryMemoryRepository();
  const folderRepository = new FolderMemoryRepository();

  const createResource = new CreateResourceUseCase(resourceRepository, repositoryRepository, storage);
  const deleteResource = new DeleteResourceUseCase(resourceRepository, repositoryRepository, storage);
  const updateResourceContent = new UpdateResourceContentUseCase(resourceRepository, repositoryRepository, storage);

  const service = new ResourceMutationService({
    resourceRepository,
    repositoryRepository,
    folderRepository,
    storagePort: storage,
    createResource,
    deleteResource,
    updateResourceContent,
  });

  const repository = Repository.create({
    identityId: 'user-1' as any,
    name: 'Repo',
    type: 'personal' as any,
    path: '/repo',
  });
  await repositoryRepository.save(repository);

  return { service, storage, resourceRepository, repositoryRepository, folderRepository, repository, tempDir };
}

afterEach(async () => {
  for (const dir of tempDirs) {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe('ResourceMutationService', () => {
  it('creates a resource and emits Created event', async () => {
    const { service, resourceRepository, repository } = await createTestEnv();
    const receivedEvents: RepositoryResourceMutatedEvent[] = [];
    const handler = (event: RepositoryResourceMutatedEvent) => receivedEvents.push(event);
    (eventBus as any).on(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);

    try {
      const result = await service.createResource({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        name: 'note.md',
        type: 'File',
        content: '# Hello',
      });

      expect(result.ok).toBe(true);
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].mutation).toBe(RepositoryResourceMutationType.Created);
    } finally {
      (eventBus as any).off(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);
    }
  });

  it('renames a resource in both storage and metadata', async () => {
    const { service, resourceRepository, repository, tempDir } = await createTestEnv();

    const created = await service.createResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      name: 'note.md',
      type: 'File',
      content: '# Hello',
    });
    if (!created.ok) throw new Error('Expected created resource');
    const resourceId = (created.data as any).id;

    const renamed = await service.updateResource(resourceId, { name: 'renamed.md' });
    expect(renamed.ok).toBe(true);

    const stored = await resourceRepository.findById(resourceId);
    expect(stored?.name).toBe('renamed.md');
    expect(stored?.path).toBe('/renamed.md');
    await expect(
      fs.promises.readFile(path.join(tempDir, String(repository.id), 'renamed.md'), 'utf8'),
    ).resolves.toBe('# Hello');
  });

  it('returns CONFLICT when renaming to an existing path', async () => {
    const { service, repository } = await createTestEnv();

    await service.createResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      name: 'first.md',
      type: 'File',
      content: '# First',
    });

    const second = await service.createResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      name: 'second.md',
      type: 'File',
      content: '# Second',
    });
    if (!second.ok) throw new Error('Expected second resource');
    const secondId = (second.data as any).id;

    const result = await service.updateResource(secondId, { name: 'first.md' });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected failure');
    expect(result.error.code).toBe('CONFLICT');
  });

  it('moves a resource into a folder in both storage and metadata', async () => {
    const { service, resourceRepository, folderRepository, storage, repository, tempDir } =
      await createTestEnv();

    const folder = Folder.create({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      name: 'articles',
      parentId: null,
    });
    await folderRepository.save(folder);
    await storage.write({
      repositoryId: String(repository.id),
      path: folder.path,
      isFolder: true,
    });

    const created = await service.createResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      name: 'note.md',
      type: 'File',
      content: '# Hello',
    });
    if (!created.ok) throw new Error('Expected created resource');
    const resourceId = (created.data as any).id;

    const moved = await service.moveResource(resourceId, String(folder.id));
    expect(moved.ok).toBe(true);

    const stored = await resourceRepository.findById(resourceId);
    expect(stored?.folderId).toBe(String(folder.id));
    expect(stored?.path).toBe('/articles/note.md');
    await expect(
      fs.promises.readFile(
        path.join(tempDir, String(repository.id), 'articles', 'note.md'),
        'utf8',
      ),
    ).resolves.toBe('# Hello');
  });

  it('emits ContentUpdated event on content change', async () => {
    const { service, repository } = await createTestEnv();
    const receivedEvents: RepositoryResourceMutatedEvent[] = [];
    const handler = (event: RepositoryResourceMutatedEvent) => receivedEvents.push(event);
    (eventBus as any).on(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);

    try {
      const created = await service.createResource({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        name: 'note.md',
        type: 'File',
        content: '# Hello',
      });
      if (!created.ok) throw new Error('Expected created resource');
      const resourceId = (created.data as any).id;

      await service.updateResource(resourceId, { content: '# Updated' });

      expect(receivedEvents.map((e) => e.mutation)).toEqual([
        RepositoryResourceMutationType.Created,
        RepositoryResourceMutationType.ContentUpdated,
      ]);
    } finally {
      (eventBus as any).off(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);
    }
  });

  it('emits Moved event on rename', async () => {
    const { service, repository } = await createTestEnv();
    const receivedEvents: RepositoryResourceMutatedEvent[] = [];
    const handler = (event: RepositoryResourceMutatedEvent) => receivedEvents.push(event);
    (eventBus as any).on(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);

    try {
      const created = await service.createResource({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        name: 'note.md',
        type: 'File',
        content: '# Hello',
      });
      if (!created.ok) throw new Error('Expected created resource');
      const resourceId = (created.data as any).id;

      await service.updateResource(resourceId, { name: 'renamed.md' });

      expect(receivedEvents.map((e) => e.mutation)).toEqual([
        RepositoryResourceMutationType.Created,
        RepositoryResourceMutationType.Moved,
      ]);
    } finally {
      (eventBus as any).off(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);
    }
  });

  it('deletes a resource and emits Deleted event', async () => {
    const { service, repository, tempDir } = await createTestEnv();
    const receivedEvents: RepositoryResourceMutatedEvent[] = [];
    const handler = (event: RepositoryResourceMutatedEvent) => receivedEvents.push(event);
    (eventBus as any).on(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);

    try {
      const created = await service.createResource({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        name: 'note.md',
        type: 'File',
        content: '# Hello',
      });
      if (!created.ok) throw new Error('Expected created resource');
      const resourceId = (created.data as any).id;

      const deleted = await service.deleteResource(resourceId);
      expect(deleted.ok).toBe(true);

      expect(receivedEvents.map((e) => e.mutation)).toEqual([
        RepositoryResourceMutationType.Created,
        RepositoryResourceMutationType.Deleted,
      ]);

      await expect(
        fs.promises.stat(path.join(tempDir, String(repository.id), 'note.md')),
      ).rejects.toThrow();
    } finally {
      (eventBus as any).off(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);
    }
  });

  it('uploadResource creates a new file and emits Created event', async () => {
    const { service, repository, tempDir } = await createTestEnv();

    const result = await service.uploadResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      type: ResourceType.File,
      file: {
        name: 'note.md',
        mimeType: 'text/markdown',
        contentBase64: Buffer.from('# Hello', 'utf8').toString('base64'),
      },
      metadata: { tags: ['test'] },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected success');
    expect(result.data.resource.path).toBe('/note.md');

    await expect(
      fs.promises.readFile(path.join(tempDir, String(repository.id), 'note.md'), 'utf8'),
    ).resolves.toBe('# Hello');
  });

  it('uploadResource replaces existing file when overwrite is true', async () => {
    const { service, resourceRepository, repository, tempDir } = await createTestEnv();

    await service.uploadResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      type: ResourceType.File,
      file: {
        name: 'note.md',
        mimeType: 'text/markdown',
        contentBase64: Buffer.from('old content', 'utf8').toString('base64'),
      },
    });

    const result = await service.uploadResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      type: ResourceType.File,
      file: {
        name: 'note.md',
        mimeType: 'text/markdown',
        contentBase64: Buffer.from('new content', 'utf8').toString('base64'),
      },
      metadata: { overwritePolicy: 'replace' } as any,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected success');

    await expect(
      fs.promises.readFile(path.join(tempDir, String(repository.id), 'note.md'), 'utf8'),
    ).resolves.toBe('new content');

    const resources = await resourceRepository.findByRepositoryId(String(repository.id));
    expect(resources).toHaveLength(1);
  });

  it('uploadResource returns CONFLICT when overwrite is false and file exists', async () => {
    const { service, repository } = await createTestEnv();

    await service.uploadResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      type: ResourceType.File,
      file: {
        name: 'note.md',
        mimeType: 'text/markdown',
        contentBase64: Buffer.from('existing', 'utf8').toString('base64'),
      },
    });

    const result = await service.uploadResource({
      repositoryId: String(repository.id),
      identityId: 'user-1',
      type: ResourceType.File,
      file: {
        name: 'note.md',
        mimeType: 'text/markdown',
        contentBase64: Buffer.from('new', 'utf8').toString('base64'),
      },
      metadata: { overwritePolicy: 'skip' } as any,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected failure');
    expect(result.error.code).toBe('CONFLICT');
  });
});
