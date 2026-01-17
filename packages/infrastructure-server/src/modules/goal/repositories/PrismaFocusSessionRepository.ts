import type { PrismaClient, focusSession as PrismaFocusSession } from '@prisma/client';
import type { IFocusSessionRepository } from '@dailyuse/domain-server/goal';
import { FocusSession } from '@dailyuse/domain-server/goal';
import { GoalStatus, FocusSessionStatus } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';


/**
 * PrismaFocusSessionRepository
 *
 * Prisma 实现的专注周期仓储
 * 负责 FocusSession 聚合根的持久化和查询
 *
 * 映射关系：
 * - Domain Entity (FocusSession) ↔ Persistence DTO ↔ Prisma Model
 * - Prisma Client 自动将 snake_case 字段转换为 camelCase
 */
export class PrismaFocusSessionRepository implements IFocusSessionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 模型映射为领域实体
   * 注意：Prisma Client 自动将 @map 的字段转换为 camelCase
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
      startedAt: data.startedAt,
      pausedAt: data.pausedAt,
      resumedAt: data.resumedAt,
      completedAt: data.completedAt,
      cancelledAt: data.cancelledAt,
      pauseCount: data.pauseCount,
      pausedDurationMinutes: data.pausedDurationMinutes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 保存领域实体到数据库
   * 使用 upsert 模式（存在则更新，不存在则创建）
   */
  async save(session: FocusSession): Promise<void> {
    const persistence = session.toPersistenceDTO();

    // 准备数据（可更新的字段）
    const data = {
      goalUuid: persistence.goalUuid,
      status: persistence.status,
      durationMinutes: persistence.durationMinutes,
      actualDurationMinutes: persistence.actualDurationMinutes,
      description: persistence.description,
      startedAt: persistence.startedAt,
      pausedAt: persistence.pausedAt,
      resumedAt: persistence.resumedAt,
      completedAt: persistence.completedAt,
      cancelledAt: persistence.cancelledAt,
      pauseCount: persistence.pauseCount,
      pausedDurationMinutes: persistence.pausedDurationMinutes,
      updatedAt: persistence.updatedAt,
    };

    await this.prisma.focusSession.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        createdAt: persistence.createdAt,
        ...data,
      },
      update: data,
    });
  }

  /**
   * 根据 UUID 查找单个会话
   */
  async findById(uuid: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 查找用户的活跃会话（IN_PROGRESS 或 PAUSED）
   * 业务规则：一个用户同时只能有一个活跃会话
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
        createdAt: 'desc', // 返回最新的活跃会话
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 查找用户的所有会话（支持过滤和分页）
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
    // 构建查询条件
    const where: any = { accountUuid };

    if (options?.goalUuid) {
      where.goalUuid = options.goalUuid;
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    // 日期范围过滤
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.createdAt.lte = new Date(options.endDate);
      }
    }

    // 排序字段映射
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
   * 查找目标关联的所有会话
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
   * 删除会话（物理删除）
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.focusSession.delete({
      where: { uuid },
    });
  }

  /**
   * 检查会话是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.focusSession.count({
      where: { uuid },
    });
    return count > 0;
  }

  /**
   * 统计会话数量
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

