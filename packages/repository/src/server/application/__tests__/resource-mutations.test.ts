import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Repository } from '../../domain/aggregates/repository';
import { Folder } from '../../domain/entities/folder';
import { CreateRepositoryUseCase } from '../use-cases/commands/create-repository.use-case';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  REPOSITORY_RESOURCE_MUTATED_EVENT,
  RepositoryResourceMutationType,
  type RepositoryResourceMutatedEvent,
} from '@dailyuse/contracts/repository';
import { eventBus } from '@dailyuse/utils/domain';
import {
  createRepositoryMemoryTestRepositories,
  createRepositoryModuleForTests,
} from '../../../testing';

describe('Repository resource mutations', () => {
  it('renames a resource in both storage and metadata', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repository-rename-'));

    try {
      const { resourceRepository, repositoryRepository, module } =
        createRepositoryModuleForTests({ tempDir });

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
      const { storagePort: storage, resourceRepository, repositoryRepository, folderRepository, module } =
        createRepositoryModuleForTests({ tempDir });

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

  it('returns the existing repository when createRepository is called again for the same user', async () => {
    const { repositoryRepository } = createRepositoryMemoryTestRepositories();
    const createRepository = new CreateRepositoryUseCase(repositoryRepository);

    const first = await createRepository.execute({
      identityId: String(IdentityId.generate()),
      name: 'Personal Knowledge Base',
      type: 'Markdown' as any,
      path: '/repo-1',
    });

    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('Expected first create success');

    const second = await createRepository.execute({
      identityId: first.data.repository.identityId,
      name: 'Another Repository',
      type: 'Mixed' as any,
      path: '/repo-2',
    });

    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error('Expected second create success');

    expect(second.data.repository.id).toBe(first.data.repository.id);
    expect(second.data.repository.name).toBe(first.data.repository.name);

    const repositories = await repositoryRepository.findByIdentityId(first.data.repository.identityId);
    expect(repositories).toHaveLength(1);
  });

  it('creates a canonical repository when current repository is requested for a new user', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repo-bootstrap-'));

    try {
      const { module } = createRepositoryModuleForTests({ tempDir });

      const identityId = String(IdentityId.generate());
      const result = await module.api.getCurrentRepository({ identityId } as any);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error('Expected current repository result');
      }

      expect(result.data).toEqual(
        expect.objectContaining({
          identityId,
          name: 'Knowledge Base',
          type: 'Markdown',
        }),
      );
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('does not auto-create a canonical repository when disabled', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repo-no-bootstrap-'));

    try {
      const { module } = createRepositoryModuleForTests({
        tempDir,
        autoCreateCanonicalRepository: false,
      });

      const identityId = String(IdentityId.generate());
      const result = await module.api.getCurrentRepository({ identityId } as any);

      expect(result.ok).toBe(false);
      if (result.ok) {
        throw new Error('Expected repository lookup to remain empty');
      }

      expect(result.error.code).toBe('NOT_FOUND');
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('hydrates binary content as base64 when loading a resource by id', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repo-read-binary-'));

    try {
      const { repositoryRepository, module } =
        createRepositoryModuleForTests({ tempDir });

      const repository = Repository.create({
        identityId: 'user-1' as any,
        name: 'Repo',
        type: 'personal' as any,
        path: '/repo',
      });
      await repositoryRepository.save(repository);

      const binaryBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
      const created = await module.api.uploadResources(
        {
          repositoryId: String(repository.id),
          files: [
            {
              name: 'image.png',
              mimeType: 'image/png',
              contentBase64: Buffer.from(binaryBytes).toString('base64'),
            },
          ],
        },
        { identityId: 'user-1' } as any,
      );

      expect(created.ok).toBe(true);
      if (!created.ok) {
        throw new Error('Expected binary upload result');
      }

      const resourceId = (created.data as { successes: Array<{ resource: { id: string } }> }).successes[0]
        ?.resource.id;
      expect(resourceId).toBeTruthy();

      const loaded = await module.api.getResource(resourceId!);
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) {
        throw new Error('Expected hydrated binary resource');
      }

      expect(loaded.data).toEqual(
        expect.objectContaining({
          mimeType: 'image/png',
          path: '/images/image.png',
          content: Buffer.from(binaryBytes).toString('base64'),
        }),
      );
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('lists resources as a public array from the module api', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repo-list-public-'));

    try {
      const { repositoryRepository, module } =
        createRepositoryModuleForTests({ tempDir });

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

      const listed = await module.api.listResources(String(repository.id));

      expect(listed.ok).toBe(true);
      if (!listed.ok) {
        throw new Error('Expected list resources result');
      }

      expect(Array.isArray(listed.data)).toBe(true);
      expect(listed.data).toEqual([
        expect.objectContaining({
          name: 'note.md',
          path: '/note.md',
        }),
      ]);
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('emits repository resource mutation events for create, content update, move, and delete', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'repo-events-'));
    const receivedEvents: RepositoryResourceMutatedEvent[] = [];
    const handler = (event: RepositoryResourceMutatedEvent) => {
      receivedEvents.push(event);
    };
    eventBus.on(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);

    try {
      const { storagePort: storage, repositoryRepository, folderRepository, module } =
        createRepositoryModuleForTests({ tempDir });

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
      if (!created.ok) {
        throw new Error('Expected created resource');
      }
      const resourceId = (created.data as { id: string }).id;

      await module.api.updateResource(resourceId, { content: '# Updated' });
      await module.api.moveResource(resourceId, String(folder.id));
      await module.api.deleteResource(resourceId);

      expect(receivedEvents.map((event) => event.mutation)).toEqual([
        RepositoryResourceMutationType.Created,
        RepositoryResourceMutationType.ContentUpdated,
        RepositoryResourceMutationType.Moved,
        RepositoryResourceMutationType.Deleted,
      ]);
      expect(receivedEvents.every((event) => event.resourceId === resourceId)).toBe(true);
    } finally {
      eventBus.off(REPOSITORY_RESOURCE_MUTATED_EVENT, handler);
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
