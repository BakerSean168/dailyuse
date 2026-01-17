import type { PrismaClient, focusMode as PrismaFocusMode } from '@prisma/client';
import type { IFocusModeRepository } from '@dailyuse/domain-server/goal';
import { FocusMode } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, HiddenGoalsMode } from '@dailyuse/contracts/goal';

/**
 * FocusMode Prisma 仓储实现
 */
export class PrismaFocusModeRepository implements IFocusModeRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 模型映射为领域值对象
   */
  private mapToValueObject(data: PrismaFocusMode): FocusMode {
    return FocusMode.fromServerDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      focusedGoalUuids: data.focusedGoalUuids,
      startTime: Number(data.startTime),
      endTime: Number(data.endTime),
      hiddenGoalsMode: data.hiddenGoalsMode as HiddenGoalsMode,
      isActive: data.isActive,
      actualEndTime: data.actualEndTime ? Number(data.actualEndTime) : null,
      createdAt: Number(data.createdAt),
      updatedAt: Number(data.updatedAt),
    });
  }

  /**
   * 保存专注周期（创建或更新）
   */
  async save(focusMode: FocusMode): Promise<void> {
    const dto = focusMode.toServerDTO();

    await this.prisma.focusMode.upsert({
      where: { uuid: dto.uuid },
      create: {
        uuid: dto.uuid,
        accountUuid: dto.accountUuid,
        focusedGoalUuids: dto.focusedGoalUuids,
        startTime: BigInt(dto.startTime),
        endTime: BigInt(dto.endTime),
        hiddenGoalsMode: dto.hiddenGoalsMode,
        isActive: dto.isActive,
        actualEndTime: dto.actualEndTime ? BigInt(dto.actualEndTime) : null,
        createdAt: BigInt(dto.createdAt),
        updatedAt: BigInt(dto.updatedAt),
      },
      update: {
        focusedGoalUuids: dto.focusedGoalUuids,
        endTime: BigInt(dto.endTime),
        isActive: dto.isActive,
        actualEndTime: dto.actualEndTime ? BigInt(dto.actualEndTime) : null,
        updatedAt: BigInt(dto.updatedAt),
      },
    });
  }

  /**
   * 通过 UUID 查找专注周期
   */
  async findById(uuid: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findUnique({
      where: { uuid },
    });

    return data ? this.mapToValueObject(data) : null;
  }

  /**
   * 查找账户当前活跃的专注周期
   */
  async findActiveByAccountUuid(accountUuid: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findFirst({
      where: {
        accountUuid,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return data ? this.mapToValueObject(data) : null;
  }

  /**
   * 查找账户的所有专注周期（包括历史）
   */
  async findByAccountUuid(accountUuid: string): Promise<FocusMode[]> {
    const data = await this.prisma.focusMode.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item) => this.mapToValueObject(item));
  }

  /**
   * 批量失效过期的专注周期
   */
  async deactivateExpired(): Promise<number> {
    const currentTime = BigInt(Date.now());

    const result = await this.prisma.focusMode.updateMany({
      where: {
        isActive: true,
        endTime: { lt: currentTime },
      },
      data: {
        isActive: false,
        actualEndTime: currentTime,
        updatedAt: currentTime,
      },
    });

    return result.count;
  }

  /**
   * 删除专注周期
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.focusMode.delete({
      where: { uuid },
    });
  }
}

