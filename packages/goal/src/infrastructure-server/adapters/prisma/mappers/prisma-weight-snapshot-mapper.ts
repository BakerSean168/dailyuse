/**
 * Prisma Weight Snapshot Mapper
 *
 * Maps between KeyResultWeightSnapshot domain objects and Prisma model.
 */

import { KeyResultWeightSnapshot } from '@/domain-server';
import type { KeyResultWeightSnapshotDTO } from '@dailyuse/contracts/goal';

/**
 * Weight Snapshot Mapper
 *
 * Converts between domain value objects and Prisma model data.
 */
export class PrismaWeightSnapshotMapper {
  /**
   * Domain -> Prisma create input
   */
  static toPrisma(snapshot: KeyResultWeightSnapshot) {
    const dto = snapshot.toDTO();
    return {
      id: dto.id as string,
      goalId: dto.goalId as string,
      keyResultId: dto.keyResultId as string,
      identityId: dto.identityId as string,
      oldWeight: dto.oldWeight,
      newWeight: dto.newWeight,
      weightDelta: dto.weightDelta,
      snapshotTime: new Date(dto.snapshotTime),
      trigger: dto.trigger,
      reason: dto.reason,
      operatorId: dto.operatorId as string,
      createdAt: new Date(dto.createdAt),
    };
  }

  /**
   * Prisma row -> Domain value object
   */
  static toDomain(prismaSnapshot: any): KeyResultWeightSnapshot {
    const toDateNumber = (value: unknown): number => {
      if (value instanceof Date) return value.getTime();
      if (typeof value === 'bigint') return Number(value);
      return value as number;
    };

    const dto: KeyResultWeightSnapshotDTO = {
      id: prismaSnapshot.id,
      goalId: prismaSnapshot.goalId,
      keyResultId: prismaSnapshot.keyResultId,
      identityId: prismaSnapshot.identityId,
      oldWeight: prismaSnapshot.oldWeight,
      newWeight: prismaSnapshot.newWeight,
      weightDelta: prismaSnapshot.weightDelta,
      snapshotTime: toDateNumber(prismaSnapshot.snapshotTime),
      trigger: prismaSnapshot.trigger,
      reason: prismaSnapshot.reason ?? null,
      operatorId: prismaSnapshot.operatorId,
      createdAt: toDateNumber(prismaSnapshot.createdAt),
    };
    return KeyResultWeightSnapshot.fromDTO(dto);
  }

  /**
   * Batch convert: Prisma -> Domain
   */
  static toDomainList(prismaSnapshots: any[]): KeyResultWeightSnapshot[] {
    return prismaSnapshots.map((snapshot) => this.toDomain(snapshot));
  }
}
