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
  private readonly _props: AuthSessionClient;
  private readonly _isCurrentSession: boolean;

  // ================= 构造函数 (Private) =================
  private constructor(props: AuthSessionClient, isCurrentSession: boolean) {
    super(props.id);
    this._props = props;
    this._isCurrentSession = isCurrentSession;
  }

  // ================= 公共属性 (Getters) =================

  get identityId(): string {
    return String(this._props.identityId);
  }

  get deviceInfo(): IDeviceInfo {
    return this._props.deviceInfo;
  }

  get isCurrentSession(): boolean {
    return this._isCurrentSession;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get expiresAt(): Date {
    return this._props.expiresAt;
  }

  get lastActiveAt(): Date {
    return this._props.lastActiveAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ================= 查询方法 =================

  /**
   * 会话是否已过期
   */
  public isExpired(): boolean {
    return Date.now() > this._props.expiresAt.getTime();
  }

  /**
   * 会话是否即将过期（24小时内）
   */
  public isExpiringSoon(): boolean {
    const oneDayMs = 24 * 60 * 60 * 1000;
    return this._props.expiresAt.getTime() - Date.now() < oneDayMs;
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
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      expiresAt: new Date(dto.expiresAt),
      lastActiveAt: new Date(dto.lastActiveAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    }, dto.isCurrentSession);
  }

  // ================= DTO 转换 =================

  /**
   * 转换为 DTO
   */
  public toDTO(): AuthSessionClientDTO {
    return {
      id: this._props.id,
      identityId: String(this._props.identityId),
      deviceInfo: (this._props.deviceInfo as DeviceInfo).toDTO(),
      isCurrentSession: this._isCurrentSession,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      expiresAt: this._props.expiresAt.getTime(),
      lastActiveAt: this._props.lastActiveAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}
