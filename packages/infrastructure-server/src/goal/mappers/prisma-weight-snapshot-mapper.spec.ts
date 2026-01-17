import { describe, it, expect } from 'vitest';
import { PrismaWeightSnapshotMapper } from './prisma-weight-snapshot-mapper';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server/goal';
import type { SnapshotTrigger } from '@dailyuse/contracts/goal';

describe('PrismaWeightSnapshotMapper', () => {
  const domainSnapshot = new KeyResultWeightSnapshot(
    'snap-1',
    'goal-1',
    'kr-1',
    10,
    20,
    1234567890,
    'manual' as SnapshotTrigger,
    'user-1',
    'reason',
    1234567800
  );

  it('should map toPrisma correctly', () => {
    const prismaData = PrismaWeightSnapshotMapper.toPrisma(domainSnapshot);
    
    expect(prismaData.uuid).toBe('snap-1');
    expect(prismaData.snapshotTime).toBe(BigInt(1234567890));
    expect(prismaData.reason).toBe('reason');
    expect(prismaData.createdAt).toBeInstanceOf(Date);
    expect(prismaData.createdAt.getTime()).toBe(1234567800);
  });

  it('should map toDomain correctly', () => {
    const prismaData = {
      uuid: 'snap-1',
      goalUuid: 'goal-1',
      keyResultUuid: 'kr-1',
      oldWeight: 10,
      newWeight: 20,
      weightDelta: 10,
      snapshotTime: BigInt(1234567890),
      trigger: 'manual',
      reason: 'reason',
      operatorUuid: 'user-1',
      createdAt: new Date(1234567800)
    };

    const domain = PrismaWeightSnapshotMapper.toDomain(prismaData);

    expect(domain).toBeInstanceOf(KeyResultWeightSnapshot);
    expect(domain.uuid).toBe('snap-1');
    expect(domain.snapshotTime).toBe(1234567890);
    expect(domain.reason).toBe('reason');
    expect(domain.createdAt).toBe(1234567800);
  });
});
