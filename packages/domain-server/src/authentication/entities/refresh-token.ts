/**
 * RefreshToken 实体实现
 * 实现 RefreshTokenServer 接口
 */

import type { RefreshTokenPersistenceDTO, RefreshTokenServer, RefreshTokenServerDTO } from '@dailyuse/contracts/authentication';
import { Entity, generateUUID } from '@dailyuse/utils';

export class RefreshToken extends Entity implements RefreshTokenServer {
  public readonly sessionUuid: string;
  public readonly token: string;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;
  private _usedAt: Date | null;

  constructor(params: {
    uuid?: string;
    sessionUuid: string;
    token: string;
    expiresAt: Date;
    createdAt?: Date;
    usedAt?: Date | null;
  }) {
    super(params.uuid ?? generateUUID());
    this.sessionUuid = params.sessionUuid;
    this.token = params.token;
    this.expiresAt = params.expiresAt;
    this.createdAt = params.createdAt ?? new Date();
    this._usedAt = params.usedAt ?? null;
  }

  public get usedAt(): Date | null {
    return this._usedAt;
  }

  // Factory methods
  public static create(params: {
    sessionUuid: string;
    token: string;
    expiresInDays?: number;
  }): RefreshToken {
    const expiresInDays = params.expiresInDays ?? 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

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
      expiresAt: new Date(dto.expiresAt),
      createdAt: new Date(dto.createdAt),
      usedAt: dto.usedAt ? new Date(dto.usedAt) : null,
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
    return new Date() > this.expiresAt;
  }

  public markAsUsed(): void {
    this._usedAt = new Date();
  }

  // DTO conversion
  public toServerDTO(): RefreshTokenServerDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      token: this.token,
      expiresAt: this.expiresAt.getTime(),
      createdAt: this.createdAt.getTime(),
      usedAt: this._usedAt ? this._usedAt.getTime() : null,
    };
  }

  public toClientDTO(): RefreshTokenServerDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      token: this.token,
      expiresAt: this.expiresAt.getTime(),
      createdAt: this.createdAt.getTime(),
      usedAt: this._usedAt ? this._usedAt.getTime() : null,
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
