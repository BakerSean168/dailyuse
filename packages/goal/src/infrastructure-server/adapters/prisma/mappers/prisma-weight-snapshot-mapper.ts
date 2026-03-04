/**
 * Prisma Weight Snapshot Mapper
 *
 * Maps between KeyResultWeightSnapshot domain objects and Prisma model.
 * Since Prisma now uses the same field names as PersistenceDTO (id, goalId,
 * keyResultId, operatorId) with DateTime fields, the mapping is straightforward.
 */

import { KeyResultWeightSnapshot } from '@/domain-server';
import type { KeyResultWeightSnapshotPersistenceDTO } from '@dailyuse/contracts/goal';

/**
 * Weight Snapshot Mapper
 *
 * Converts between domain value objects and Prisma model data.
 * Prisma DateTime fields map directly to PersistenceDate (= Date).
 */
export class PrismaWeightSnapshotMapper {
  /**
   * Domain -> Prisma create input
   *
   * Uses toPersistenceDTO() which returns Date objects for time fields,
   * matching Prisma DateTime columns directly.
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
   *
   * Prisma row fields now match PersistenceDTO field names directly.
   */
  static toDomain(prismaSnapshot: any): KeyResultWeightSnapshot {
    const dto: KeyResultWeightSnapshotPersistenceDTO = {
      id: prismaSnapshot.id,
      goalId: prismaSnapshot.goalId,
      keyResultId: prismaSnapshot.keyResultId,
      identityId: prismaSnapshot.identityId,
      oldWeight: prismaSnapshot.oldWeight,
      newWeight: prismaSnapshot.newWeight,
      weightDelta: prismaSnapshot.weightDelta,
      snapshotTime: prismaSnapshot.snapshotTime,
      trigger: prismaSnapshot.trigger,
      reason: prismaSnapshot.reason,
      operatorId: prismaSnapshot.operatorId,
      createdAt: prismaSnapshot.createdAt,
    };
    return KeyResultWeightSnapshot.fromPersistenceDTO(dto);
  }

  /**
   * Batch convert: Prisma -> Domain
   */
  static toDomainList(prismaSnapshots: any[]): KeyResultWeightSnapshot[] {
    return prismaSnapshots.map((snapshot) => this.toDomain(snapshot));
  }
}
