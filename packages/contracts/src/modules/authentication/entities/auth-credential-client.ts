/**
 * AuthCredential Entity - Client Interface
 * 认证凭证实体 - 客户端接口
 *
 * Client 端看到的凭证是脱敏的，不包含任何敏感信息
 */

import type { DomainDate } from '@/primitives';
import type { AuthCredentialId, CredentialType } from '../value-objects';
import type { TransferDate } from '@/primitives';

// ============ 实体接口 ============

/**
 * Client 端凭证 (脱敏的)
 * - 不包含哈希密码
 * - 不包含 OAuth AccessToken/RefreshToken
 * - 仅显示用户友好的信息
 */
export interface AuthCredentialClient {
  /**
   * 凭证 ID
   */
  id: AuthCredentialId;

  /**
   * 凭证类型
   */
  type: CredentialType;

  /**
   * 用于 UI 展示的名称
   * 例如: "Gmail Account", "Password (Last updated 2 months ago)"
   */
  displayName: string;

  /**
   * 最后使用时间
   */
  lastUsedAt: DomainDate | null;

  /**
   * 是否是主要凭证（用于优先级展示）
   */
  isPrimary: boolean;
}

export interface AuthCredentialClientStatic {
  fromClientDTO(dto: AuthCredentialClientDTO): AuthCredentialClient;
}

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
}
