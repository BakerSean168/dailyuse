/**
 * Integration tests for TaskDependencyPrismaRepository
 *
 * Tests CRUD operations and recursive graph traversal against real PostgreSQL.
 * Runs against a real PostgreSQL database (Docker, port 5433).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TaskDependencyPrismaRepository } from '@/infrastructure-server/adapters/prisma/task-dependency-prisma.repository';
import {
  getPrisma,
  cleanTaskTables,
  seedAccount,
  seedTemplateRaw,
} from '@/__tests__/integration-helpers';

describe('TaskDependencyPrismaRepository', () => {
  let repo: TaskDependencyPrismaRepository;
  let identityId: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    repo = new TaskDependencyPrismaRepository(prisma);
    identityId = await seedAccount();
  });

  beforeEach(async () => {
    const prisma = getPrisma();
    await prisma.taskDependency.deleteMany();
    await prisma.taskInstance.deleteMany();
    await prisma.taskTemplate.deleteMany();
  });

  afterAll(async () => {
    await cleanTaskTables();
  });

  // ─── create + findById ───────────────────────────────────────────

  describe('create + findById', () => {
    it('should create a dependency and retrieve it by id', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'Task A' });
      const tB = await seedTemplateRaw({ identityId, name: 'Task B' });

      const dep = await repo.create({
        predecessorTaskId: tA.id,
        successorTaskId: tB.id,
      });

      expect(dep.id).toBeDefined();
      expect(dep.predecessorTaskId).toBe(tA.id);
      expect(dep.successorTaskId).toBe(tB.id);
      expect(dep.dependencyType).toBe('FinishToStart');

      const found = await repo.findById(dep.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(dep.id);
    });

    it('should create a dependency with custom type and lag', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'Task A' });
      const tB = await seedTemplateRaw({ identityId, name: 'Task B' });

      const dep = await repo.create({
        predecessorTaskId: tA.id,
        successorTaskId: tB.id,
        dependencyType: 'StartToStart' as any,
        lagDays: 3,
      });

      expect(dep.dependencyType).toBe('StartToStart');
      expect(dep.lagDays).toBe(3);
    });
  });

  // ─── findBySuccessorId / findByPredecessorId ─────────────────────

  describe('findBySuccessorId / findByPredecessorId', () => {
    it('should find dependencies by successor task id', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });
      const tC = await seedTemplateRaw({ identityId, name: 'C' });

      // A → C and B → C
      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tC.id });
      await repo.create({ predecessorTaskId: tB.id, successorTaskId: tC.id });

      const deps = await repo.findBySuccessorId(tC.id);
      expect(deps).toHaveLength(2);
      const predIds = deps.map((d) => d.predecessorTaskId).sort();
      expect(predIds).toEqual([tA.id, tB.id].sort());
    });

    it('should find dependencies by predecessor task id', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });
      const tC = await seedTemplateRaw({ identityId, name: 'C' });

      // A → B and A → C
      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tB.id });
      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tC.id });

      const deps = await repo.findByPredecessorId(tA.id);
      expect(deps).toHaveLength(2);
    });
  });

  // ─── findByPredecessorAndSuccessorId ─────────────────────────────

  describe('findByPredecessorAndSuccessorId', () => {
    it('should find a specific dependency pair', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });

      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tB.id });

      const found = await repo.findByPredecessorAndSuccessorId(tA.id, tB.id);
      expect(found).not.toBeNull();

      const notFound = await repo.findByPredecessorAndSuccessorId(tB.id, tA.id);
      expect(notFound).toBeNull();
    });
  });

  // ─── Recursive Traversal ─────────────────────────────────────────

  describe('findAllPredecessorIds (recursive)', () => {
    it('should traverse the full predecessor chain', async () => {
      // Chain: A → B → C → D
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });
      const tC = await seedTemplateRaw({ identityId, name: 'C' });
      const tD = await seedTemplateRaw({ identityId, name: 'D' });

      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tB.id });
      await repo.create({ predecessorTaskId: tB.id, successorTaskId: tC.id });
      await repo.create({ predecessorTaskId: tC.id, successorTaskId: tD.id });

      const predecessors = await repo.findAllPredecessorIds(tD.id);
      expect(predecessors.sort()).toEqual([tA.id, tB.id, tC.id].sort());
    });

    it('should return empty array when no predecessors', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const predecessors = await repo.findAllPredecessorIds(tA.id);
      expect(predecessors).toEqual([]);
    });
  });

  describe('findAllSuccessorIds (recursive)', () => {
    it('should traverse the full successor chain', async () => {
      // Chain: A → B → C
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });
      const tC = await seedTemplateRaw({ identityId, name: 'C' });

      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tB.id });
      await repo.create({ predecessorTaskId: tB.id, successorTaskId: tC.id });

      const successors = await repo.findAllSuccessorIds(tA.id);
      expect(successors.sort()).toEqual([tB.id, tC.id].sort());
    });

    it('should handle diamond-shaped DAGs', async () => {
      //   A
      //  / \
      // B   C
      //  \ /
      //   D
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });
      const tC = await seedTemplateRaw({ identityId, name: 'C' });
      const tD = await seedTemplateRaw({ identityId, name: 'D' });

      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tB.id });
      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tC.id });
      await repo.create({ predecessorTaskId: tB.id, successorTaskId: tD.id });
      await repo.create({ predecessorTaskId: tC.id, successorTaskId: tD.id });

      const successors = await repo.findAllSuccessorIds(tA.id);
      expect(successors.sort()).toEqual([tB.id, tC.id, tD.id].sort());

      const predecessors = await repo.findAllPredecessorIds(tD.id);
      expect(predecessors.sort()).toEqual([tA.id, tB.id, tC.id].sort());
    });
  });

  // ─── update ──────────────────────────────────────────────────────

  describe('update', () => {
    it('should update dependency type and lag days', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });

      const dep = await repo.create({
        predecessorTaskId: tA.id,
        successorTaskId: tB.id,
      });

      const updated = await repo.update(dep.id, {
        dependencyType: 'FinishToFinish' as any,
        lagDays: 5,
      });

      expect(updated.dependencyType).toBe('FinishToFinish');
      expect(updated.lagDays).toBe(5);
    });
  });

  // ─── delete / deleteByTaskId ─────────────────────────────────────

  describe('delete / deleteByTaskId', () => {
    it('should delete a single dependency by id', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });

      const dep = await repo.create({
        predecessorTaskId: tA.id,
        successorTaskId: tB.id,
      });

      await repo.delete(dep.id);
      expect(await repo.findById(dep.id)).toBeNull();
    });

    it('should delete all dependencies involving a task (predecessor or successor)', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });
      const tC = await seedTemplateRaw({ identityId, name: 'C' });

      // A → B and C → A
      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tB.id });
      await repo.create({ predecessorTaskId: tC.id, successorTaskId: tA.id });

      await repo.deleteByTaskId(tA.id);

      // Both deps should be gone
      expect(await repo.findByPredecessorId(tA.id)).toHaveLength(0);
      expect(await repo.findBySuccessorId(tA.id)).toHaveLength(0);
    });
  });

  // ─── findAllByIdentityId ─────────────────────────────────────────

  describe('findAllByIdentityId', () => {
    it('should return all dependencies for templates owned by the identity', async () => {
      const tA = await seedTemplateRaw({ identityId, name: 'A' });
      const tB = await seedTemplateRaw({ identityId, name: 'B' });

      await repo.create({ predecessorTaskId: tA.id, successorTaskId: tB.id });

      const results = await repo.findAllByIdentityId(identityId);
      expect(results).toHaveLength(1);
      expect(results[0].predecessorTaskId).toBe(tA.id);
    });

    it('should return empty when identity has no templates', async () => {
      const otherId = await seedAccount();
      const results = await repo.findAllByIdentityId(otherId);
      expect(results).toHaveLength(0);
    });
  });
});
