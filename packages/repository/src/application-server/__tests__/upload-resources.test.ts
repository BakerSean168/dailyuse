import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { UploadResourcesUseCase } from '../use-cases/commands/upload-resources.use-case';
import { CreateResourceUseCase } from '../use-cases/commands/create-resource.use-case';
import { DeleteResourceUseCase } from '../use-cases/commands/delete-resource.use-case';
import { FsStorageAdapter } from '../../infrastructure-server/adapters/fs/fs-storage.adapter';
import { ResourceMemoryRepository } from '../../infrastructure-server/adapters/memory/resource-memory.repository';
import { RepositoryMemoryRepository } from '../../infrastructure-server/adapters/memory/repository-memory.repository';
import { FolderMemoryRepository } from '../../infrastructure-server/adapters/memory/folder-memory.repository';
import { Repository } from '../../domain-server/aggregates/repository';

describe('UploadResources', () => {
  it('writes markdown and binary files without corruption', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repository-upload-'));
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

      const createResource = new CreateResourceUseCase(resourceRepository, repositoryRepository, storage);
      const deleteResource = new DeleteResourceUseCase(resourceRepository, repositoryRepository, storage);
      const uploadResources = new UploadResourcesUseCase(
        createResource,
        deleteResource,
        resourceRepository,
        repositoryRepository,
        folderRepository,
      );

      const pngBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
      const pdfBytes = Uint8Array.from([37, 80, 68, 70, 45, 49, 46, 55]);

      const result = await uploadResources.execute({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        files: [
          {
            name: 'note.md',
            mimeType: 'text/markdown',
            contentBase64: Buffer.from('# Hello\nworld', 'utf8').toString('base64'),
          },
          {
            name: 'image.png',
            mimeType: 'image/png',
            contentBase64: Buffer.from(pngBytes).toString('base64'),
          },
          {
            name: 'doc.pdf',
            mimeType: 'application/pdf',
            contentBase64: Buffer.from(pdfBytes).toString('base64'),
          },
        ],
        metadata: { tags: ['imported'] },
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected upload success');

      expect(result.data.failures).toHaveLength(0);
      expect(result.data.successes).toHaveLength(3);
      expect(
        await fs.promises.readFile(path.join(tempDir, String(repository.id), 'note.md'), 'utf8'),
      ).toBe('# Hello\nworld');
      expect(
        new Uint8Array(
          await fs.promises.readFile(
            path.join(tempDir, String(repository.id), 'images', 'image.png'),
          ),
        ),
      ).toEqual(pngBytes);
      expect(
        new Uint8Array(
          await fs.promises.readFile(path.join(tempDir, String(repository.id), 'doc.pdf')),
        ),
      ).toEqual(pdfBytes);
      expect(result.data.successes[1]?.resource.path).toBe('/images/image.png');
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('replaces existing files through the unified delete path before uploading', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repository-upload-replace-'));
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

      const createResource = new CreateResourceUseCase(resourceRepository, repositoryRepository, storage);
      const deleteResource = new DeleteResourceUseCase(resourceRepository, repositoryRepository, storage);
      const uploadResources = new UploadResourcesUseCase(
        createResource,
        deleteResource,
        resourceRepository,
        repositoryRepository,
        folderRepository,
      );

      const created = await createResource.execute({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        name: 'note.md',
        type: 'File' as any,
        path: '/note.md',
        content: 'old',
      });
      expect(created.ok).toBe(true);

      const result = await uploadResources.execute({
        repositoryId: String(repository.id),
        identityId: 'user-1',
        files: [
          {
            name: 'note.md',
            mimeType: 'text/markdown',
            contentBase64: Buffer.from('new content', 'utf8').toString('base64'),
          },
        ],
        metadata: { overwritePolicy: 'replace' } as any,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected upload success');

      expect(result.data.failures).toHaveLength(0);
      expect(result.data.successes).toHaveLength(1);
      expect(
        await fs.promises.readFile(path.join(tempDir, String(repository.id), 'note.md'), 'utf8'),
      ).toBe('new content');

      const resources = await resourceRepository.findByRepositoryId(String(repository.id));
      expect(resources).toHaveLength(1);

      const updatedRepository = await repositoryRepository.findById(String(repository.id));
      expect(updatedRepository?.stats.resourceCount).toBe(1);
      expect(updatedRepository?.stats.totalSize).toBe(Buffer.byteLength('new content', 'utf8'));
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
