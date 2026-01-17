/**
 * IAuthCredentialRepository 接口
 * 认证凭证仓储接口
 */

import { AuthCredential } from '../aggregates/auth-credential';

/**
 * Prisma 事务客户端类型
 * 用于支持事务操作
 */
export type PrismaTransactionClient = any; // 实际类型为 Prisma.TransactionClient

export interface IAuthCredentialRepository {
  /**
   * 保存凭证
   * @param credential 凭证聚合根
   * @param tx 可选的 Prisma 事务客户端，用于支持事务操作
   */
  save(credential: AuthCredential, tx?: PrismaTransactionClient): Promise<void>;

  /**
   * 根据 UUID 查找凭证
   * @param uuid 凭证 UUID
   * @param tx 可选的 Prisma 事务客户端，用于在事务中读取刚写入的数据
   */
  findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthCredential | null>;

  /**
   * 根据账户 UUID 查找凭证
   * @param accountUuid 账户 UUID
   * @param tx 可选的 Prisma 事务客户端，用于在事务中读取刚写入的数据
   */
  findByAccountUuid(
    accountUuid: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential | null>;

  /**
   * 查找所有凭证（支持分页）
   * @param params 分页参数
   * @param tx 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findAll(
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]>;

  /**
   * 根据状态查找凭证
   * @param status 凭证状态
   * @param params 分页参数
   * @param tx 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]>;

  /**
   * 根据类型查找凭证
   * @param type 凭证类型
   * @param params 分页参数
   * @param tx 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]>;

  /**
   * 检查账户是否存在凭证
   * @param accountUuid 账户 UUID
   * @param tx 可选的 Prisma 事务客户端，用于在事务中查询
   */
  existsByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<boolean>;

  /**
   * 删除凭证
   * @param uuid 凭证 UUID
   * @param tx 可选的 Prisma 事务客户端，用于在事务中删除
   */
  delete(uuid: string, tx?: PrismaTransactionClient): Promise<void>;

  /**
   * 批量删除过期凭证
   * @param tx 可选的 Prisma 事务客户端，用于在事务中删除
   * @returns 删除的凭证数量
   */
  deleteExpired(tx?: PrismaTransactionClient): Promise<number>;
}
