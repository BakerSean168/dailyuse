/**
 * Account 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { Account } from '../aggregates/account';

export interface IAccountRepository {
  /**
   * 保存聚合根（创建或更新）
   * @param account - 账户聚合根
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中保存
   */
  save(account: Account, tx?: unknown): Promise<void>;

  /**
   * 通过 UUID 查找账户
   * @param uuid - 账户 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findById(uuid: string, tx?: unknown): Promise<Account | null>;

  /**
   * 通过用户名查找账户
   * @param username - 用户名
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByUsername(username: string, tx?: unknown): Promise<Account | null>;

  /**
   * 通过邮箱查找账户
   * @param email - 邮箱地址
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByEmail(email: string, tx?: unknown): Promise<Account | null>;

  /**
   * 通过手机号查找账户
   * @param phoneNumber - 手机号码
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findByPhone(phoneNumber: string, tx?: unknown): Promise<Account | null>;

  /**
   * 检查用户名是否已存在
   * @param username - 用户名
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  existsByUsername(username: string, tx?: unknown): Promise<boolean>;

  /**
   * 检查邮箱是否已存在
   * @param email - 邮箱地址
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  existsByEmail(email: string, tx?: unknown): Promise<boolean>;

  /**
   * 删除账户
   * @param uuid - 账户 UUID
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中删除
   */
  delete(uuid: string, tx?: unknown): Promise<void>;

  /**
   * 查找所有账户（分页）
   * @param options - 查询选项（分页、状态过滤）
   * @param tx - 可选的 Prisma 事务客户端，用于在事务中查询
   */
  findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
    tx?: unknown,
  ): Promise<{ accounts: Account[]; total: number }>;
}
