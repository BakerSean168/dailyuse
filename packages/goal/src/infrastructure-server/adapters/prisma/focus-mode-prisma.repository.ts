import type { PrismaClient, FocusMode as PrismaFocusMode } from '@dailyuse/database';
import type { IFocusModeRepository } from '@/domain-server';
import { FocusMode } from '@/domain-server';
import { PrismaFocusModeMapper } from './mappers/prisma-focus-mode-mapper';

/**
 * FocusMode Prisma Repository
 *
 * Prisma implementation of IFocusModeRepository.
 * Uses FocusMode.fromDTO() to include focusedGoalIds (fromPersistenceDTO hardcodes them to []).
 */
export class FocusModePrismaRepository implements IFocusModeRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Map Prisma row to domain value object.
   * Converts DateTime fields to timestamps for FocusModeDTO.
   */
  private mapToValueObject(data: PrismaFocusMode): FocusMode {
    return PrismaFocusModeMapper.toDomain(data);
  }

  /**
   * Save focus mode (upsert).
   * Uses toPersistenceDTO() for Date fields + toDTO() for focusedGoalIds.
   */
  async save(focusMode: FocusMode): Promise<void> {
    const persistenceDto = focusMode.toPersistenceDTO();
    const fullDto = focusMode.toDTO();

    await this.prisma.focusMode.upsert({
      where: { id: persistenceDto.id as string },
      create: {
        id: persistenceDto.id as string,
        identityId: persistenceDto.identityId as string,
        focusedGoalIds: fullDto.focusedGoalIds as string[],
        startTime: persistenceDto.startTime,
        endTime: persistenceDto.endTime,
        hiddenGoalsMode: persistenceDto.hiddenGoalsMode,
        isActive: persistenceDto.isActive,
        actualEndTime: persistenceDto.actualEndTime,
        createdAt: persistenceDto.createdAt,
        updatedAt: persistenceDto.updatedAt,
      },
      update: {
        focusedGoalIds: fullDto.focusedGoalIds as string[],
        endTime: persistenceDto.endTime,
        isActive: persistenceDto.isActive,
        actualEndTime: persistenceDto.actualEndTime,
        updatedAt: persistenceDto.updatedAt,
      },
    });
  }

  /**
   * Find focus mode by ID
   */
  async findById(id: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findUnique({
      where: { id },
    });
    return data ? this.mapToValueObject(data) : null;
  }

  /**
   * Find active focus mode for an identity
   */
  async findActiveByIdentityId(identityId: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findFirst({
      where: {
        identityId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data ? this.mapToValueObject(data) : null;
  }

  /**
   * Find all focus modes for an identity (including history)
   */
  async findByIdentityId(identityId: string): Promise<FocusMode[]> {
    const data = await this.prisma.focusMode.findMany({
      where: { identityId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item: PrismaFocusMode) => this.mapToValueObject(item));
  }

  /**
   * Deactivate expired focus modes
   */
  async deactivateExpired(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.focusMode.updateMany({
      where: {
        isActive: true,
        endTime: { lt: now },
      },
      data: {
        isActive: false,
        actualEndTime: now,
        updatedAt: now,
      },
    });

    return result.count;
  }

  /**
   * Delete focus mode by ID
   */
  async delete(id: string): Promise<void> {
    await this.prisma.focusMode.delete({
      where: { id },
    });
  }
}