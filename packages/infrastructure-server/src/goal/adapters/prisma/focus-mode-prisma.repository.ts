import type { PrismaClient, focusMode as PrismaFocusMode } from '@prisma/client';
import type { IFocusModeRepository } from '@dailyuse/domain-server/goal';
import { FocusMode } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, HiddenGoalsMode } from '@dailyuse/contracts/goal';

/**
 * FocusMode Prisma Repository瀹炵幇
 */
export class FocusModePrismaRepository implements IFocusModeRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 灏?Prisma 妯″瀷鏄犲皠涓洪鍩熷€煎璞?
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
   * Save涓撴敞鍛ㄦ湡锛堝垱寤烘垨Update锛?
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
   * 閫氳繃 UUID 鏌ユ壘涓撴敞鍛ㄦ湡
   */
  async findById(uuid: string): Promise<FocusMode | null> {
    const data = await this.prisma.focusMode.findUnique({
      where: { uuid },
    });

    return data ? this.mapToValueObject(data) : null;
  }

  /**
   * 鏌ユ壘璐︽埛褰撳墠娲昏穬鐨勪笓娉ㄥ懆鏈?
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
   * 鏌ユ壘璐︽埛鐨勬墍鏈変笓娉ㄥ懆鏈燂紙鍖呮嫭鍘嗗彶锛?
   */
  async findByAccountUuid(accountUuid: string): Promise<FocusMode[]> {
    const data = await this.prisma.focusMode.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item) => this.mapToValueObject(item));
  }

  /**
   * 鎵归噺澶辨晥杩囨湡鐨勪笓娉ㄥ懆鏈?
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
   * Delete涓撴敞鍛ㄦ湡
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.focusMode.delete({
      where: { uuid },
    });
  }
}

