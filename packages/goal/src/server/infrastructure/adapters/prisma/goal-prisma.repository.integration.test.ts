import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@memoflow/database';
import { IdentityId } from '@memoflow/domain-shared';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { Goal } from '../../../domain/aggregates/goal';
import { GoalReminderConfig } from '../../../domain';
import { GoalPrismaRepository } from './goal-prisma.repository';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../../__tests__/integration-helpers';

function createIntegrationGoal(identityId: string) {
  const goal = Goal.create({
    identityId: identityId as IdentityId,
    name: 'Harden AI Oracle',
    description: 'Turn persistence tests into a reliable oracle',
    color: '#0f766e',
    feasibilityAnalysis: null,
    motivation: 'Protect structural refactors',
    importance: ImportanceLevel.Important,
    category: 'engineering',
    tags: ['testing', 'oracle'],
    startDate: new Date('2026-04-01T00:00:00.000Z'),
    targetDate: new Date('2026-05-01T00:00:00.000Z'),
    folderId: null,
    parentGoalId: null,
    reminderConfig: GoalReminderConfig.create({
      enabled: true,
      triggers: [
        { type: 'RemainingDays', value: 7, enabled: true },
        { type: 'ProgressPercentage', value: 50, enabled: false },
      ],
    }),
  });

  const keyResult = goal.createAndAddKeyResult({
    title: 'Add first DB oracle',
    description: 'Persist repository state and relations',
    valueType: 'NUMERIC',
    aggregationMethod: 'Last',
    targetValue: 10,
    currentValue: 4,
    unit: 'tests',
    weight: 3,
  });

  goal.createAndAddReview({
    title: 'Week 1',
    content: 'The first persistence oracle is in place.',
    reviewType: 'Weekly',
    rating: 4,
    achievements: 'Added repository integration coverage',
    challenges: 'Need more frontend oracle depth',
    nextActions: 'Expand boundary tests',
  });
  goal.recordWeightSnapshot(String(keyResult.id), 2, 3, 'Manual', identityId, 'scope changed');

  return goal;
}

describe('GoalPrismaRepository integration', () => {
  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  it('persists and reloads goal children, enum state, JSON config, and nullable fields', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new GoalPrismaRepository(prisma);
    const goal = createIntegrationGoal(identityId);

    await repository.save(goal);

    const row = await prisma.goal.findUnique({
      where: { id: String(goal.id) },
      include: {
        keyResults: true,
        reviews: true,
        keyResultWeightSnapshots: true,
      },
    });
    const loaded = await repository.findByIdForIdentity(String(identityId), String(goal.id), { includeChildren: true });

    expect(row).not.toBeNull();
    expect(row?.folderId).toBeNull();
    expect(row?.reminderConfig).toContain('RemainingDays');
    expect(row?.keyResults).toHaveLength(1);
    expect(row?.reviews).toHaveLength(1);
    expect(row?.keyResultWeightSnapshots).toHaveLength(1);

    expect(loaded).not.toBeNull();
    expect(loaded?.identityId).toBe(identityId);
    expect(loaded?.importance).toBe(ImportanceLevel.Important);
    expect(loaded?.reminderConfig?.enabled).toBe(true);
    expect(loaded?.reminderConfig?.triggers).toHaveLength(2);
    expect(loaded?.keyResults).toHaveLength(1);
    expect(loaded?.goalReviews).toHaveLength(1);
    expect(loaded?.weightSnapshots).toHaveLength(1);
    expect(loaded?.keyResults[0]?.progress.targetValue).toBe(10);
    expect(loaded?.calculateProgress()).toBe(40);
  });

  it('lists goals by identity without leaking other accounts', async () => {
    const identityId = IdentityId.generate();
    const otherIdentityId = IdentityId.generate();
    await seedAccount({ id: identityId });
    await seedAccount({ id: otherIdentityId });

    const prisma = await getPrisma();
    const repository = new GoalPrismaRepository(prisma);

    const firstGoal = createIntegrationGoal(identityId);
    const secondGoal = Goal.create({
      identityId: identityId as IdentityId,
      name: 'Keep default E2E small',
      description: null,
      color: '#1d4ed8',
      feasibilityAnalysis: null,
      motivation: null,
      importance: ImportanceLevel.Moderate,
      category: null,
      tags: ['e2e'],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
    });
    const foreignGoal = Goal.create({
      identityId: otherIdentityId as IdentityId,
      name: 'Foreign goal',
      description: null,
      color: '#334155',
      feasibilityAnalysis: null,
      motivation: null,
      importance: ImportanceLevel.Minor,
      category: null,
      tags: [],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
    });

    await repository.save(firstGoal);
    await repository.save(secondGoal);
    await repository.save(foreignGoal);

    const goals = await repository.findByIdentityId(identityId, { includeChildren: true });

    expect(goals).toHaveLength(2);
    expect(goals.map((goal) => goal.name)).toEqual(
      expect.arrayContaining(['Harden AI Oracle', 'Keep default E2E small']),
    );
    expect(goals.every((goal) => goal.identityId === identityId)).toBe(true);
  });
});

describe('Goal durable completion receipt idempotency (W4 P1-3)', () => {
  const identityId = `IdentityId_receipt_${Date.now()}`;
  let goalId: string;

  beforeEach(async () => {
    await prisma.cloudAuthUser.create({
      data: {
        id: identityId,
        email: `${identityId}@example.com`,
        name: 'Receipt Test User',
        emailVerified: true,
      },
    }).catch(() => undefined);
    await prisma.account.upsert({
      where: { id: identityId },
      update: {},
      create: {
        id: identityId,
        emailAddress: `${identityId}@example.com`,
        status: 'ACTIVE',
        profile: {},
        settings: {},
      },
    });
    goalId = `goal-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await prisma.goal.create({
      data: {
        id: goalId,
        identityId,
        name: 'Receipt Idempotency Goal',
        description: 'W4 receipt persistence evidence',
        color: '#000000',
        status: 'Active',
        importance: 'Important',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  it('repeat completion writes the durable receipt only once (idempotency key persisted)', async () => {
    const { PrismaGoalWriteTransactionRunner } = await import('./prisma-goal-write-transaction-runner');
    const { GoalPrismaRepository } = await import('./goal-prisma.repository');
    const { CompleteGoalUseCase } = await import('../../../application/use-cases/commands/complete-goal.use-case');
    const { GoalPolicy } = await import('../../../domain');

    const repository = new GoalPrismaRepository(prisma);
    const runner = new PrismaGoalWriteTransactionRunner(prisma);
    const useCase = new CompleteGoalUseCase(repository, new GoalPolicy(), runner);

    const first = await useCase.execute(goalId, identityId, 1);
    expect(first.ok).toBe(true);

    const second = await useCase.execute(goalId, identityId, 1);
    expect(second.ok).toBe(true);

    // Persistence evidence: exactly ONE durable outbox row for this idempotency key
    const key = `v1:${identityId.length}:${identityId}:4:goal:${`completed:${goalId}`.length}:completed:${goalId}`;
    const rows = await prisma.outboxMessage.findMany({
      where: { idempotencyKey: key },
    });
    expect(rows).toHaveLength(1);

    const keyRows = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS c FROM reliable_outbox_messages WHERE idempotency_key = $1`,
      key,
    );
    expect((keyRows as { c: number }[])[0].c).toBe(1);
  });

  it('repeat archiving writes the durable receipt only once (archive symmetric path)', async () => {
    const { PrismaGoalWriteTransactionRunner } = await import('./prisma-goal-write-transaction-runner');
    const { GoalPrismaRepository } = await import('./goal-prisma.repository');
    const { ArchiveGoalUseCase } = await import('../../../application/use-cases/commands/archive-goal.use-case');
    const { GoalPolicy } = await import('../../../domain');

    const repository = new GoalPrismaRepository(prisma);
    const runner = new PrismaGoalWriteTransactionRunner(prisma);
    const useCase = new ArchiveGoalUseCase(repository, new GoalPolicy(), runner);

    const first = await useCase.execute(goalId, identityId, 1);
    expect(first.ok).toBe(true);

    const second = await useCase.execute(goalId, identityId, 1);
    expect(second.ok).toBe(true);

    const key = `v1:${identityId.length}:${identityId}:4:goal:${`archived:${goalId}`.length}:archived:${goalId}`;
    const rows = await prisma.outboxMessage.findMany({
      where: { idempotencyKey: key },
    });
    expect(rows).toHaveLength(1);
  });

  it('receipt failure rolls back goal CAS save in transaction', async () => {
    const { PrismaGoalWriteTransactionRunner } = await import('./prisma-goal-write-transaction-runner');
    const { GoalPrismaRepository } = await import('./goal-prisma.repository');
    const { CompleteGoalUseCase } = await import('../../../application/use-cases/commands/complete-goal.use-case');
    const { GoalPolicy } = await import('../../../domain');

    const repository = new GoalPrismaRepository(prisma);
    const runner = new PrismaGoalWriteTransactionRunner(prisma);
    const useCase = new CompleteGoalUseCase(repository, new GoalPolicy(), runner);

    // Mock recordGoalCompletionReceipt inside runner to throw error
    const failingRunner: typeof runner = {
      run: async (work) => {
        return runner.run(async (ctx) => {
          await work({
            ...ctx,
            recordGoalCompletionReceipt: async () => {
              throw new Error('Simulated receipt write failure');
            },
          });
        });
      },
    };

    const failingUseCase = new CompleteGoalUseCase(repository, new GoalPolicy(), failingRunner);

    await expect(failingUseCase.execute(goalId, identityId, 1)).rejects.toThrow('Simulated receipt write failure');

    // Assert goal was NOT updated in DB (remains Active)
    const goalInDb = await prisma.goal.findUnique({ where: { id: goalId } });
    expect(goalInDb?.status).toBe('Active');
    expect(goalInDb?.completedAt).toBeNull();
  });
});

describe('GoalApiModule.register() lifecycle (W4 P2-1)', () => {
  it('registers routes and starts the module with the host-injected Task binding port', async () => {
    const { Router } = await import('express');
    const { createGoalApiModule } = await import('../../../../api/module');

    const router = Router();
    const module = createGoalApiModule({
      taskBindingReadPort: {
        checkActiveTaskBindings: async () => ({ hasActiveBindings: false, activeCount: 0 }),
      },
    });

    expect(() =>
      module.register({
        router,
        middleware: {
          auth: (() => undefined) as never,
          requireRole: () => (() => undefined) as never,
        },
        db: prisma,
      } as never),
    ).not.toThrow();

    // Routes were actually registered on the shared router
    const routeCount = router.stack.length;
    expect(routeCount).toBeGreaterThan(0);

    module.destroy?.();
  });
});
