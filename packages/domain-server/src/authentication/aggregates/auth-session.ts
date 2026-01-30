/**
 * AuthSession 聚合根实现
 * 实现 AuthSessionServer 接口
 * 
 * 核心职责:
 * 1. 管理用户会话生命周期
 * 2. 支持多设备并发会话
 * 3. 实现会话续期和撤销逻辑
 */

import type {
  AuthSessionPersistenceDTO,
  AuthSessionServer,
  AuthSessionServerDTO,
  DeviceInfo as IDeviceInfo,
  AuthEventMap,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot } from '@dailyuse/utils';

import {
  SessionStatus,
  DeviceInfo,
AuthSessionId,

} from '@dailyuse/domain-shared/authentication';

import { IdentityId } from '@dailyuse/domain-shared/account';

// ================= 常量定义 =================

/** 默认会话有效期（毫秒）- 7 天 */
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
/** 滑动窗口刷新阈值（毫秒）- 1 小时 */
const SLIDING_WINDOW_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * AuthSession 聚合根
 * 管理用户的登录会话
 */
export class AuthSession extends AggregateRoot<AuthSessionId> implements AuthSessionServer {

  // ================= 1. 内部状态 (Backing Fields) =================
  private _identityId: IdentityId;
  private _deviceInfo: DeviceInfo;
  private _token: string;
  private _refreshTokenHash: string | undefined;
  private _status: typeof SessionStatus.ACTIVE;
  private _createdAt: Date;
  private _expiresAt: Date;
  private _lastActiveAt: Date;
  private _isRevoked: boolean;

  // ================= 2. 构造函数 (Private) =================
  private constructor(props: AuthSessionServerDTO) {
    super(props.id);

    this._identityId = props.identityId;
    this._deviceInfo = DeviceInfo.fromDTO(props.deviceInfo);
    this._token = props.token;
    this._refreshTokenHash = props.refreshTokenHash;
    this._status = SessionStatus.of(props.status);
    this._createdAt = new Date(props.createdAt);
    this._expiresAt = new Date(props.expiresAt);
    this._lastActiveAt = new Date(props.lastActiveAt);
    this._isRevoked = props.isRevoked;
  }

  // ================= 3. 公共属性 (Getters) =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get deviceInfo(): IDeviceInfo {
    return this._deviceInfo.toDTO();
  }

  get token(): string {
    return this._token;
  }

  get refreshTokenHash(): string | undefined {
    return this._refreshTokenHash;
  }

  get status(): typeof SessionStatus.ACTIVE {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get lastActiveAt(): Date {
    return this._lastActiveAt;
  }

  get isRevoked(): boolean {
    return this._isRevoked;
  }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 🏭 业务工厂：创建一个新的会话
   */
  public static create(params: {
    id: AuthSessionId;
    identityId: IdentityId;
    deviceInfo: IDeviceInfo;
    token: string;
    refreshTokenHash?: string;
    durationMs?: number;
  }): AuthSession {
    const now = Date.now();
    const duration = params.durationMs ?? DEFAULT_SESSION_DURATION_MS;

    const dto: AuthSessionServerDTO = {
      id: params.id,
      identityId: params.identityId,
      deviceInfo: params.deviceInfo,
      token: params.token,
      refreshTokenHash: params.refreshTokenHash,
      status: SessionStatus.ACTIVE,
      createdAt: now,
      expiresAt: now + duration,
      lastActiveAt: now,
      isRevoked: false,
    };

    const session = new AuthSession(dto);

    session.addDomainEvent<AuthEventMap['auth:login-success']>('auth:session-created' as keyof AuthEventMap, {
      ip: params.deviceInfo.ipAddress ?? '',
    });

    return session;
  }

  /**
   * 🏭 恢复工厂：从持久化 DTO 恢复
   */
  public static fromPersistenceDTO(dto: AuthSessionPersistenceDTO): AuthSession {
    const serverDTO: AuthSessionServerDTO = {
      id: dto.id,
      identityId: dto.identityId,
      deviceInfo: dto.deviceInfo,
      token: dto.token,
      refreshTokenHash: dto.refreshTokenHash,
      status: dto.status,
      createdAt: dto.createdAt.getTime(),
      expiresAt: dto.expiresAt.getTime(),
      lastActiveAt: dto.lastActiveAt.getTime(),
      isRevoked: dto.isRevoked,
    };
    return new AuthSession(serverDTO);
  }

  /**
   * 🏭 恢复工厂：从 Server DTO 恢复
   */
  public static fromServerDTO(dto: AuthSessionServerDTO): AuthSession {
    return new AuthSession(dto);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 检查会话是否有效
   */
  public isValid(): boolean {
    // 1. 检查是否被撤销
    if (this._isRevoked) {
      return false;
    }

    // 2. 检查状态
    if (!SessionStatus.isActive(this._status)) {
      return false;
    }

    // 3. 检查是否过期
    if (this.isExpired()) {
      return false;
    }

    return true;
  }

  /**
   * ✅ 检查会话是否过期
   */
  public isExpired(): boolean {
    return this._expiresAt.getTime() < Date.now();
  }

  /**
   * ✅ 刷新会话活跃时间（滑动窗口）
   * 只有当距离上次刷新超过阈值时才刷新
   */
  public touch(): boolean {
    if (!this.isValid()) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastActive = now - this._lastActiveAt.getTime();

    // 只有超过阈值才刷新，避免频繁更新
    if (timeSinceLastActive < SLIDING_WINDOW_THRESHOLD_MS) {
      return false;
    }

    this._lastActiveAt = new Date(now);
    return true;
  }

  /**
   * ✅ 续期会话
   */
  public extend(durationMs?: number): void {
    if (!this.isValid()) {
      throw new Error('Cannot extend an invalid session');
    }

    const duration = durationMs ?? DEFAULT_SESSION_DURATION_MS;
    const now = Date.now();

    this._expiresAt = new Date(now + duration);
    this._lastActiveAt = new Date(now);
  }

  /**
   * ✅ 撤销会话（用户登出）
   */
  public revoke(): void {
    if (this._isRevoked) {
      return; // 幂等
    }

    this._isRevoked = true;
    this._status = SessionStatus.REVOKED;

    this.addDomainEvent<AuthEventMap['auth:login-success']>('auth:session-revoked' as keyof AuthEventMap, {
      ip: this._deviceInfo.ipAddress ?? '',
    });
  }

  /**
   * ✅ 标记会话过期
   */
  public markExpired(): void {
    if (SessionStatus.isExpired(this._status)) {
      return; // 幂等
    }

    this._status = SessionStatus.EXPIRED;
  }

  /**
   * ✅ 更新刷新令牌哈希
   */
  public updateRefreshTokenHash(hash: string): void {
    if (!this.isValid()) {
      throw new Error('Cannot update refresh token on an invalid session');
    }

    this._refreshTokenHash = hash;
    this._lastActiveAt = new Date();
  }

  /**
   * ✅ 获取会话剩余有效时间（秒）
   */
  public getRemainingSeconds(): number {
    if (!this.isValid()) {
      return 0;
    }

    const remaining = this._expiresAt.getTime() - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * ✅ 检查是否是当前会话
   */
  public isCurrentSession(currentToken: string): boolean {
    return this._token === currentToken;
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): AuthSessionServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      deviceInfo: this._deviceInfo.toDTO(),
      token: this._token,
      refreshTokenHash: this._refreshTokenHash,
      status: this._status,
      createdAt: this._createdAt.getTime(),
      expiresAt: this._expiresAt.getTime(),
      lastActiveAt: this._lastActiveAt.getTime(),
      isRevoked: this._isRevoked,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): AuthSessionPersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      deviceInfo: this._deviceInfo.toDTO(),
      token: this._token,
      refreshTokenHash: this._refreshTokenHash,
      status: this._status,
      createdAt: this._createdAt,
      expiresAt: this._expiresAt,
      lastActiveAt: this._lastActiveAt,
      isRevoked: this._isRevoked,
    };
  }
}
