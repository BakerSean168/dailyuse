import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FsStorageAdapter } from '../../infrastructure-server/adapters/fs/fs-storage.adapter';
import { ResourceMemoryRepository } from '../../infrastructure-server/adapters/memory/resource-memory.repository';
import { RepositoryMemoryRepository } from '../../infrastructure-server/adapters/memory/repository-memory.repository';
import { FolderMemoryRepository } from '../../infrastructure-server/adapters/memory/folder-memory.repository';
import { ResourceBookmarkMemoryRepository } from '../../infrastructure-server/adapters/memory/resource-bookmark-memory.repository';
import { createRepositoryModule } from '../../infrastructure-server/repository.module';
import { Repository } from '../../domain-server/aggregates/repository';
import { Folder } from '../../domain-server/entities/folder';

describe('Repository resource mutations', () => {
  it('renames a resource in both storage and metadata', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repository-rename-'));

    try {
      const storage = new FsStorageAdapter(tempDir);
      const resourceRepository = new ResourceMemoryRepository();
      const repositoryRepository = new RepositoryMemoryRepository();
      const folderRepository = new FolderMemoryRepository();
      const module = createRepositoryModule({
        repositoryRepository,
        resourceRepository,
        folderRepository,
        resourceBookmarkRepository: new ResourceBookmarkMemoryRepository(),
        storagePort: storage,
      });

      const repository = Repository.create({
        identityId: 'user-1' as any,
        name: 'Repo',
        type: 'personal' as any,
        path: '/repo',
      });
      await repositoryRepository.save(repository);

      const created = await module.api.createResource(
        {
          repositoryId: String(repository.id),
          name: 'note.md',
          type: 'File',
          content: '# Hello',
        },
        { identityId: 'user-1' } as any,
      );

      expect(created.ok).toBe(true);
      const createdResource = created.ok ? (created.data as { id: string }) : null;
      if (!createdResource) {
        throw new Error('Expected created resource');
      }

      const renamed = await module.api.updateResource(createdResource.id, { name: 'renamed.md' });
      expect(renamed.ok).toBe(true);

      const stored = await resourceRepository.findById(createdResource.id);
      expect(stored?.name).toBe('renamed.md');
      expect(stored?.path).toBe('/renamed.md');
      await expect(
        fs.promises.readFile(path.join(tempDir, String(repository.id), 'renamed.md'), 'utf8'),
      ).resolves.toBe('# Hello');
      await expect(
        fs.promises.stat(path.join(tempDir, String(repository.id), 'note.md')),
      ).rejects.toThrow();
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('moves a resource into the target folder in both storage and metadata', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repository-move-'));

    try {
      const storage = new FsStorageAdapter(tempDir);
      const resourceRepository = new ResourceMemoryRepository();
      const repositoryRepository = new RepositoryMemoryRepository();
      const folderRepository = new FolderMemoryRepository();
      const module = createRepositoryModule({
        repositoryRepository,
        resourceRepository,
        folderRepository,
        resourceBookmarkRepository: new ResourceBookmarkMemoryRepository(),
        storagePort: storage,
      });

      const repository = Repository.create({
        identityId: 'user-1' as any,
        name: 'Repo',
        type: 'personal' as any,
        path: '/repo',
      });
      await repositoryRepository.save(repository);

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

      const created = await module.api.createResource(
        {
          repositoryId: String(repository.id),
          name: 'note.md',
          type: 'File',
          content: '# Hello',
        },
        { identityId: 'user-1' } as any,
      );

      expect(created.ok).toBe(true);
      const createdResource = created.ok ? (created.data as { id: string }) : null;
      if (!createdResource) {
        throw new Error('Expected created resource');
      }

      const moved = await module.api.moveResource(createdResource.id, String(folder.id));
      expect(moved.ok).toBe(true);

      const stored = await resourceRepository.findById(createdResource.id);
      expect(stored?.folderId).toBe(String(folder.id));
      expect(stored?.path).toBe('/articles/note.md');
      await expect(
        fs.promises.readFile(
          path.join(tempDir, String(repository.id), 'articles', 'note.md'),
          'utf8',
        ),
      ).resolves.toBe('# Hello');
      await expect(
        fs.promises.stat(path.join(tempDir, String(repository.id), 'note.md')),
      ).rejects.toThrow();
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
