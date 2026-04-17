import type { PrismaClient, FocusMode as PrismaFocusMode } from '@dailyuse/database';
import type { IFocusModeRepository } from '@/domain-server';
import { FocusMode } from '@/domain-server';
import { PrismaFocusModeMapper } from './mappers/prisma-focus-mode-mapper';

/**
 * FocusMode Prisma Repository
 */
export class FocusModePrismaRepository implements IFocusModeRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToValueObject(data: PrismaFocusMode): FocusMode {
    return PrismaFocusModeMapper.toDomain(data);
  }

  async save(focusMode: FocusMode): Promise<void> {
    const dto = focusMode.toPersistenceDTO();

    await this.prisma.focusMode.upsert({
      where: { id: dto.id as string },
      create: {
        id: dto.id as string,
        identityId: dto.identityId as string,
        focusedGoalIds: dto.focusedGoalIds as string[],
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        hiddenGoalsMode: dto.hiddenGoalsMode,
        isActive: dto.isActive,
        actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : null,
        version: dto.version,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        focusedGoalIds: dto.focusedGoalIds as string[],
        endTime: new Date(dto.endTime),
        hiddenGoalsMode: dto.hiddenGoalsMode,
        isActive: dto.isActive,
        actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : null,
        version: dto.version,
        updatedAt: new Date(dto.updatedAt),
      },
    });
  }

  async findById(id: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findUnique({ where: { id } });
    return data ? this.mapToValueObject(data) : null;
  }

  async findActiveByIdentityId(identityId: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findFirst({
      where: { identityId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return data ? this.mapToValueObject(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<FocusMode[]> {
    const data = await this.prisma.focusMode.findMany({
      where: { identityId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item) => this.mapToValueObject(item));
  }

  async deactivateExpired(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.focusMode.updateMany({
      where: { isActive: true, endTime: { lt: now } },
      data: {
        isActive: false,
        actualEndTime: now,
        updatedAt: now,
      },
    });
    return result.count;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.focusMode.delete({ where: { id } });
  }
}
