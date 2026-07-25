/**
 * AuthSession Aggregate Root - Client DTO
 * 会话聚合根 - 客户端 DTO
 *
 * Client 端聚合根接口已移至领域模型内部定义
 * 此处仅保留 DTO 定义用于 API Response
 */

import type { AuthSessionId } from '../value-objects/auth-session-id';
import type { DeviceInfo } from '../value-objects/device-info';
import type { IdentityId } from '../value-objects/identity-id';
import type { TransferDate } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
// Residual 879: intentional Client≠Server dual (isCurrentSession/updatedAt/deletedAt vs refreshTokenHash/status/isRevoked).
export interface AuthSessionClientDTO {
  id: AuthSessionId;
  identityId: IdentityId;
  deviceInfo: DeviceInfo;
  isCurrentSession: boolean;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  expiresAt: TransferDate;
  lastActiveAt: TransferDate;
  deletedAt: TransferDate | null;
}
