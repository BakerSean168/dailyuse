import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CreateResourceUseCase } from '../use-cases/commands/create-resource.use-case';
import { DeleteResourceUseCase } from '../use-cases/commands/delete-resource.use-case';
import { FsStorageAdapter } from '../../infrastructure-server/adapters/fs/fs-storage.adapter';
import { ResourceMemoryRepository } from '../../infrastructure-server/adapters/memory/resource-memory.repository';
import { RepositoryMemoryRepository } from '../../infrastructure-server/adapters/memory/repository-memory.repository';
import { Repository } from '../../domain-server/aggregates/repository';

describe('DeleteResource', () => {
  it('removes storage, hard-deletes the resource, and updates repository stats', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repository-delete-'));

    try {
      const storage = new FsStorageAdapter(tempDir);
      const resourceRepository = new ResourceMemoryRepository();
      const repositoryRepository = new RepositoryMemoryRepository();
      const repository = Repository.create({
        identityId: 'user-1' as any,
        name: 'Repo',
        type: 'personal' as any,
        path: '/repo',
      });
      await repositoryRepository.save(repository);

      const createResource = new CreateResourceUseCase(resourceRepository, repositoryRepository, storage);
      const deleteResource = new DeleteResourceUseCase(resourceRepository, repositoryRepository, storage);

      const created = await createResource.execute({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        name: 'note.md',
        type: 'File' as any,
        path: '/note.md',
        content: '# Hello',
      });

      expect(created.ok).toBe(true);
      if (!created.ok) throw new Error('Expected create success');

      const storedFilePath = path.join(tempDir, String(repository.id), 'note.md');
      expect(await fs.promises.readFile(storedFilePath, 'utf8')).toBe('# Hello');

      const deleteResult = await deleteResource.execute({ id: created.data.resource.id });
      expect(deleteResult.ok).toBe(true);

      await expect(fs.promises.stat(storedFilePath)).rejects.toThrow();

      const deletedResource = await resourceRepository.findById(created.data.resource.id);
      expect(deletedResource).toBeNull();

      const updatedRepository = await repositoryRepository.findById(String(repository.id));
      expect(updatedRepository).not.toBeNull();
      expect(updatedRepository?.stats.resourceCount).toBe(0);
      expect(updatedRepository?.stats.totalSize).toBe(0);
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
