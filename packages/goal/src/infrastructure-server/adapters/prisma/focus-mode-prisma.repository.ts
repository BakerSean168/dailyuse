import type { PrismaClient, FocusMode as PrismaFocusMode } from '@dailyuse/database';
import type { IFocusModeRepository } from '@/domain-server';
import { FocusMode } from '@/domain-server';
import { createLogger } from '@dailyuse/utils';
import { PrismaFocusModeMapper } from './mappers/prisma-focus-mode-mapper';

/**
 * FocusMode Prisma Repository
 */
export class FocusModePrismaRepository implements IFocusModeRepository {
  private readonly logger = createLogger('goal:focus-mode-prisma-repo');

  constructor(private prisma: PrismaClient) {}

  private mapToValueObject(data: PrismaFocusMode): FocusMode {
    return PrismaFocusModeMapper.toDomain(data);
  }

  async save(focusMode: FocusMode): Promise<void> {
    const dto = focusMode.toDTO();
    this.logger.info('保存专注模式', {
      id: dto.id,
      identityId: dto.identityId,
      isActive: dto.isActive,
      focusedGoalIds: dto.focusedGoalIds,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    await this.prisma.focusMode.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        identityId: dto.identityId,
        focusedGoalIds: dto.focusedGoalIds,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        hiddenGoalsMode: dto.hiddenGoalsMode,
        isActive: dto.isActive,
        actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : null,
        version: 1,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        focusedGoalIds: dto.focusedGoalIds,
        endTime: new Date(dto.endTime),
        hiddenGoalsMode: dto.hiddenGoalsMode,
        isActive: dto.isActive,
        actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : null,
        updatedAt: new Date(dto.updatedAt),
      },
    });
  }

  async findById(id: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findUnique({ where: { id } });
    return data ? this.mapToValueObject(data) : null;
  }

  async findActiveByIdentityId(identityId: string): Promise<FocusMode | null> {
    this.logger.info('按身份查询启用中的专注模式开始', { identityId });
    const data = await this.prisma.focusMode.findFirst({
      where: { identityId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    this.logger.info('按身份查询启用中的专注模式结果', {
      identityId,
      found: !!data,
      id: data?.id ?? null,
      isActive: data?.isActive ?? null,
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
