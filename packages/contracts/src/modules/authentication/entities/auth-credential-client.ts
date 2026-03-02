/**
 * AuthCredential Entity - Client DTO
 * 认证凭证实体 - 客户端 DTO
 *
 * Client 端凭证接口已移至领域模型内部定义
 * 此处仅保留 DTO 定义用于 API Response
 */

import type { AuthCredentialId, CredentialType } from '../value-objects';
import type { TransferDate } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
export interface AuthCredentialClientDTO {
  id: AuthCredentialId;
  type: CredentialType;
  displayName: string;
  lastUsedAt: TransferDate | null;
  isPrimary: boolean;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
