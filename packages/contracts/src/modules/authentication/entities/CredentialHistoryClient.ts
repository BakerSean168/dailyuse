/**
 * CredentialHistory Entity - Client Interface
 * 凭证历史实体 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * CredentialHistory Client DTO
 */
export interface CredentialHistoryClientDTO {
  uuid: string;
  credentialUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
}

// ============ 实体接口 ============

export interface CredentialHistoryClient {
  uuid: string;
  credentialUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;

  toClientDTO(): CredentialHistoryClientDTO;
}

export interface CredentialHistoryClientStatic {
  fromClientDTO(dto: CredentialHistoryClientDTO): CredentialHistoryClient;
}
