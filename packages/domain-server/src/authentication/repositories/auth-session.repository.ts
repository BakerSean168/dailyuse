/**
 * IAuthSessionRepository 接口
 * 会话仓储接口
 */

import { AuthSession } from '../aggregates/auth-session';

/**
 * Prisma 事务客户端类型
 * 用于在事务中执行数据库操作
 */
export type PrismaTransactionClient = any; // Prisma.TransactionClient

export interface IAuthSessionRepository {
  /**
   * 保存会话
   * @param session - 会话聚合根
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中保存
   */
  save(session: AuthSession, tx?: PrismaTransactionClient): Promise<void>;

  /**
   * 根据 UUID 查找会话
   * @param uuid - 会话 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthSession | null>;

  /**
   * 根据账户 UUID 查找所有会话
   * @param accountUuid - 账户 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]>;

  /**
   * 根据访问令牌查找会话
   * @param accessToken - 访问令牌
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByAccessToken(accessToken: string, tx?: PrismaTransactionClient): Promise<AuthSession | null>;

  /**
   * 根据刷新令牌查找会话
   * @param refreshToken - 刷新令牌
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByRefreshToken(
    refreshToken: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession | null>;

  /**
   * 根据设备 ID 查找会话
   * @param deviceId - 设备 ID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByDeviceId(deviceId: string, tx?: PrismaTransactionClient): Promise<AuthSession[]>;

  /**
   * 查找活跃会话
   * @param accountUuid - 账户 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findActiveSessions(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]>;

  /**
   * 根据账户 UUID 查找所有活跃会话（别名方法）
   * @param accountUuid - 账户 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findActiveSessionsByAccountUuid(
    accountUuid: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]>;

  /**
   * 查找所有会话（支持分页）
   * @param params - 分页参数
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findAll(
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]>;

  /**
   * 根据状态查找会话
   * @param status - 会话状态
   * @param params - 分页参数
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]>;

  /**
   * 删除会话
   * @param uuid - 会话 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中删除
   */
  delete(uuid: string, tx?: PrismaTransactionClient): Promise<void>;

  /**
   * 删除账户的所有会话
   * @param accountUuid - 账户 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中删除
   * @returns 删除的会话数量
   */
  deleteByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<number>;

  /**
   * 批量删除过期会话
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中删除
   * @returns 删除的会话数量
   */
  deleteExpired(tx?: PrismaTransactionClient): Promise<number>;
}
