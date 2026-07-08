import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { Goal } from '@/server/domain/aggregates/goal';
import { GoalReminderConfig } from '@/server/domain';
import { GoalPrismaRepository } from './goal-prisma.repository';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../__tests__/integration-helpers';

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
    const loaded = await repository.findById(String(goal.id), { includeChildren: true });

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
