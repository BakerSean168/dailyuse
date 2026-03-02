/**
 * AuthIdentity Aggregate Root - Server DTO
 * 认证身份聚合根 - 服务端 DTO
 *
 * Server 端聚合根接口已移至领域模型内部定义 (AuthIdentityState)
 * 此处仅保留 DTO 定义用于跨层数据传输
 */

import type { AuthCredentialServerDTO } from '../entities/auth-credential-server';
import type { AuthIdentifierDTO } from '../value-objects';
import type { OAuthBindingServerDTO } from '../entities/oauth-binding';
import type { TransferDate } from '../../../primitives';
import type { AuthIdentityStatus } from '../value-objects/auth-identity-status';
import type { IdentityId } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Server DTO (内部构造用)
 * 使用 TransferDate (number) 时间戳
 */
export interface AuthIdentityServerDTO {
  id: IdentityId;
  status: AuthIdentityStatus;
  failedLoginAttempts: number;
  lastFailedAttempt: TransferDate | null;
  lockedUntil: TransferDate | null;
  identifiers: AuthIdentifierDTO[];
  oauthBindings: OAuthBindingServerDTO[];
  credentials: AuthCredentialServerDTO[];
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
