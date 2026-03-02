/**
 * Integration tests for TaskTemplatePrismaRepository
 *
 * Tests the full round-trip: Domain aggregate → Prisma persistence → Domain reconstitution.
 * Runs against a real PostgreSQL database (Docker, port 5433).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TaskTemplatePrismaRepository } from '@/infrastructure-server/adapters/prisma/task-template-prisma.repository';
import { TaskTemplate } from '@/domain-server/aggregates/task-template';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared';
import {
  TaskTemplateId,
  TaskFolderId,
  TaskTimeConfig,
  RecurrenceRule,
  TaskTemplateStatus,
} from '@dailyuse/task/domain-shared';
import {
  getPrisma,
  cleanTaskTables,
  seedAccount,
  seedFolder,
  seedTemplateRaw,
} from '@/__tests__/integration-helpers';

describe('TaskTemplatePrismaRepository', () => {
  let repo: TaskTemplatePrismaRepository;
  let identityId: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    repo = new TaskTemplatePrismaRepository(prisma);
    // Seed a shared account for the entire suite
    identityId = await seedAccount();
  });

  beforeEach(async () => {
    // Clean task-related tables (but keep account intact)
    const prisma = getPrisma();
    await prisma.taskDependency.deleteMany();
    await prisma.taskInstance.deleteMany();
    await prisma.taskTemplate.deleteMany();
    await prisma.taskFolder.deleteMany();
  });

  afterAll(async () => {
    await cleanTaskTables();
  });

  // ─── save + findById (round-trip) ────────────────────────────────

  describe('save + findById (round-trip)', () => {
    it('should persist and reconstitute a one-time task template', async () => {
      const template = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Buy groceries',
        description: 'Milk, eggs, bread',
        importance: ImportanceLevel.Important,
        tags: ['shopping', 'errands'],
        color: '#FF5733',
      });
      // drain domain events so save() doesn't try to publish
      template.clearDomainEvents();

      await repo.save(template);

      const found = await repo.findById(template.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(template.id);

      const dto = found!.toServerDTO();
      expect(dto.name).toBe('Buy groceries');
      expect(dto.description).toBe('Milk, eggs, bread');
      expect(dto.importance).toBe(ImportanceLevel.Important);
      expect(dto.tags).toEqual(['shopping', 'errands']);
      expect(dto.color).toBe('#FF5733');
      expect(dto.status).toBe('Active');
      expect(dto.folderId).toBeNull();
      expect(dto.recurrenceRule).toBeNull();
    });

    it('should persist and reconstitute a recurring task template', async () => {
      const timeConfig = TaskTimeConfig.createAllDay(new Date('2025-01-01'));
      const recurrenceRule = RecurrenceRule.createDaily(1);

      const template = TaskTemplate.createRecurringTask({
        identityId: IdentityId.of(identityId),
        title: 'Daily standup',
        description: 'Morning sync meeting',
        importance: ImportanceLevel.Moderate,
        timeConfig,
        recurrenceRule,
        tags: ['work'],
      });
      template.clearDomainEvents();

      await repo.save(template);

      const found = await repo.findById(template.id);
      expect(found).not.toBeNull();

      const dto = found!.toServerDTO();
      expect(dto.name).toBe('Daily standup');
      expect(dto.recurrenceRule).not.toBeNull();
      expect(dto.recurrenceRule!.frequency).toBe('Daily');
      expect(dto.recurrenceRule!.interval).toBe(1);
      expect(dto.timeConfig).not.toBeNull();
    });

    it('should handle update (upsert) correctly', async () => {
      const template = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Original title',
        importance: ImportanceLevel.Minor,
      });
      template.clearDomainEvents();

      await repo.save(template);

      // Mutate and re-save
      template.updateTitle('Updated title');
      template.updatePriority(ImportanceLevel.Vital);
      template.clearDomainEvents();
      await repo.save(template);

      const found = await repo.findById(template.id);
      const dto = found!.toServerDTO();
      expect(dto.name).toBe('Updated title');
      expect(dto.importance).toBe(ImportanceLevel.Vital);
    });

    it('should persist a template with a folder', async () => {
      const folder = await seedFolder({ identityId, name: 'Work' });

      const template = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Folder task',
        importance: ImportanceLevel.Moderate,
        folderId: TaskFolderId.of(folder.id),
      });
      template.clearDomainEvents();

      await repo.save(template);

      const found = await repo.findById(template.id);
      expect(found!.toServerDTO().folderId).toBe(folder.id);
    });
  });

  // ─── Query Methods ───────────────────────────────────────────────

  describe('findByIdentityId', () => {
    it('should return all non-deleted templates for the identity', async () => {
      const t1 = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Task 1',
        importance: ImportanceLevel.Moderate,
      });
      const t2 = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Task 2',
        importance: ImportanceLevel.Important,
      });
      t1.clearDomainEvents();
      t2.clearDomainEvents();

      await repo.save(t1);
      await repo.save(t2);

      const results = await repo.findByIdentityId(identityId);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toContain(t1.id);
      expect(results.map((r) => r.id)).toContain(t2.id);
    });

    it('should exclude soft-deleted templates', async () => {
      const t = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'To delete',
        importance: ImportanceLevel.Moderate,
      });
      t.clearDomainEvents();
      await repo.save(t);
      await repo.softDelete(t.id);

      const results = await repo.findByIdentityId(identityId);
      expect(results).toHaveLength(0);
    });
  });

  describe('findByStatus', () => {
    it('should return templates matching the given status', async () => {
      const t1 = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Active task',
        importance: ImportanceLevel.Moderate,
      });
      const t2 = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Task to pause',
        importance: ImportanceLevel.Moderate,
      });
      t1.clearDomainEvents();
      t2.clearDomainEvents();
      await repo.save(t1);
      await repo.save(t2);

      // Pause t2
      t2.pause();
      t2.clearDomainEvents();
      await repo.save(t2);

      const active = await repo.findByStatus(identityId, 'Active' as any);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(t1.id);
    });
  });

  describe('findActiveTemplates', () => {
    it('should return only active non-deleted templates', async () => {
      const t1 = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Active one',
        importance: ImportanceLevel.Moderate,
      });
      t1.clearDomainEvents();
      await repo.save(t1);

      const results = await repo.findActiveTemplates(identityId);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((r) => r.toServerDTO().status === 'Active')).toBe(true);
    });
  });

  describe('findByFolderId', () => {
    it('should return templates in the given folder', async () => {
      const folder = await seedFolder({ identityId, name: 'Folder A' });
      const tInFolder = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'In folder',
        importance: ImportanceLevel.Moderate,
        folderId: TaskFolderId.of(folder.id),
      });
      const tNoFolder = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'No folder',
        importance: ImportanceLevel.Moderate,
      });
      tInFolder.clearDomainEvents();
      tNoFolder.clearDomainEvents();
      await repo.save(tInFolder);
      await repo.save(tNoFolder);

      const results = await repo.findByFolderId(folder.id);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(tInFolder.id);
    });
  });

  describe('findByTags', () => {
    it('should return templates matching any of the given tags', async () => {
      const t1 = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Tagged',
        importance: ImportanceLevel.Moderate,
        tags: ['urgent', 'work'],
      });
      const t2 = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'No tags',
        importance: ImportanceLevel.Moderate,
      });
      t1.clearDomainEvents();
      t2.clearDomainEvents();
      await repo.save(t1);
      await repo.save(t2);

      const results = await repo.findByTags(identityId, ['urgent']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(t1.id);
    });
  });

  describe('findOneTimeTasks / findRecurringTasks', () => {
    it('should separate one-time from recurring tasks', async () => {
      const oneTime = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'One-time',
        importance: ImportanceLevel.Moderate,
      });
      const recurring = TaskTemplate.createRecurringTask({
        identityId: IdentityId.of(identityId),
        title: 'Recurring',
        importance: ImportanceLevel.Moderate,
        timeConfig: TaskTimeConfig.createAllDay(new Date()),
        recurrenceRule: RecurrenceRule.createDaily(1),
      });
      oneTime.clearDomainEvents();
      recurring.clearDomainEvents();
      await repo.save(oneTime);
      await repo.save(recurring);

      const oneTimeResults = await repo.findOneTimeTasks(identityId);
      const recurringResults = await repo.findRecurringTasks(identityId);

      expect(oneTimeResults).toHaveLength(1);
      expect(oneTimeResults[0].id).toBe(oneTime.id);
      expect(recurringResults).toHaveLength(1);
      expect(recurringResults[0].id).toBe(recurring.id);
    });

    it('should respect filters (status, folderId, limit, offset)', async () => {
      for (let i = 0; i < 5; i++) {
        const t = TaskTemplate.createOneTimeTask({
          identityId: IdentityId.of(identityId),
          title: `Task ${i}`,
          importance: ImportanceLevel.Moderate,
        });
        t.clearDomainEvents();
        await repo.save(t);
      }

      const limited = await repo.findOneTimeTasks(identityId, { limit: 3 });
      expect(limited).toHaveLength(3);

      const offset = await repo.findOneTimeTasks(identityId, { limit: 3, offset: 3 });
      expect(offset).toHaveLength(2);
    });
  });

  describe('findSubtasks', () => {
    it('should return children of a parent task', async () => {
      const parent = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'Parent',
        importance: ImportanceLevel.Moderate,
      });
      parent.clearDomainEvents();
      await repo.save(parent);

      // Raw seed a child with parentTaskId
      await seedTemplateRaw({
        identityId,
        name: 'Child 1',
        parentTaskId: parent.id,
      });
      await seedTemplateRaw({
        identityId,
        name: 'Child 2',
        parentTaskId: parent.id,
      });

      const subtasks = await repo.findSubtasks(parent.id);
      expect(subtasks).toHaveLength(2);
    });
  });

  // ─── Delete Operations ───────────────────────────────────────────

  describe('delete / softDelete / restore', () => {
    it('should hard-delete a template', async () => {
      const t = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'To hard-delete',
        importance: ImportanceLevel.Moderate,
      });
      t.clearDomainEvents();
      await repo.save(t);

      await repo.delete(t.id);

      const found = await repo.findById(t.id);
      expect(found).toBeNull();
    });

    it('should soft-delete and restore a template', async () => {
      const t = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'To soft-delete',
        importance: ImportanceLevel.Moderate,
      });
      t.clearDomainEvents();
      await repo.save(t);

      await repo.softDelete(t.id);

      // soft-deleted templates excluded from list queries
      const list = await repo.findByIdentityId(identityId);
      expect(list.find((r) => r.id === t.id)).toBeUndefined();

      // but findById still returns it (it queries by PK, no deletedAt filter)
      const found = await repo.findById(t.id);
      expect(found).not.toBeNull();
      expect(found!.toServerDTO().deletedAt).not.toBeNull();

      // restore
      await repo.restore(t.id);
      const restored = await repo.findById(t.id);
      expect(restored!.toServerDTO().deletedAt).toBeNull();
    });
  });

  // ─── Batch Operations ────────────────────────────────────────────

  describe('saveBatch / deleteBatch', () => {
    it('should persist multiple templates in a transaction', async () => {
      const templates = Array.from({ length: 3 }, (_, i) => {
        const t = TaskTemplate.createOneTimeTask({
          identityId: IdentityId.of(identityId),
          title: `Batch task ${i}`,
          importance: ImportanceLevel.Moderate,
        });
        t.clearDomainEvents();
        return t;
      });

      await repo.saveBatch(templates);

      for (const t of templates) {
        const found = await repo.findById(t.id);
        expect(found).not.toBeNull();
      }
    });

    it('should delete multiple templates by id', async () => {
      const templates = Array.from({ length: 3 }, (_, i) => {
        const t = TaskTemplate.createOneTimeTask({
          identityId: IdentityId.of(identityId),
          title: `To batch delete ${i}`,
          importance: ImportanceLevel.Moderate,
        });
        t.clearDomainEvents();
        return t;
      });
      await repo.saveBatch(templates);

      await repo.deleteBatch(templates.map((t) => t.id));

      for (const t of templates) {
        expect(await repo.findById(t.id)).toBeNull();
      }
    });
  });

  // ─── countTasks ──────────────────────────────────────────────────

  describe('countTasks', () => {
    it('should count non-deleted templates for the identity', async () => {
      for (let i = 0; i < 4; i++) {
        const t = TaskTemplate.createOneTimeTask({
          identityId: IdentityId.of(identityId),
          title: `Count task ${i}`,
          importance: ImportanceLevel.Moderate,
        });
        t.clearDomainEvents();
        await repo.save(t);
      }

      const count = await repo.countTasks(identityId);
      expect(count).toBe(4);
    });
  });

  // ─── findNeedGenerateInstances ───────────────────────────────────

  describe('findNeedGenerateInstances', () => {
    it('should find active recurring templates needing instance generation', async () => {
      const recurring = TaskTemplate.createRecurringTask({
        identityId: IdentityId.of(identityId),
        title: 'Needs generation',
        importance: ImportanceLevel.Moderate,
        timeConfig: TaskTimeConfig.createAllDay(new Date()),
        recurrenceRule: RecurrenceRule.createDaily(1),
      });
      recurring.clearDomainEvents();
      await repo.save(recurring);

      // Also save a one-time task (should NOT appear)
      const oneTime = TaskTemplate.createOneTimeTask({
        identityId: IdentityId.of(identityId),
        title: 'One-time',
        importance: ImportanceLevel.Moderate,
      });
      oneTime.clearDomainEvents();
      await repo.save(oneTime);

      const futureDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const results = await repo.findNeedGenerateInstances(futureDate);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.find((r) => r.id === recurring.id)).toBeDefined();
      expect(results.find((r) => r.id === oneTime.id)).toBeUndefined();
    });
  });

  // ─── findBlockedTasks ────────────────────────────────────────────

  describe('findBlockedTasks', () => {
    it('should return only blocked templates', async () => {
      // Seed directly to set isBlocked = true
      const blocked = await seedTemplateRaw({
        identityId,
        name: 'Blocked task',
      });
      await getPrisma().taskTemplate.update({
        where: { id: blocked.id },
        data: { isBlocked: true, blockingReason: 'Waiting on dependency' },
      });

      const unblocked = await seedTemplateRaw({
        identityId,
        name: 'Free task',
      });

      const results = await repo.findBlockedTasks(identityId);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(blocked.id);
    });
  });

  // ─── findSortedByPriority ────────────────────────────────────────

  describe('findSortedByPriority', () => {
    it('should return active templates sorted by importance with limit', async () => {
      for (const imp of ['Vital', 'Trivial', 'Important'] as ImportanceLevel[]) {
        const t = TaskTemplate.createOneTimeTask({
          identityId: IdentityId.of(identityId),
          title: `${imp} task`,
          importance: imp,
        });
        t.clearDomainEvents();
        await repo.save(t);
      }

      const results = await repo.findSortedByPriority(identityId, 2);
      expect(results).toHaveLength(2);
    });
  });
});
