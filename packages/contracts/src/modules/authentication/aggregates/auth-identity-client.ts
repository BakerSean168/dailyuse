/**
 * AuthIdentity Aggregate Root - Client DTO
 * 认证身份聚合根 - 客户端 DTO
 *
 * Client 端聚合根接口已移至领域模型内部定义
 * 此处仅保留 DTO 定义用于 API Response
 */

import type { AuthCredentialClientDTO } from '../entities/auth-credential-client';
import type { AuthIdentifierDTO } from '../value-objects';
import type { TransferDate, IdentityId } from '@/primitives';
import type { AuthIdentityStatus } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
export interface AuthIdentityClientDTO {
  id: IdentityId;
  status: AuthIdentityStatus;
  failedLoginAttempts: number;
  lastFailedAttempt: TransferDate | null;
  lockedUntil: TransferDate | null;
  identifiers: AuthIdentifierDTO[];
  credentials: AuthCredentialClientDTO[];
  hasPassword: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasOAuth: boolean;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
