/**
 * Prisma FocusMode Mapper
 *
 * Maps between FocusMode domain value object and Prisma model.
 * Converts DateTime fields to timestamps for FocusModeDTO.
 */

import type { FocusMode as PrismaFocusMode } from '@dailyuse/database';
import type { FocusModeDTO, HiddenGoalsMode } from '@dailyuse/contracts/goal';
import { FocusMode } from '@/domain-server';

export class PrismaFocusModeMapper {
  /**
   * Prisma row �?Domain FocusMode value object.
   * Converts DateTime fields to timestamps for FocusModeDTO.
   */
  static toDomain(data: PrismaFocusMode): FocusMode {
    const dto: FocusModeDTO = {
      id: data.id as FocusModeDTO['id'],
      identityId: data.identityId as FocusModeDTO['identityId'],
      focusedGoalIds: (data.focusedGoalIds ?? []) as FocusModeDTO['focusedGoalIds'],
      startTime: (data.startTime as Date).getTime(),
      endTime: (data.endTime as Date).getTime(),
      hiddenGoalsMode: data.hiddenGoalsMode as HiddenGoalsMode,
      isActive: data.isActive,
      actualEndTime: data.actualEndTime ? (data.actualEndTime as Date).getTime() : null,
      createdAt: (data.createdAt as Date).getTime(),
      updatedAt: (data.updatedAt as Date).getTime(),
    };
    return FocusMode.fromDTO(dto);
  }

  /**
   * Batch conversion: Prisma �?Domain
   */
  static toDomainList(rows: PrismaFocusMode[]): FocusMode[] {
    return rows.map((row) => PrismaFocusModeMapper.toDomain(row));
  }
}
