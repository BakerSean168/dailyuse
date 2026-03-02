/**
 * Integration tests for TaskFolderPrismaRepository
 *
 * Tests CRUD operations against real PostgreSQL.
 * Runs against a real PostgreSQL database (Docker, port 5433).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TaskFolderPrismaRepository } from '@/infrastructure-server/adapters/prisma/task-folder-prisma.repository';
import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';
import { getPrisma, cleanTaskTables, seedAccount } from '@/__tests__/integration-helpers';

describe('TaskFolderPrismaRepository', () => {
  let repo: TaskFolderPrismaRepository;
  let identityId: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    repo = new TaskFolderPrismaRepository(prisma);
    identityId = await seedAccount();
  });

  beforeEach(async () => {
    const prisma = getPrisma();
    await prisma.taskDependency.deleteMany();
    await prisma.taskInstance.deleteMany();
    await prisma.taskTemplate.deleteMany();
    await prisma.taskFolder.deleteMany();
  });

  afterAll(async () => {
    await cleanTaskTables();
  });

  function makeFolder(overrides: Partial<TaskFolderServerDTO> = {}): TaskFolderServerDTO {
    return {
      id: overrides.id ?? (`ITaskFolderId_${crypto.randomUUID()}` as any),
      identityId: overrides.identityId ?? (identityId as any),
      name: overrides.name ?? 'Test Folder',
      color: overrides.color ?? null,
      icon: overrides.icon ?? null,
      order: overrides.order ?? 0,
      version: overrides.version ?? 1,
      createdAt: overrides.createdAt ?? Date.now(),
      updatedAt: overrides.updatedAt ?? Date.now(),
      deletedAt: overrides.deletedAt ?? null,
    };
  }

  // ─── save + findById ─────────────────────────────────────────────

  describe('save + findById', () => {
    it('should create a folder and retrieve it by id', async () => {
      const folder = makeFolder({ name: 'Work', color: '#3B82F6', icon: 'briefcase' });
      await repo.save(folder);

      const found = await repo.findById(folder.id as string);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Work');
      expect(found!.color).toBe('#3B82F6');
      expect(found!.icon).toBe('briefcase');
      expect(found!.order).toBe(0);
      expect(found!.version).toBe(1);
    });

    it('should update an existing folder via upsert', async () => {
      const folder = makeFolder({ name: 'Original' });
      await repo.save(folder);

      // Update
      const updated = { ...folder, name: 'Renamed', color: '#EF4444', version: 2 };
      await repo.save(updated);

      const found = await repo.findById(folder.id as string);
      expect(found!.name).toBe('Renamed');
      expect(found!.color).toBe('#EF4444');
      expect(found!.version).toBe(2);
    });

    it('should return null for non-existent id', async () => {
      const found = await repo.findById('ITaskFolderId_non-existent');
      expect(found).toBeNull();
    });
  });

  // ─── findByIdentityId ────────────────────────────────────────────

  describe('findByIdentityId', () => {
    it('should return all non-deleted folders for the identity sorted by order', async () => {
      const f1 = makeFolder({ name: 'Folder C', order: 2 });
      const f2 = makeFolder({ name: 'Folder A', order: 0 });
      const f3 = makeFolder({ name: 'Folder B', order: 1 });
      await repo.save(f1);
      await repo.save(f2);
      await repo.save(f3);

      const results = await repo.findByIdentityId(identityId);
      expect(results).toHaveLength(3);
      // Should be sorted by order ASC
      expect(results[0].name).toBe('Folder A');
      expect(results[1].name).toBe('Folder B');
      expect(results[2].name).toBe('Folder C');
    });

    it('should exclude soft-deleted folders', async () => {
      const folder = makeFolder({ name: 'Deleted folder' });
      await repo.save(folder);

      // Soft-delete via raw Prisma
      await getPrisma().taskFolder.update({
        where: { id: folder.id as string },
        data: { deletedAt: new Date() },
      });

      const results = await repo.findByIdentityId(identityId);
      expect(results.find((f) => f.id === folder.id)).toBeUndefined();
    });

    it('should return empty for an identity with no folders', async () => {
      const otherId = await seedAccount();
      const results = await repo.findByIdentityId(otherId);
      expect(results).toHaveLength(0);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────

  describe('delete', () => {
    it('should hard-delete a folder', async () => {
      const folder = makeFolder({ name: 'To delete' });
      await repo.save(folder);

      await repo.delete(folder.id as string);

      const found = await repo.findById(folder.id as string);
      expect(found).toBeNull();
    });
  });

  // ─── exists ──────────────────────────────────────────────────────

  describe('exists', () => {
    it('should return true for existing folder', async () => {
      const folder = makeFolder({ name: 'Exists' });
      await repo.save(folder);

      expect(await repo.exists(folder.id as string)).toBe(true);
    });

    it('should return false for non-existent folder', async () => {
      expect(await repo.exists('ITaskFolderId_non-existent')).toBe(false);
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle folders with null optional fields', async () => {
      const folder = makeFolder({
        name: 'Minimal',
        color: null,
        icon: null,
      });
      await repo.save(folder);

      const found = await repo.findById(folder.id as string);
      expect(found!.color).toBeNull();
      expect(found!.icon).toBeNull();
    });

    it('should support multiple folders with same name (no unique constraint on name)', async () => {
      const f1 = makeFolder({ name: 'Duplicate Name', order: 0 });
      const f2 = makeFolder({ name: 'Duplicate Name', order: 1 });
      await repo.save(f1);
      await repo.save(f2);

      const results = await repo.findByIdentityId(identityId);
      expect(results.filter((f) => f.name === 'Duplicate Name')).toHaveLength(2);
    });
  });
});
