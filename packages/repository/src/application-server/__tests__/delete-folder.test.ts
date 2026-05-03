import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DeleteFolderUseCase } from '../use-cases/commands/delete-folder.use-case';
import { FsStorageAdapter } from '../../infrastructure-server/adapters/fs/fs-storage.adapter';
import { ResourceMemoryRepository } from '../../infrastructure-server/adapters/memory/resource-memory.repository';
import { RepositoryMemoryRepository } from '../../infrastructure-server/adapters/memory/repository-memory.repository';
import { FolderMemoryRepository } from '../../infrastructure-server/adapters/memory/folder-memory.repository';
import { Repository } from '../../domain-server/aggregates/repository';
import { Folder } from '../../domain-server/entities/folder';
import { Resource } from '../../domain-server/entities/resource';
import { ResourceType } from '@dailyuse/contracts/repository';

describe('DeleteFolder', () => {
  it('hard-deletes nested resources and folders while updating repository stats', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repository-delete-folder-'));

    try {
      const storage = new FsStorageAdapter(tempDir);
      const resourceRepository = new ResourceMemoryRepository();
      const repositoryRepository = new RepositoryMemoryRepository();
      const folderRepository = new FolderMemoryRepository();
      const repository = Repository.create({
        identityId: 'user-1' as any,
        name: 'Repo',
        type: 'personal' as any,
        path: '/repo',
      });
      await repositoryRepository.save(repository);

      const rootFolder = Folder.create({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        name: 'articles',
      });
      const childFolder = Folder.create({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        parentId: String(rootFolder.id),
        parentPath: rootFolder.path,
        name: 'drafts',
      });
      await folderRepository.save(rootFolder);
      await folderRepository.save(childFolder);
      await storage.write({
        repositoryId: String(repository.id),
        path: rootFolder.path,
        isFolder: true,
      });
      await storage.write({
        repositoryId: String(repository.id),
        path: childFolder.path,
        isFolder: true,
      });

      repository.recordFolderAdded();
      repository.recordFolderAdded();
      await repositoryRepository.save(repository);

      const resourceOne = Resource.create({
        repositoryId: repository.id,
        identityId: 'user-1',
        folderId: rootFolder.id as any,
        name: 'guide.md',
        type: ResourceType.File,
        path: `${rootFolder.path}/guide.md`,
        content: '# Guide',
        size: Buffer.byteLength('# Guide', 'utf8'),
      });
      const resourceTwo = Resource.create({
        repositoryId: repository.id,
        identityId: 'user-1',
        folderId: childFolder.id as any,
        name: 'draft.md',
        type: ResourceType.File,
        path: `${childFolder.path}/draft.md`,
        content: '# Draft',
        size: Buffer.byteLength('# Draft', 'utf8'),
      });
      await resourceRepository.save(resourceOne);
      await resourceRepository.save(resourceTwo);
      await storage.write({
        repositoryId: String(repository.id),
        path: resourceOne.path,
        content: resourceOne.content ?? '',
        isFolder: false,
      });
      await storage.write({
        repositoryId: String(repository.id),
        path: resourceTwo.path,
        content: resourceTwo.content ?? '',
        isFolder: false,
      });
      repository.recordResourceAdded(resourceOne.size ?? 0);
      repository.recordResourceAdded(resourceTwo.size ?? 0);
      await repositoryRepository.save(repository);

      const deleteFolder = new DeleteFolderUseCase(
        folderRepository,
        resourceRepository,
        repositoryRepository,
        storage,
      );

      const result = await deleteFolder.execute({ id: String(rootFolder.id) });
      expect(result.ok).toBe(true);

      await expect(
        fs.promises.stat(path.join(tempDir, String(repository.id), 'articles')),
      ).rejects.toThrow();
      expect(await folderRepository.findById(String(rootFolder.id))).toBeNull();
      expect(await folderRepository.findById(String(childFolder.id))).toBeNull();
      expect(await resourceRepository.findById(String(resourceOne.id))).toBeNull();
      expect(await resourceRepository.findById(String(resourceTwo.id))).toBeNull();

      const updatedRepository = await repositoryRepository.findById(String(repository.id));
      expect(updatedRepository?.stats.folderCount).toBe(0);
      expect(updatedRepository?.stats.resourceCount).toBe(0);
      expect(updatedRepository?.stats.totalSize).toBe(0);
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
