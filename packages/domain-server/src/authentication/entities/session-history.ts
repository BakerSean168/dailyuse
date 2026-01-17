/**
 * SessionHistory 实体实现
 * 实现 SessionHistoryServer 接口
 */

import type { SessionHistoryPersistenceDTO, SessionHistoryServer, SessionHistoryServerDTO } from '@dailyuse/contracts/authentication';
import { Entity, generateUUID } from '@dailyuse/utils';

export class SessionHistory extends Entity implements SessionHistoryServer {
  public readonly sessionUuid: string;
  public readonly action: string;
  public readonly details?: any | null;
  public readonly ipAddress?: string | null;
  public readonly userAgent?: string | null;
  public readonly createdAt: number;

  constructor(params: {
    uuid?: string;
    sessionUuid: string;
    action: string;
    details?: any | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt?: number;
  }) {
    super(params.uuid ?? generateUUID());
    this.sessionUuid = params.sessionUuid;
    this.action = params.action;
    this.details = params.details ?? null;
    this.ipAddress = params.ipAddress ?? null;
    this.userAgent = params.userAgent ?? null;
    this.createdAt = params.createdAt ?? Date.now();
  }

  // Factory methods
  public static create(params: {
    sessionUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): SessionHistory {
    return new SessionHistory({
      uuid: generateUUID(),
      sessionUuid: params.sessionUuid,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  public static fromServerDTO(dto: SessionHistoryServerDTO): SessionHistory {
    return new SessionHistory({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      action: dto.action,
      details: dto.details,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      createdAt: dto.createdAt,
    });
  }

  public static fromPersistenceDTO(dto: SessionHistoryPersistenceDTO): SessionHistory {
    return new SessionHistory({
      uuid: dto.uuid,
      sessionUuid: dto.session_uuid,
      action: dto.action,
      details: dto.details ? JSON.parse(dto.details) : null,
      ipAddress: dto.ip_address,
      userAgent: dto.user_agent,
      createdAt: dto.createdAt,
    });
  }

  // DTO conversion
  public toServerDTO(): SessionHistoryServerDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      action: this.action,
      details: this.details,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt,
    };
  }

  public toClientDTO(): SessionHistoryServerDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      action: this.action,
      details: this.details,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt,
    };
  }

  public toPersistenceDTO(): SessionHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      session_uuid: this.sessionUuid,
      action: this.action,
      details: this.details ? JSON.stringify(this.details) : null,
      ip_address: this.ipAddress,
      user_agent: this.userAgent,
      createdAt: this.createdAt,
    };
  }
}
