/**
 * Prisma FocusSession Mapper
 *
 * Maps between FocusSession domain entity and Prisma model.
 */

import type { FocusSession as PrismaFocusSession } from '@dailyuse/database';
import type { FocusSessionPersistenceDTO } from '@dailyuse/contracts/goal';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';
import { FocusSession } from '@/domain-server';

export class PrismaFocusSessionMapper {
  /**
   * Prisma row → Domain FocusSession entity
   */
  static toDomain(data: PrismaFocusSession): FocusSession {
    const dto: FocusSessionPersistenceDTO = {
      id: data.id,
      identityId: data.identityId,
      goalId: data.goalId ?? null,
      status: data.status as FocusSessionStatus,
      durationMinutes: data.durationMinutes,
      actualDurationMinutes: data.actualDurationMinutes,
      description: data.description,
      startedAt: data.startedAt ?? null,
      pausedAt: data.pausedAt ?? null,
      resumedAt: data.resumedAt ?? null,
      completedAt: data.completedAt ?? null,
      cancelledAt: data.cancelledAt ?? null,
      pauseCount: data.pauseCount,
      pausedDurationMinutes: data.pausedDurationMinutes,
      version: data.version ?? 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    };
    return FocusSession.fromPersistenceDTO(dto);
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaFocusSession[]): FocusSession[] {
    return rows.map((row) => PrismaFocusSessionMapper.toDomain(row));
  }
}
