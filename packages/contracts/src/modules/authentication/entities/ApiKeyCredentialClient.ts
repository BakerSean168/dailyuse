/**
 * ApiKeyCredential Entity - Client Interface
 * API密钥凭证实体 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * ApiKeyCredential Client DTO
 */
export interface ApiKeyCredentialClientDTO {
  uuid: string;
  credentialUuid: string;
  name: string;
  keyPrefix: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: number | null;
  expiresAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// ============ 实体接口 ============

export interface ApiKeyCredentialClient {
  uuid: string;
  credentialUuid: string;
  name: string;
  keyPrefix: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: number | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  toClientDTO(): ApiKeyCredentialClientDTO;
}

export interface ApiKeyCredentialClientStatic {
  fromClientDTO(dto: ApiKeyCredentialClientDTO): ApiKeyCredentialClient;
}
