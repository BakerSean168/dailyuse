/**
 * AuthSession Aggregate Root - Domain Client
 * 会话聚合根 - 领域客户端
 *
 * Client 端的会话是脱敏的：
 * - 不包含 Token 本体
 * - 显示用户友好的会话列表（当前设备、其他设备）
 */

import type {
  AuthSessionClient,
  AuthSessionClientDTO,
  DeviceInfo as IDeviceInfo,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot } from '@dailyuse/utils';

import {
  AuthSessionId,
  DeviceInfo,
} from '@dailyuse/domain-shared/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export class AuthSession extends AggregateRoot<AuthSessionId> implements AuthSessionClient {
  // ================= 内部状态 (Backing Fields) =================
  private _identityId: IdentityId;
  private _deviceInfo: DeviceInfo;
  private _isCurrentSession: boolean;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _expiresAt: Date;
  private _lastActiveAt: Date;
  private _deletedAt: Date | null;

  // ================= 构造函数 (Private) =================
  private constructor(params: {
    id: AuthSessionId;
    identityId: IdentityId;
    deviceInfo: DeviceInfo;
    isCurrentSession: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    lastActiveAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._deviceInfo = params.deviceInfo;
    this._isCurrentSession = params.isCurrentSession;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._expiresAt = params.expiresAt;
    this._lastActiveAt = params.lastActiveAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 公共属性 (Getters) =================

  get identityId(): string {
    return String(this._identityId);
  }

  get deviceInfo(): IDeviceInfo {
    return this._deviceInfo.toDTO();
  }

  get isCurrentSession(): boolean {
    return this._isCurrentSession;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get lastActiveAt(): Date {
    return this._lastActiveAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ================= 查询方法 =================

  /**
   * 会话是否已过期
   */
  public isExpired(): boolean {
    return Date.now() > this._expiresAt.getTime();
  }

  /**
   * 会话是否即将过期（24小时内）
   */
  public isExpiringSoon(): boolean {
    const oneDayMs = 24 * 60 * 60 * 1000;
    return this._expiresAt.getTime() - Date.now() < oneDayMs;
  }

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * 从 DTO 创建实例
   */
  public static fromDTO(dto: AuthSessionClientDTO): AuthSession {
    return new AuthSession({
      id: AuthSessionId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      deviceInfo: DeviceInfo.fromDTO(dto.deviceInfo),
      isCurrentSession: dto.isCurrentSession,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      expiresAt: new Date(dto.expiresAt),
      lastActiveAt: new Date(dto.lastActiveAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= DTO 转换 =================

  /**
   * 转换为 DTO
   */
  public toDTO(): AuthSessionClientDTO {
    return {
      id: this.id,
      identityId: String(this._identityId),
      deviceInfo: this._deviceInfo.toDTO(),
      isCurrentSession: this._isCurrentSession,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      expiresAt: this._expiresAt.getTime(),
      lastActiveAt: this._lastActiveAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}
