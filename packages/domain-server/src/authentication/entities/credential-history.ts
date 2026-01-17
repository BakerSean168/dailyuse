/**
 * CredentialHistory 实体实现
 * 实现 CredentialHistoryServer 接口
 */

import type {
  CredentialHistoryClientDTO,
  CredentialHistoryPersistenceDTO,
  CredentialHistoryServer,
  CredentialHistoryServerDTO,
} from '@dailyuse/contracts/authentication';
import { Entity, generateUUID } from '@dailyuse/utils';

export class CredentialHistory extends Entity implements CredentialHistoryServer {
  public readonly credentialUuid: string;
  public readonly action: string;
  public readonly details?: any | null;
  public readonly ipAddress?: string | null;
  public readonly userAgent?: string | null;
  public readonly createdAt: number;

  constructor(params: {
    uuid?: string;
    credentialUuid: string;
    action: string;
    details?: any | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt?: number;
  }) {
    super(params.uuid ?? generateUUID());
    this.credentialUuid = params.credentialUuid;
    this.action = params.action;
    this.details = params.details ?? null;
    this.ipAddress = params.ipAddress ?? null;
    this.userAgent = params.userAgent ?? null;
    this.createdAt = params.createdAt ?? Date.now();
  }

  // Factory methods
  public static create(params: {
    credentialUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): CredentialHistory {
    return new CredentialHistory({
      uuid: generateUUID(),
      credentialUuid: params.credentialUuid,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  public static fromServerDTO(dto: CredentialHistoryServerDTO): CredentialHistory {
    return new CredentialHistory({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      action: dto.action,
      details: dto.details,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      createdAt: dto.createdAt,
    });
  }

  public static fromPersistenceDTO(dto: CredentialHistoryPersistenceDTO): CredentialHistory {
    return new CredentialHistory({
      uuid: dto.uuid,
      credentialUuid: dto.credential_uuid,
      action: dto.action,
      details: dto.details ? JSON.parse(dto.details) : null,
      ipAddress: dto.ip_address,
      userAgent: dto.user_agent,
      createdAt: dto.createdAt,
    });
  }

  // DTO conversion
  public toServerDTO(): CredentialHistoryServerDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      action: this.action,
      details: this.details,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt,
    };
  }

  public toClientDTO(): CredentialHistoryClientDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      action: this.action,
      details: this.details,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt,
    };
  }

  public toPersistenceDTO(): CredentialHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      credential_uuid: this.credentialUuid,
      action: this.action,
      details: this.details ? JSON.stringify(this.details) : null,
      ip_address: this.ipAddress,
      user_agent: this.userAgent,
      createdAt: this.createdAt,
    };
  }
}
