import type { PrismaClient, focusSession as PrismaFocusSession } from '@dailyuse/database';
import type { IFocusSessionRepository } from '@/domain-server';
import { FocusSession } from '@/domain-server';
import { GoalStatus, FocusSessionStatus } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';


/**
 * PrismaFocusSessionRepository
 *
 * Prisma 瀹炵幇鐨勪笓娉ㄥ懆鏈熶粨鍌?
 * 璐熻矗 FocusSession 鑱氬悎鏍圭殑鎸佷箙鍖栧拰鏌ヨ
 *
 * 鏄犲皠鍏崇郴锛?
 * - Domain Entity (FocusSession) 鈫?Persistence DTO 鈫?Prisma Model
 * - Prisma Client 鑷姩灏?snake_case 瀛楁杞崲涓?camelCase
 */
export class FocusSessionPrismaRepository implements IFocusSessionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 灏?Prisma 妯″瀷鏄犲皠涓洪鍩熷疄浣?
   * 娉ㄦ剰锛歅risma Client 鑷姩灏?@map 鐨勫瓧娈佃浆鎹负 camelCase
   */
  private mapToEntity(data: PrismaFocusSession): FocusSession {
    return FocusSession.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      goalUuid: data.goalUuid,
      status: data.status as FocusSessionStatus,
      durationMinutes: data.durationMinutes,
      actualDurationMinutes: data.actualDurationMinutes,
      description: data.description,
      startedAt: data.startedAt ? (typeof data.startedAt === 'number' ? data.startedAt : new Date(data.startedAt).getTime()) : null,
      pausedAt: data.pausedAt ? (typeof data.pausedAt === 'number' ? data.pausedAt : new Date(data.pausedAt).getTime()) : null,
      resumedAt: data.resumedAt ? (typeof data.resumedAt === 'number' ? data.resumedAt : new Date(data.resumedAt).getTime()) : null,
      completedAt: data.completedAt ? (typeof data.completedAt === 'number' ? data.completedAt : new Date(data.completedAt).getTime()) : null,
      cancelledAt: data.cancelledAt ? (typeof data.cancelledAt === 'number' ? data.cancelledAt : new Date(data.cancelledAt).getTime()) : null,
      pauseCount: data.pauseCount,
      pausedDurationMinutes: data.pausedDurationMinutes,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : new Date(data.createdAt).getTime(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : new Date(data.updatedAt).getTime(),
    });
  }

  /**
   * Save棰嗗煙瀹炰綋鍒版暟鎹簱
   * 浣跨敤 upsert 妯″紡锛堝瓨鍦ㄥ垯Update锛屼笉瀛樺湪鍒欏垱寤猴級
   */
  async save(session: FocusSession): Promise<void> {
    const persistence = session.toPersistenceDTO();

    // 鍑嗗鏁版嵁锛堝彲Update鐨勫瓧娈碉級
    const data = {
      goalUuid: persistence.goalUuid,
      status: persistence.status,
      durationMinutes: persistence.durationMinutes,
      actualDurationMinutes: persistence.actualDurationMinutes,
      description: persistence.description,
      startedAt: persistence.startedAt ? new Date(persistence.startedAt) : null,
      pausedAt: persistence.pausedAt ? new Date(persistence.pausedAt) : null,
      resumedAt: persistence.resumedAt ? new Date(persistence.resumedAt) : null,
      completedAt: persistence.completedAt ? new Date(persistence.completedAt) : null,
      cancelledAt: persistence.cancelledAt ? new Date(persistence.cancelledAt) : null,
      pauseCount: persistence.pauseCount,
      pausedDurationMinutes: persistence.pausedDurationMinutes,
      updatedAt: new Date(typeof persistence.updatedAt === 'number' ? persistence.updatedAt : new Date(persistence.updatedAt).getTime()),
    };

    await this.prisma.focusSession.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        createdAt: new Date(typeof persistence.createdAt === 'number' ? persistence.createdAt : new Date(persistence.createdAt).getTime()),
        ...data,
      },
      update: data,
    });
  }

  /**
   * 鏍规嵁 UUID 鏌ユ壘鍗曚釜浼氳瘽
   */
  async findById(uuid: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 鏌ユ壘鐢ㄦ埛鐨勬椿璺冧細璇濓紙IN_PROGRESS 鎴?PAUSED锛?
   * 涓氬姟瑙勫垯锛氫竴涓敤鎴峰悓鏃跺彧鑳芥湁涓€涓椿璺冧細璇?
   */
  async findActiveSession(accountUuid: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findFirst({
      where: {
        accountUuid,
        status: {
          in: [
            FocusSessionStatus.IN_PROGRESS,
            FocusSessionStatus.PAUSED,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc', // 杩斿洖鏈€鏂扮殑娲昏穬浼氳瘽
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 鏌ユ壘鐢ㄦ埛鐨勬墍鏈変細璇濓紙鏀寔杩囨护鍜屽垎椤碉級
   */
  async findByAccountUuid(
    accountUuid: string,
    options?: {
      goalUuid?: string;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt';
      orderDirection?: 'asc' | 'desc';
      startDate?: number; // Unix timestamp
      endDate?: number; // Unix timestamp
    },
  ): Promise<FocusSession[]> {
    // 鏋勫缓鏌ヨ鏉′欢
    const where: any = { accountUuid };

    if (options?.goalUuid) {
      where.goalUuid = options.goalUuid;
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    // 鏃ユ湡鑼冨洿杩囨护
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.createdAt.lte = new Date(options.endDate);
      }
    }

    // 鎺掑簭瀛楁鏄犲皠
    const orderByField = options?.orderBy || 'createdAt';
    const orderDirection = options?.orderDirection || 'desc';

    const data = await this.prisma.focusSession.findMany({
      where,
      orderBy: {
        [orderByField]: orderDirection,
      },
      skip: options?.offset,
      take: options?.limit,
    });

    return data.map((d) => this.mapToEntity(d));
  }

  /**
   * 鏌ユ壘鐩爣鍏宠仈鐨勬墍鏈変細璇?
   */
  async findByGoalUuid(
    goalUuid: string,
    options?: {
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSession[]> {
    const where: any = { goalUuid };

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    const orderByField = options?.orderBy || 'createdAt';
    const orderDirection = options?.orderDirection || 'desc';

    const data = await this.prisma.focusSession.findMany({
      where,
      orderBy: {
        [orderByField]: orderDirection,
      },
      skip: options?.offset,
      take: options?.limit,
    });

    return data.map((d) => this.mapToEntity(d));
  }

  /**
   * Delete浼氳瘽锛堢墿鐞嗗垹闄わ級
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.focusSession.delete({
      where: { uuid },
    });
  }

  /**
   * 妫€鏌ヤ細璇濇槸鍚﹀瓨鍦?
   */
  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.focusSession.count({
      where: { uuid },
    });
    return count > 0;
  }

  /**
   * 缁熻浼氳瘽鏁伴噺
   */
  async count(
    accountUuid: string,
    options?: {
      goalUuid?: string;
      status?: FocusSessionStatus[];
      startDate?: number;
      endDate?: number;
    },
  ): Promise<number> {
    const where: any = { accountUuid };

    if (options?.goalUuid) {
      where.goalUuid = options.goalUuid;
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.createdAt.lte = new Date(options.endDate);
      }
    }

    return this.prisma.focusSession.count({ where });
  }
}

