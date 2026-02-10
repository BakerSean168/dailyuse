/**
 * AuthSession 聚合根实�?
 * 实现 AuthSessionServer 接口
 * 
 * 核心职责:
 * 1. 管理用户会话生命周期
 * 2. 支持多设备并发会�?
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

} from '../../domain-shared';

import { IdentityId } from '@dailyuse/domain-shared/shared';
import type { ITokenProvider } from '../services/token-provider.interface';

import type { AuthSessionClientDTO } from '@dailyuse/contracts/authentication';

// ================= 常量定义 =================

/** Access Token 有效期（毫秒�? 15 分钟 */
export const ACCESS_TOKEN_DURATION_MS = 15 * 60 * 1000;
/** Refresh Token 有效期（毫秒�? 7 �?*/
export const REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
/** 默认会话有效期（毫秒�? 7 �?*/
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
/** 滑动窗口刷新阈值（毫秒�? 1 小时 */
const SLIDING_WINDOW_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * AuthSession 聚合�?
 * 管理用户的登录会�?
 */
export class AuthSession extends AggregateRoot<AuthSessionId> implements AuthSessionServer {

  // ================= 1. 内部状�?(Backing Fields) =================
  private _identityId: IdentityId;
  private _deviceInfo: DeviceInfo;
  private _refreshTokenHash: string | undefined;
  private _status: typeof SessionStatus.ACTIVE;
  private _createdAt: Date;
  private _expiresAt: Date;
  private _lastActiveAt: Date;
  private _isRevoked: boolean;

  // ================= 2. 构造函�?(Private) =================
  private constructor(props: AuthSessionServerDTO) {
    super(props.id);

    this._identityId = props.identityId;
    this._deviceInfo = DeviceInfo.fromDTO(props.deviceInfo);
    this._refreshTokenHash = props.refreshTokenHash;
    this._status = SessionStatus.of(props.status);
    this._createdAt = new Date(props.createdAt);
    this._expiresAt = new Date(props.expiresAt);
    this._lastActiveAt = new Date(props.lastActiveAt);
    this._isRevoked = props.isRevoked;
  }

  // ================= 3. 公共属�?(Getters) =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get deviceInfo(): IDeviceInfo {
    return this._deviceInfo.toDTO();
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
   * 🏭 业务工厂：创建一个新的会�?
   */
  public static create(params: {
    id: AuthSessionId;
    identityId: IdentityId;
    deviceInfo: IDeviceInfo;
    refreshTokenHash: string;
    expiresAt: number;
  }): AuthSession {
    const now = Date.now();

    const dto: AuthSessionServerDTO = {
      id: params.id,
      identityId: params.identityId,
      deviceInfo: params.deviceInfo,
      status: SessionStatus.ACTIVE,
      createdAt: now,
      expiresAt: params.expiresAt,
      lastActiveAt: now,
      isRevoked: false,
    };

    const session = new AuthSession(dto);

    session.addDomainEvent<AuthEventMap['auth:session-created']>('auth:session-created', {
      identityId: params.identityId,
    });

    return session;
  }

  public static start(params: {
    identityId: IdentityId;
    deviceId: string;
    tokenProvider: ITokenProvider;
  }): {AuthSession: AuthSession, tokens: {accessToken: string, refreshToken: string}} {

    const tokens = params.tokenProvider.generateAuthTokens({
      identityId: params.identityId,
      sessionId: AuthSessionId.generate(),
    });

    const deviceInfo = DeviceInfo.createDefault(params.deviceId);

    const authSession = AuthSession.create({
      id: AuthSessionId.generate(),
      identityId: params.identityId,
      deviceInfo: deviceInfo,
      refreshTokenHash: params.tokenProvider.hash(tokens.refreshToken),
      expiresAt: Date.now() + REFRESH_TOKEN_DURATION_MS,
    });

    return {AuthSession: authSession, tokens};
  }

  /**
   * 🏭 恢复工厂：从持久�?DTO 恢复
   */
  public static fromPersistenceDTO(dto: AuthSessionPersistenceDTO): AuthSession {
    const serverDTO: AuthSessionServerDTO = {
      id: dto.id,
      identityId: dto.identityId,
      deviceInfo: dto.deviceInfo,
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
   * �?检查会话是否有�?
   */
  public isValid(): boolean {
    // 1. 检查是否被撤销
    if (this._isRevoked) {
      return false;
    }

    // 2. 检查状�?
    if (!SessionStatus.isActive(this._status)) {
      return false;
    }

    // 3. 检查是否过�?
    if (this.isExpired()) {
      return false;
    }

    return true;
  }

  /**
   * �?检查会话是否过�?
   */
  public isExpired(): boolean {
    return this._expiresAt.getTime() < Date.now();
  }

  /**
   * �?刷新会话活跃时间（滑动窗口）
   * 只有当距离上次刷新超过阈值时才刷�?
   */
  public touch(): boolean {
    if (!this.isValid()) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastActive = now - this._lastActiveAt.getTime();

    // 只有超过阈值才刷新，避免频繁更�?
    if (timeSinceLastActive < SLIDING_WINDOW_THRESHOLD_MS) {
      return false;
    }

    this._lastActiveAt = new Date(now);
    return true;
  }

  /**
   * �?续期会话
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
   * �?撤销会话（用户登出）
   */
  public revoke(): void {
    if (this._isRevoked) {
      return; // 幂等
    }

    this._isRevoked = true;
    this._status = SessionStatus.REVOKED;

    this.addDomainEvent<AuthEventMap['auth:session-revoked']>('auth:session-revoked', {
      identityId: this._identityId,
    });
  }

  /**
   * �?标记会话过期
   */
  public markExpired(): void {
    if (SessionStatus.isExpired(this._status)) {
      return; // 幂等
    }

    this._status = SessionStatus.EXPIRED;
  }

  /**
   * �?更新刷新令牌哈希
   */
  public updateRefreshTokenHash(hash: string): void {
    if (!this.isValid()) {
      throw new Error('Cannot update refresh token on an invalid session');
    }

    this._refreshTokenHash = hash;
    this._lastActiveAt = new Date();
  }

  /**
   * �?获取会话剩余有效时间（秒�?
   */
  public getRemainingSeconds(): number {
    if (!this.isValid()) {
      return 0;
    }

    const remaining = this._expiresAt.getTime() - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }


  // ================= 6. 序列�?(Serialization) =================

  /**
   * 转换�?Server DTO
   */
  public toServerDTO(): AuthSessionServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      deviceInfo: this._deviceInfo.toDTO(),
      refreshTokenHash: this._refreshTokenHash,
      status: this._status,
      createdAt: this._createdAt.getTime(),
      expiresAt: this._expiresAt.getTime(),
      lastActiveAt: this._lastActiveAt.getTime(),
      isRevoked: this._isRevoked,
    };
  }

  /**
   * 转换�?Client DTO
   */
  public toClientDTO(isCurrentSession: boolean = false): AuthSessionClientDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      deviceInfo: this._deviceInfo.toDTO(),
      isCurrentSession,
      version: 1,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._lastActiveAt.getTime(), // Use lastActiveAt as updatedAt
      expiresAt: this._expiresAt.getTime(),
      lastActiveAt: this._lastActiveAt.getTime(),
      deletedAt: this._isRevoked ? Date.now() : null,
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
      refreshTokenHash: this._refreshTokenHash,
      status: this._status,
      createdAt: this._createdAt,
      expiresAt: this._expiresAt,
      lastActiveAt: this._lastActiveAt,
      isRevoked: this._isRevoked,
    };
  }
}
