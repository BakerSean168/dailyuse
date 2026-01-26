/**
 * AuthSession 聚合根实现
 * 实现 AuthSessionServer 接口
 */

import type {
  AuthSessionClientDTO,
  AuthSessionPersistenceDTO,
  AuthSessionServer,
  AuthSessionServerDTO,
  DeviceInfoServer,
  RefreshTokenServer,
  SessionHistoryServer,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot, generateUUID } from '@dailyuse/utils';
import { RefreshToken } from '../entities/refresh-token';
import { SessionHistory } from '../entities/session-history';
import { DeviceInfo } from '../value-objects/device-info';
import crypto from 'crypto';

export class AuthSession extends AggregateRoot implements AuthSessionServer {
  public readonly accountUuid: string;
  private _accessToken: string;
  private _accessTokenExpiresAt: Date;
  private _refreshToken: RefreshToken;
  private _device: DeviceInfo;
  private _status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
  private _ipAddress: string;
  private _location: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  private _lastActivityAt: Date;
  private _lastActivityType: string | null;
  private _history: SessionHistory[];
  public readonly createdAt: Date;
  private _expiresAt: Date;
  private _revokedAt: Date | null;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: RefreshToken;
    device: DeviceInfo;
    status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
    ipAddress: string;
    location?: {
      country?: string | null;
      region?: string | null;
      city?: string | null;
      timezone?: string | null;
    } | null;
    lastActivityAt?: Date;
    lastActivityType?: string | null;
    history?: SessionHistory[];
    createdAt?: Date;
    expiresAt?: Date;
    revokedAt?: Date | null;
  }) {
    super(params.uuid ?? generateUUID());
    this.accountUuid = params.accountUuid;
    this._accessToken = params.accessToken;
    this._accessTokenExpiresAt = params.accessTokenExpiresAt;
    this._refreshToken = params.refreshToken;
    this._device = params.device;
    this._status = params.status ?? 'ACTIVE';
    this._ipAddress = params.ipAddress;
    this._location = params.location ?? null;
    const now = new Date();
    this._lastActivityAt = params.lastActivityAt ?? now;
    this._lastActivityType = params.lastActivityType ?? null;
    this._history = params.history ?? [];
    this.createdAt = params.createdAt ?? now;
    this._expiresAt = params.expiresAt ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
    this._revokedAt = params.revokedAt ?? null;
  }

  public get accessToken(): string {
    return this._accessToken;
  }

  public get accessTokenExpiresAt(): Date {
    return this._accessTokenExpiresAt;
  }

  public get refreshToken(): RefreshTokenServer {
    return this._refreshToken as any;
  }

  public get device(): DeviceInfoServer {
    return this._device as any;
  }

  public get status(): 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED' {
    return this._status;
  }

  public get ipAddress(): string {
    return this._ipAddress;
  }

  public get location() {
    return this._location;
  }

  public get lastActivityAt(): Date {
    return this._lastActivityAt;
  }

  public get lastActivityType(): string | null {
    return this._lastActivityType;
  }

  public get history(): SessionHistoryServer[] {
    return this._history as any;
  }

  public get expiresAt(): Date {
    return this._expiresAt;
  }

  public get revokedAt(): Date | null {
    return this._revokedAt;
  }

  // Factory methods
  public static create(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    device: DeviceInfoServer;
    ipAddress: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): AuthSession {
    const device =
      params.device instanceof DeviceInfo ? params.device : DeviceInfo.fromServerDTO(params.device);

    const refreshToken = RefreshToken.create({
      sessionUuid: '', // Will be set after session creation
      token: params.refreshToken,
      expiresInDays: 30,
    });

    const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const session = new AuthSession({
      accountUuid: params.accountUuid,
      accessToken: params.accessToken,
      accessTokenExpiresAt,
      refreshToken,
      device,
      ipAddress: params.ipAddress,
      location: params.location,
    });

    // Update refresh token with session UUID
    session._refreshToken = RefreshToken.create({
      sessionUuid: session.uuid,
      token: params.refreshToken,
      expiresInDays: 30,
    });

    session._addHistory('SESSION_CREATED', { ipAddress: params.ipAddress });
    return session;
  }

  public static fromServerDTO(dto: AuthSessionServerDTO): AuthSession {
    return new AuthSession({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      accessToken: dto.accessToken,
      accessTokenExpiresAt: new Date(dto.accessTokenExpiresAt),
      refreshToken: RefreshToken.fromServerDTO(dto.refreshToken as any),
      device: DeviceInfo.fromServerDTO(dto.device as any),
      status: dto.status,
      ipAddress: dto.ipAddress,
      location: dto.location,
      lastActivityAt: new Date(dto.lastActivityAt),
      lastActivityType: dto.lastActivityType,
      history: dto.history.map((h) => SessionHistory.fromServerDTO(h as any)),
      createdAt: new Date(dto.createdAt),
      expiresAt: new Date(dto.expiresAt),
      revokedAt: dto.revokedAt ? new Date(dto.revokedAt) : null,
    });
  }

  public static fromPersistenceDTO(dto: AuthSessionPersistenceDTO): AuthSession {
    const refreshToken = RefreshToken.fromPersistenceDTO({
      uuid: '', // Assuming not stored directly, can be generated or omitted
      sessionUuid: dto.uuid,
      token: dto.refreshToken,
      expiresAt: dto.refreshTokenExpiresAt,
      createdAt: 0, // Assuming not stored, default value
      usedAt: null, // Assuming not stored, default value
    });

    const device = DeviceInfo.fromServerDTO({
      deviceId: dto.deviceId,
      deviceType: dto.deviceType === 'DESKTOP' ? 'DESKTOP' : 'UNKNOWN',
      os: dto.deviceOs,
      browser: dto.deviceBrowser,
      deviceFingerprint: '', // Assuming not stored
      firstSeenAt: 0, // Assuming not stored
      lastSeenAt: 0, // Assuming not stored
    });

    const location = {
      country: dto.locationCountry,
      region: dto.locationRegion,
      city: dto.locationCity,
      timezone: dto.locationTimezone,
    };

    const history = JSON.parse(dto.history);

    return new AuthSession({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      accessToken: dto.accessToken,
      accessTokenExpiresAt: dto.accessTokenExpiresAt,
      refreshToken,
      device,
      status: dto.status,
      ipAddress: dto.ipAddress,
      location,
      lastActivityAt: dto.lastActivityAt,
      lastActivityType: dto.lastActivityType,
      history: history.map((h: any) => SessionHistory.fromPersistenceDTO(h)),
      createdAt: dto.createdAt,
      expiresAt: dto.expiresAt,
      revokedAt: dto.revokedAt,
    });
  }

  // Business methods
  public refreshAccessToken(newToken: string, expiresInMinutes: number): void {
    this._accessToken = newToken;
    this._accessTokenExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    this._lastActivityAt = new Date();
    this._addHistory('ACCESS_TOKEN_REFRESHED');
  }

  public refreshRefreshToken(): void {
    const newToken = crypto.randomBytes(32).toString('hex');
    this._refreshToken = RefreshToken.create({
      sessionUuid: this.uuid,
      token: newToken,
      expiresInDays: 30,
    });
    // 🔥 修复：同时更新 Session 的 expiresAt（Sliding Window）
    this._expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    this._lastActivityAt = new Date();
    this._addHistory('REFRESH_TOKEN_REFRESHED');
  }

  public isAccessTokenExpired(): boolean {
    return new Date() > this._accessTokenExpiresAt;
  }

  public isRefreshTokenExpired(): boolean {
    return this._refreshToken.isExpired();
  }

  public isValid(): boolean {
    // 检查三个条件：1. 状态为 ACTIVE；2. RefreshToken 未过期；3. Session 未过期
    // expiresAt 会随 refreshRefreshToken() 自动续期（Sliding Window）
    return (
      this._status === 'ACTIVE' && !this.isRefreshTokenExpired() && new Date() < this._expiresAt
    );
  }

  public recordActivity(activityType: string): void {
    this._lastActivityAt = new Date();
    this._lastActivityType = activityType;
    this._addHistory('ACTIVITY_RECORDED', { activityType });
  }

  public updateDeviceInfo(device: Partial<DeviceInfoServer>): void {
    this._device = DeviceInfo.fromServerDTO({
      ...this._device.toServerDTO(),
      ...device,
    } as any);
    this._addHistory('DEVICE_INFO_UPDATED');
  }

  public revoke(): void {
    this._status = 'REVOKED';
    this._revokedAt = new Date();
    this._addHistory('SESSION_REVOKED');
  }

  public lock(): void {
    this._status = 'LOCKED';
    this._addHistory('SESSION_LOCKED');
  }

  public activate(): void {
    this._status = 'ACTIVE';
    this._addHistory('SESSION_ACTIVATED');
  }

  public extend(hours: number): void {
    this._expiresAt = new Date(this._expiresAt.getTime() + hours * 60 * 60 * 1000);
    this._addHistory('SESSION_EXTENDED', { hours });
  }

  // DTO conversion
  public toServerDTO(): AuthSessionServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      accessToken: this._accessToken,
      accessTokenExpiresAt: this._accessTokenExpiresAt.getTime(),
      refreshToken: this._refreshToken as any,
      device: this._device as any,
      status: this._status,
      ipAddress: this._ipAddress,
      location: this._location,
      lastActivityAt: this._lastActivityAt.getTime(),
      lastActivityType: this._lastActivityType,
      history: this._history as any,
      createdAt: this.createdAt.getTime(),
      expiresAt: this.expiresAt.getTime(),
      revokedAt: this._revokedAt ? this._revokedAt.getTime() : null,
    };
  }

  public toClientDTO(): AuthSessionClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      accessToken: this._accessToken,
      accessTokenExpiresAt: this._accessTokenExpiresAt.getTime(),
      refreshToken: this._refreshToken as any,
      device: this._device as any,
      status: this._status,
      ipAddress: this._ipAddress,
      location: this._location,
      lastActivityAt: this._lastActivityAt.getTime(),
      lastActivityType: this._lastActivityType,
      history: this._history as any,
      createdAt: this.createdAt.getTime(),
      expiresAt: this.expiresAt.getTime(),
      revokedAt: this._revokedAt ? this._revokedAt.getTime() : null,
    };
  }

  public toPersistenceDTO(): AuthSessionPersistenceDTO {
    const refreshTokenDTO = this._refreshToken.toPersistenceDTO();
    const deviceDTO = this._device.toServerDTO();

    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      accessToken: this._accessToken,
      accessTokenExpiresAt: this._accessTokenExpiresAt,

      // Flattened refresh token
      refreshToken: refreshTokenDTO.token,
      refreshTokenExpiresAt: refreshTokenDTO.expiresAt,

      // Flattened device info
      deviceId: deviceDTO.deviceId,
      deviceType: deviceDTO.deviceType,
      deviceOs: deviceDTO.os,
      deviceBrowser: deviceDTO.browser,

      status: this._status,
      ipAddress: this._ipAddress,

      // Flattened location
      locationCountry: this._location?.country,
      locationRegion: this._location?.region,
      locationCity: this._location?.city,
      locationTimezone: this._location?.timezone,

      lastActivityAt: this._lastActivityAt,
      lastActivityType: this._lastActivityType,
      history: JSON.stringify(this._history.map((h) => h.toPersistenceDTO())),
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      revokedAt: this._revokedAt,
    };
  }

  // Private helper
  private _addHistory(action: string, details?: any): void {
    const history = SessionHistory.create({
      sessionUuid: this.uuid,
      action,
      details,
    });
    this._history.push(history);
  }
}
