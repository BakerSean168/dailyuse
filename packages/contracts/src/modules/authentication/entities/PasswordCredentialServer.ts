/**
 * PasswordCredential Entity - Server Interface
 * 密码凭证实体 - 服务端接口
 */

import type {
  PasswordCredentialClient,
  PasswordCredentialClientDTO,
} from './PasswordCredentialClient';

// ============ DTO 定义 ============

/**
 * PasswordCredential Server DTO
 */
export interface PasswordCredentialServerDTO {
  uuid: string;
  credentialUuid: string;
  hashedPassword: string;
  salt: string;
  algorithm: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  iterations?: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  failedAttempts: number;
  lastChangedAt: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * PasswordCredential Persistence DTO
 */
export interface PasswordCredentialPersistenceDTO {
  uuid: string;
  credential_uuid: string;
  hashed_password: string;
  salt: string;
  algorithm: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  iterations?: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  failedAttempts: Date;
  last_changed_at: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 实体接口 ============

export interface PasswordCredentialServer {
  uuid: string;
  credentialUuid: string;
  hashedPassword: string;
  salt: string;
  algorithm: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  iterations?: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  failedAttempts: Date;
  lastChangedAt: number;
  createdAt: Date;
  updatedAt: Date;

  verify(plainPassword: string): Promise<boolean>;
  needsRehash(): boolean;

  toServerDTO(): PasswordCredentialServerDTO;
  toClientDTO(): PasswordCredentialClientDTO;
  toPersistenceDTO(): PasswordCredentialPersistenceDTO;
}

export interface PasswordCredentialServerStatic {
  create(params: {
    credentialUuid: string;
    hashedPassword: string;
    salt: string;
    algorithm?: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  }): PasswordCredentialServer;
  fromServerDTO(dto: PasswordCredentialServerDTO): PasswordCredentialServer;
  fromPersistenceDTO(dto: PasswordCredentialPersistenceDTO): PasswordCredentialServer;
}
