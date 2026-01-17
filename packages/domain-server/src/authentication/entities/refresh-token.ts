/**
 * RefreshToken 实体实现
 * 实现 RefreshTokenServer 接口
 */

import type { RefreshTokenPersistenceDTO, RefreshTokenServer, RefreshTokenServerDTO } from '@dailyuse/contracts/authentication';
import { Entity, generateUUID } from '@dailyuse/utils';

export class RefreshToken extends Entity implements RefreshTokenServer {
  public readonly sessionUuid: string;
  public readonly token: string;
  public readonly expiresAt: number;
  public readonly createdAt: number;
  private _usedAt: number | null;

  constructor(params: {
    uuid?: string;
    sessionUuid: string;
    token: string;
    expiresAt: number;
    createdAt?: number;
    usedAt?: number | null;
  }) {
    super(params.uuid ?? generateUUID());
    this.sessionUuid = params.sessionUuid;
    this.token = params.token;
    this.expiresAt = params.expiresAt;
    this.createdAt = params.createdAt ?? Date.now();
    this._usedAt = params.usedAt ?? null;
  }

  public get usedAt(): number | null {
    return this._usedAt;
  }

  // Factory methods
  public static create(params: {
    sessionUuid: string;
    token: string;
    expiresInDays?: number;
  }): RefreshToken {
    const expiresInDays = params.expiresInDays ?? 30;
    const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

    return new RefreshToken({
      uuid: generateUUID(),
      sessionUuid: params.sessionUuid,
      token: params.token,
      expiresAt,
    });
  }

  public static fromServerDTO(dto: RefreshTokenServerDTO): RefreshToken {
    return new RefreshToken({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      token: dto.token,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      usedAt: dto.usedAt,
    });
  }

  public static fromPersistenceDTO(dto: RefreshTokenPersistenceDTO): RefreshToken {
    return new RefreshToken({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      token: dto.token,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      usedAt: dto.usedAt,
    });
  }

  // Business methods
  public isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }

  public markAsUsed(): void {
    this._usedAt = Date.now();
  }

  // DTO conversion
  public toServerDTO(): RefreshTokenServerDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      token: this.token,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      usedAt: this._usedAt,
    };
  }

  public toClientDTO(): RefreshTokenServerDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      token: this.token,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      usedAt: this._usedAt,
    };
  }

  public toPersistenceDTO(): RefreshTokenPersistenceDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      token: this.token,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      usedAt: this._usedAt,
    };
  }
}
