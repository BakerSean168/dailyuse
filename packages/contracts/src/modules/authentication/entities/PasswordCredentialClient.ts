/**
 * PasswordCredential Entity - Client Interface
 * 密码凭证实体 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * PasswordCredential Client DTO
 */
export interface PasswordCredentialClientDTO {
  uuid: string;
  credentialUuid: string;
  algorithm: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  failedAttempts: number;
  lastChangedAt: number;
  createdAt: number;
  updatedAt: number;
}

// ============ 实体接口 ============

export interface PasswordCredentialClient {
  uuid: string;
  credentialUuid: string;
  algorithm: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  failedAttempts: Date;
  lastChangedAt: number;
  createdAt: Date;
  updatedAt: Date;

  toClientDTO(): PasswordCredentialClientDTO;
}

export interface PasswordCredentialClientStatic {
  fromClientDTO(dto: PasswordCredentialClientDTO): PasswordCredentialClient;
}
