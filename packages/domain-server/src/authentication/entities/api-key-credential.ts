/**
 * ApiKeyCredential 实体实现
 * 实现 ApiKeyCredentialServer 接口
 */

import type {
  ApiKeyCredentialClientDTO,
  ApiKeyCredentialPersistenceDTO,
  ApiKeyCredentialServer,
  ApiKeyCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { Entity, generateUUID } from '@dailyuse/utils';

export class ApiKeyCredential extends Entity implements ApiKeyCredentialServer {
  public readonly credentialUuid: string;
  public readonly name: string;
  public readonly key: string;
  public readonly keyPrefix: string;
  private _status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  private _lastUsedAt: number | null;
  public readonly expiresAt?: number | null;
  public readonly createdAt: number;
  private _updatedAt: number;

  constructor(params: {
    uuid?: string;
    credentialUuid: string;
    name: string;
    key: string;
    keyPrefix: string;
    status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    lastUsedAt?: number | null;
    expiresAt?: number | null;
    createdAt?: number;
    updatedAt?: number;
  }) {
    super(params.uuid ?? generateUUID());
    this.credentialUuid = params.credentialUuid;
    this.name = params.name;
    this.key = params.key;
    this.keyPrefix = params.keyPrefix;
    this._status = params.status ?? 'ACTIVE';
    this._lastUsedAt = params.lastUsedAt ?? null;
    this.expiresAt = params.expiresAt ?? null;
    this.createdAt = params.createdAt ?? Date.now();
    this._updatedAt = params.updatedAt ?? Date.now();
  }

  public get status(): 'ACTIVE' | 'REVOKED' | 'EXPIRED' {
    return this._status;
  }

  public get lastUsedAt(): number | null {
    return this._lastUsedAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  // Factory methods
  public static create(params: {
    credentialUuid: string;
    name: string;
    key: string;
    keyPrefix: string;
    expiresInDays?: number;
  }): ApiKeyCredential {
    const expiresAt = params.expiresInDays
      ? Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000
      : null;

    return new ApiKeyCredential({
      uuid: generateUUID(),
      credentialUuid: params.credentialUuid,
      name: params.name,
      key: params.key,
      keyPrefix: params.keyPrefix,
      expiresAt,
    });
  }

  public static fromServerDTO(dto: ApiKeyCredentialServerDTO): ApiKeyCredential {
    return new ApiKeyCredential({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      name: dto.name,
      key: dto.key,
      keyPrefix: dto.keyPrefix,
      status: dto.status,
      lastUsedAt: dto.lastUsedAt,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromPersistenceDTO(dto: ApiKeyCredentialPersistenceDTO): ApiKeyCredential {
    return new ApiKeyCredential({
      uuid: dto.uuid,
      credentialUuid: dto.credential_uuid,
      name: dto.name,
      key: dto.key,
      keyPrefix: dto.key_prefix,
      status: dto.status,
      lastUsedAt: dto.lastUsedAt,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // Business methods
  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return Date.now() > this.expiresAt;
  }

  public isValid(): boolean {
    return this._status === 'ACTIVE' && !this.isExpired();
  }

  public revoke(): void {
    this._status = 'REVOKED';
    this._updatedAt = Date.now();
  }

  public recordUsage(): void {
    this._lastUsedAt = Date.now();
    this._updatedAt = Date.now();
  }

  // DTO conversion
  public toServerDTO(): ApiKeyCredentialServerDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      name: this.name,
      key: this.key,
      keyPrefix: this.keyPrefix,
      status: this._status,
      lastUsedAt: this._lastUsedAt,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): ApiKeyCredentialClientDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      name: this.name,
      keyPrefix: this.keyPrefix,
      status: this._status,
      lastUsedAt: this._lastUsedAt,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toPersistenceDTO(): ApiKeyCredentialPersistenceDTO {
    return {
      uuid: this.uuid,
      credential_uuid: this.credentialUuid,
      name: this.name,
      key: this.key,
      key_prefix: this.keyPrefix,
      status: this._status,
      lastUsedAt: this._lastUsedAt,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
