/**
 * AuthIdentity Aggregate Root - Client Interface
 * 认证身份聚合根 - 客户端接口
 *
 * Client 端看到的身份是脱敏的
 * - 不包含凭证的敏感信息
 * - 仅显示用户友好的状态信息
 */

import type { AuthCredentialClientDTO } from '../entities/auth-credential-client';
import type { TransferDate, DomainDate } from '@/primitives';
import type { AuthIdentityStatus } from '../value-objects';

// ============ 聚合根接口 ============

/**
 * Client 端身份聚合根
 */
export interface AuthIdentityClient {
  /**
   * 身份 ID
   */
  id: string;

  /**
   * 身份状态 (ACTIVE, LOCKED, DISABLED)
   */
  status: AuthIdentityStatus;

  /**
   * 登录失败计数 (UI 可能显示: "还可尝试 3 次")
   */
  failedLoginAttempts: number;

  /**
   * 最后失败尝试时间
   */
  lastFailedAttempt: DomainDate | null;

  /**
   * 锁定直到此时间 (UI 可能显示: "账户已锁定，请 15 分钟后重试")
   */
  lockedUntil: DomainDate | null;

  /**
   * ✅ 脱敏的凭证列表 (仅显示 displayName, lastUsedAt)
   */
  credentials: AuthCredentialClientDTO[];

  /**
   * 是否设置了密码 (辅助计算属性)
   */
  hasPassword: boolean;

  /**
   * 是否绑定了 OAuth (辅助计算属性)
   */
  hasOAuth: boolean;

  /**
   * 创建时间
   */
  createdAt: DomainDate;

  /**
   * 更新时间
   */
  updatedAt: DomainDate;

  // 同步字段
  version: number;
  deletedAt: DomainDate | null;
}

// ============ DTO 定义 ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
export interface AuthIdentityClientDTO {
  id: string;
  status: AuthIdentityStatus;
  failedLoginAttempts: number;
  lastFailedAttempt: TransferDate | null;
  lockedUntil: TransferDate | null;
  credentials: AuthCredentialClientDTO[];
  hasPassword: boolean;
  hasOAuth: boolean;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
