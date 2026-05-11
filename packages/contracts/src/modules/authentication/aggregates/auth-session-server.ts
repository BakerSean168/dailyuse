/**
 * AuthSession Aggregate Root - Server DTO
 * 会话聚合根 - 服务端 DTO
 *
 * Server 端聚合根接口已移至领域模型内部定义 (AuthSessionState)
 * 此处仅保留 DTO 定义用于跨层数据传输
 */

import type { DeviceInfo } from '../value-objects/device-info';

import type { AuthSessionId } from '../value-objects/auth-session-id';
import type { IdentityId } from '../value-objects/identity-id';
import { SessionStatus } from '../value-objects/session-status';
import type { TransferDate } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Server DTO (内部构造用)
 * 使用 TransferDate (number) 时间戳
 */
export interface AuthSessionServerDTO {
  id: AuthSessionId;
  identityId: IdentityId;
  deviceInfo: DeviceInfo;
  refreshTokenHash?: string;
  status: SessionStatus;
  version: number;
  createdAt: TransferDate;
  expiresAt: TransferDate;
  lastActiveAt: TransferDate;
  isRevoked: boolean;
}
