import { describe, it, expect } from 'vitest';
import { PrismaWeightSnapshotMapper } from './prisma-weight-snapshot-mapper';

describe('PrismaWeightSnapshotMapper additional coverage', () => {
  it('maps prisma list to domain list', () => {
    const prismaRows = [
      {
        id: 'snap-1',
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        identityId: 'identity-1',
        oldWeight: 1,
        newWeight: 2,
        weightDelta: 1,
        snapshotTime: new Date(1_000),
        trigger: 'Manual',
        reason: null,
        operatorId: 'identity-1',
        createdAt: new Date(900),
      },
      {
        id: 'snap-2',
        goalId: 'goal-1',
        keyResultId: 'kr-2',
        identityId: 'identity-1',
        oldWeight: 2,
        newWeight: 3,
        weightDelta: 1,
        snapshotTime: BigInt(2_000),
        trigger: 'Auto',
        reason: 'rule',
        operatorId: 'identity-1',
        createdAt: BigInt(1_900),
      },
    ];

    const domains = PrismaWeightSnapshotMapper.toDomainList(prismaRows as any[]);

    expect(domains).toHaveLength(2);
    expect(domains[0].toDTO().id).toBe('snap-1');
    expect(domains[1].toDTO().trigger).toBe('Auto');
  });
});
