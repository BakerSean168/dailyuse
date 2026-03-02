/**
 * Integration tests for TaskInstancePrismaRepository
 *
 * Tests the full round-trip: Domain aggregate → Prisma persistence → Domain reconstitution.
 * Runs against a real PostgreSQL database (Docker, port 5433).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TaskInstancePrismaRepository } from '@/infrastructure-server/adapters/prisma/task-instance-prisma.repository';
import { TaskInstance } from '@/domain-server/aggregates/task-instance';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskTemplateId, TaskInstanceId, TaskTimeConfig } from '@dailyuse/task/domain-shared';
import {
  getPrisma,
  cleanTaskTables,
  seedAccount,
  seedTemplateRaw,
  seedInstanceRaw,
} from '@/__tests__/integration-helpers';

describe('TaskInstancePrismaRepository', () => {
  let repo: TaskInstancePrismaRepository;
  let identityId: string;
  let templateId: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    repo = new TaskInstancePrismaRepository(prisma);
    identityId = await seedAccount();
  });

  beforeEach(async () => {
    const prisma = getPrisma();
    await prisma.taskInstance.deleteMany();
    await prisma.taskTemplate.deleteMany();
    // Create a fresh template for each test
    const tmpl = await seedTemplateRaw({ identityId, name: 'Instance Host' });
    templateId = tmpl.id;
  });

  afterAll(async () => {
    await cleanTaskTables();
  });

  // ─── save + findById (round-trip) ────────────────────────────────

  describe('save + findById', () => {
    it('should persist and reconstitute a task instance', async () => {
      const instanceDate = new Date('2025-06-15T09:00:00Z').getTime();
      const timeConfig = TaskTimeConfig.createAllDay(new Date('2025-06-15'));

      const instance = TaskInstance.create({
        templateId: TaskTemplateId.of(templateId),
        identityId: IdentityId.of(identityId),
        instanceDate,
        timeConfig,
        importance: ImportanceLevel.Important,
      });
      instance.clearDomainEvents();

      await repo.save(instance);

      const found = await repo.findById(instance.id);
      expect(found).not.toBeNull();

      const dto = found!.toServerDTO();
      expect(dto.id).toBe(instance.id);
      expect(dto.templateId).toBe(templateId);
      expect(dto.identityId).toBe(identityId);
      expect(dto.status).toBe('Pending');
      expect(dto.importance).toBe(ImportanceLevel.Important);
    });

    it('should handle update via upsert', async () => {
      const instance = TaskInstance.create({
        templateId: TaskTemplateId.of(templateId),
        identityId: IdentityId.of(identityId),
        instanceDate: Date.now(),
        timeConfig: TaskTimeConfig.createAllDay(new Date()),
        importance: ImportanceLevel.Moderate,
      });
      instance.clearDomainEvents();
      await repo.save(instance);

      // Start the instance
      instance.start();
      instance.clearDomainEvents();
      await repo.save(instance);

      const found = await repo.findById(instance.id);
      expect(found!.toServerDTO().status).toBe('InProgress');
      expect(found!.toServerDTO().actualStartTime).not.toBeNull();
    });
  });

  // ─── saveMany ────────────────────────────────────────────────────

  describe('saveMany', () => {
    it('should persist multiple instances in a transaction', async () => {
      const instances = Array.from({ length: 3 }, (_, i) => {
        const inst = TaskInstance.create({
          templateId: TaskTemplateId.of(templateId),
          identityId: IdentityId.of(identityId),
          instanceDate: new Date(2025, 5, 15 + i).getTime(),
          timeConfig: TaskTimeConfig.createAllDay(new Date(2025, 5, 15 + i)),
          importance: ImportanceLevel.Moderate,
        });
        inst.clearDomainEvents();
        return inst;
      });

      await repo.saveMany(instances);

      for (const inst of instances) {
        const found = await repo.findById(inst.id);
        expect(found).not.toBeNull();
      }
    });
  });

  // ─── Query Methods ───────────────────────────────────────────────

  describe('findByTemplateId', () => {
    it('should return all instances for a template', async () => {
      await seedInstanceRaw({ templateId, identityId });
      await seedInstanceRaw({ templateId, identityId });

      // Seed a different template
      const otherTmpl = await seedTemplateRaw({ identityId, name: 'Other' });
      await seedInstanceRaw({ templateId: otherTmpl.id, identityId });

      const results = await repo.findByTemplateId(templateId);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.toServerDTO().templateId === templateId)).toBe(true);
    });
  });

  describe('findByIdentityId', () => {
    it('should return all instances for the identity', async () => {
      await seedInstanceRaw({ templateId, identityId });
      await seedInstanceRaw({ templateId, identityId });

      const results = await repo.findByIdentityId(identityId);
      expect(results).toHaveLength(2);
    });
  });

  describe('findByDateRange', () => {
    it('should return instances within the date range', async () => {
      const june15 = new Date('2025-06-15T00:00:00Z');
      const june16 = new Date('2025-06-16T00:00:00Z');
      const june20 = new Date('2025-06-20T00:00:00Z');
      const july01 = new Date('2025-07-01T00:00:00Z');

      await seedInstanceRaw({ templateId, identityId, instanceDate: june15 });
      await seedInstanceRaw({ templateId, identityId, instanceDate: june16 });
      await seedInstanceRaw({ templateId, identityId, instanceDate: july01 });

      const results = await repo.findByDateRange(identityId, june15.getTime(), june20.getTime());
      expect(results).toHaveLength(2);
    });
  });

  describe('findByStatus', () => {
    it('should filter instances by status', async () => {
      await seedInstanceRaw({ templateId, identityId, status: 'Pending' });
      await seedInstanceRaw({ templateId, identityId, status: 'Completed' });
      await seedInstanceRaw({ templateId, identityId, status: 'Pending' });

      const pending = await repo.findByStatus(identityId, 'Pending' as any);
      expect(pending).toHaveLength(2);

      const completed = await repo.findByStatus(identityId, 'Completed' as any);
      expect(completed).toHaveLength(1);
    });
  });

  describe('findOverdueInstances', () => {
    it('should return pending instances with instanceDate in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await seedInstanceRaw({ templateId, identityId, instanceDate: pastDate, status: 'Pending' });
      await seedInstanceRaw({
        templateId,
        identityId,
        instanceDate: futureDate,
        status: 'Pending',
      });
      await seedInstanceRaw({
        templateId,
        identityId,
        instanceDate: pastDate,
        status: 'Completed',
      });

      const overdue = await repo.findOverdueInstances(identityId);
      expect(overdue).toHaveLength(1);
      expect(overdue[0].toServerDTO().status).toBe('Pending');
    });
  });

  describe('findByTemplateIdAndDateRange', () => {
    it('should scope to both template and date range', async () => {
      const june15 = new Date('2025-06-15T00:00:00Z');
      const june20 = new Date('2025-06-20T00:00:00Z');

      await seedInstanceRaw({ templateId, identityId, instanceDate: june15 });
      await seedInstanceRaw({ templateId, identityId, instanceDate: june20 });

      const otherTmpl = await seedTemplateRaw({ identityId, name: 'Other' });
      await seedInstanceRaw({ templateId: otherTmpl.id, identityId, instanceDate: june15 });

      const results = await repo.findByTemplateIdAndDateRange(
        templateId,
        june15.getTime(),
        june20.getTime(),
      );
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.toServerDTO().templateId === templateId)).toBe(true);
    });
  });

  // ─── Delete Operations ───────────────────────────────────────────

  describe('delete / deleteMany / deleteByTemplateId', () => {
    it('should hard-delete a single instance', async () => {
      const inst = await seedInstanceRaw({ templateId, identityId });
      await repo.delete(inst.id);
      expect(await repo.findById(inst.id)).toBeNull();
    });

    it('should delete multiple instances by ids', async () => {
      const i1 = await seedInstanceRaw({ templateId, identityId });
      const i2 = await seedInstanceRaw({ templateId, identityId });
      const i3 = await seedInstanceRaw({ templateId, identityId });

      await repo.deleteMany([i1.id, i2.id]);

      expect(await repo.findById(i1.id)).toBeNull();
      expect(await repo.findById(i2.id)).toBeNull();
      expect(await repo.findById(i3.id)).not.toBeNull();
    });

    it('should delete all instances for a template', async () => {
      await seedInstanceRaw({ templateId, identityId });
      await seedInstanceRaw({ templateId, identityId });

      await repo.deleteByTemplateId(templateId);

      const results = await repo.findByTemplateId(templateId);
      expect(results).toHaveLength(0);
    });
  });

  // ─── countFutureInstances ────────────────────────────────────────

  describe('countFutureInstances', () => {
    it('should count instances with instanceDate >= fromDate', async () => {
      const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const future1 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      const future2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await seedInstanceRaw({ templateId, identityId, instanceDate: past });
      await seedInstanceRaw({ templateId, identityId, instanceDate: future1 });
      await seedInstanceRaw({ templateId, identityId, instanceDate: future2 });

      const count = await repo.countFutureInstances(templateId);
      expect(count).toBe(2);
    });
  });

  // ─── deleteFuturePendingInstances ────────────────────────────────

  describe('deleteFuturePendingInstances', () => {
    it('should delete only pending instances with future dates', async () => {
      const future1 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      const future2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await seedInstanceRaw({ templateId, identityId, instanceDate: future1, status: 'Pending' });
      await seedInstanceRaw({ templateId, identityId, instanceDate: future2, status: 'Completed' });
      await seedInstanceRaw({ templateId, identityId, instanceDate: past, status: 'Pending' });

      await repo.deleteFuturePendingInstances(templateId, Date.now());

      const remaining = await repo.findByTemplateId(templateId);
      expect(remaining).toHaveLength(2);
      // future Completed and past Pending survive
      const statuses = remaining.map((r) => r.toServerDTO().status).sort();
      expect(statuses).toEqual(['Completed', 'Pending']);
    });
  });
});
