/**
 * PasswordCredential 实体实现
 * 实现 PasswordCredentialServer 接口
 */

import type {
  PasswordCredentialClientDTO,
  PasswordCredentialPersistenceDTO,
  PasswordCredentialServer,
  PasswordCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { Entity, generateUUID } from '@dailyuse/utils';

export class PasswordCredential extends Entity implements PasswordCredentialServer {
  public readonly credentialUuid: string;
  public readonly hashedPassword: string;
  public readonly salt: string;
  public readonly algorithm: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  public readonly iterations?: number | null;
  public readonly createdAt: number;
  public readonly updatedAt: number;
  public readonly status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  public readonly failedAttempts: number;
  public readonly lastChangedAt: number;

  constructor(params: {
    uuid?: string;
    credentialUuid: string;
    hashedPassword: string;
    salt: string;
    algorithm: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
    iterations?: number | null;
    createdAt?: number;
    updatedAt?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
    failedAttempts?: number;
    lastChangedAt?: number;
  }) {
    super(params.uuid ?? generateUUID());
    this.credentialUuid = params.credentialUuid;
    this.hashedPassword = params.hashedPassword;
    this.salt = params.salt;
    this.algorithm = params.algorithm;
    this.iterations = params.iterations ?? null;
    this.createdAt = params.createdAt ?? Date.now();
    this.updatedAt = params.updatedAt ?? Date.now();
    this.status = params.status ?? 'ACTIVE';
    this.failedAttempts = params.failedAttempts ?? 0;
    this.lastChangedAt = params.lastChangedAt ?? Date.now();
  }

  // Factory methods
  public static create(params: {
    credentialUuid: string;
    hashedPassword: string;
    salt: string;
    algorithm?: 'BCRYPT' | 'ARGON2' | 'SCRYPT';
  }): PasswordCredential {
    return new PasswordCredential({
      uuid: generateUUID(),
      credentialUuid: params.credentialUuid,
      hashedPassword: params.hashedPassword,
      salt: params.salt,
      algorithm: params.algorithm ?? 'BCRYPT',
    });
  }

  public static fromServerDTO(dto: PasswordCredentialServerDTO): PasswordCredential {
    return new PasswordCredential({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      hashedPassword: dto.hashedPassword,
      salt: dto.salt,
      algorithm: dto.algorithm,
      iterations: dto.iterations,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      status: dto.status,
      failedAttempts: dto.failedAttempts,
      lastChangedAt: dto.lastChangedAt,
    });
  }

  public static fromPersistenceDTO(dto: PasswordCredentialPersistenceDTO): PasswordCredential {
    return new PasswordCredential({
      uuid: dto.uuid,
      credentialUuid: dto.credential_uuid,
      hashedPassword: dto.hashed_password,
      salt: dto.salt,
      algorithm: dto.algorithm,
      iterations: dto.iterations,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      status: dto.status,
      failedAttempts: dto.failedAttempts,
      lastChangedAt: dto.last_changed_at,
    });
  }

  // Business methods
  public async verify(plainPassword: string): Promise<boolean> {
    // Password verification should be handled by application layer
    // Domain layer only stores the hashed password
    throw new Error('Password verification must be handled by application layer');
  }

  public needsRehash(): boolean {
    // This logic should be moved to application layer
    // Domain layer doesn't know about hashing algorithms
    return false;
  }

  // DTO conversion
  public toServerDTO(): PasswordCredentialServerDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      hashedPassword: this.hashedPassword,
      salt: this.salt,
      algorithm: this.algorithm,
      iterations: this.iterations,
      status: this.status,
      failedAttempts: this.failedAttempts,
      lastChangedAt: this.lastChangedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toClientDTO(): PasswordCredentialClientDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      algorithm: this.algorithm,
      status: this.status,
      failedAttempts: this.failedAttempts,
      lastChangedAt: this.lastChangedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toPersistenceDTO(): PasswordCredentialPersistenceDTO {
    return {
      uuid: this.uuid,
      credential_uuid: this.credentialUuid,
      hashed_password: this.hashedPassword,
      salt: this.salt,
      algorithm: this.algorithm,
      iterations: this.iterations,
      status: this.status,
      failedAttempts: this.failedAttempts,
      last_changed_at: this.lastChangedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
