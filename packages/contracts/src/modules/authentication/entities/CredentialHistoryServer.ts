/**
 * CredentialHistory Entity - Server Interface
 * 凭证历史实体 - 服务端接口
 */

import type {
  CredentialHistoryClient,
  CredentialHistoryClientDTO,
} from './CredentialHistoryClient';
// ============ DTO 定义 ============

/**
 * CredentialHistory Server DTO
 */
export interface CredentialHistoryServerDTO {
  uuid: string;
  credentialUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
}

/**
 * CredentialHistory Persistence DTO
 */
export interface CredentialHistoryPersistenceDTO {
  uuid: string;
  credential_uuid: string;
  action: string;
  details?: string | null; // JSON
  ip_address?: string | null;
  user_agent?: string | null;
  createdAt: Date;
}

// ============ 实体接口 ============

export interface CredentialHistoryServer {
  uuid: string;
  credentialUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;

  toServerDTO(): CredentialHistoryServerDTO;
  toClientDTO(): CredentialHistoryClientDTO;
  toPersistenceDTO(): CredentialHistoryPersistenceDTO;
}

export interface CredentialHistoryServerStatic {
  create(params: {
    credentialUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): CredentialHistoryServer;
  fromServerDTO(dto: CredentialHistoryServerDTO): CredentialHistoryServer;
  fromPersistenceDTO(dto: CredentialHistoryPersistenceDTO): CredentialHistoryServer;
}
