import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskFolderId } from '@/server/domain/value-objects';
import { TaskFolderPrismaRepository } from './task-folder-prisma.repository';
import {
  cleanTaskTables,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../__tests__/integration-helpers';

describe('TaskFolderPrismaRepository integration', () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanTaskTables();
  });

  it('persists and loads a folder by id', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskFolderPrismaRepository(prisma);
    const now = Date.now();
    const folder: TaskFolderServerDTO = {
      id: TaskFolderId.generate(),
      identityId,
      name: 'Inbox',
      color: '#111111',
      icon: 'inbox',
      order: 1,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await repository.save(folder);

    const saved = await repository.findById(folder.id);

    expect(saved).not.toBeNull();
    expect(saved?.identityId).toBe(identityId);
    expect(saved?.name).toBe('Inbox');
    expect(saved?.order).toBe(1);
  });

  it('lists folders by identity ordered by order then createdAt', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskFolderPrismaRepository(prisma);
    const baseTime = Date.now();

    await repository.save({
      id: TaskFolderId.generate(),
      identityId,
      name: 'Later',
      color: null,
      icon: null,
      order: 20,
      version: 1,
      createdAt: baseTime,
      updatedAt: baseTime,
      deletedAt: null,
    });

    await repository.save({
      id: TaskFolderId.generate(),
      identityId,
      name: 'Sooner',
      color: null,
      icon: null,
      order: 10,
      version: 1,
      createdAt: baseTime + 1,
      updatedAt: baseTime + 1,
      deletedAt: null,
    });

    const folders = await repository.findByIdentityId(identityId);

    expect(folders.map((folder) => folder.name)).toEqual(['Sooner', 'Later']);
  });
});
