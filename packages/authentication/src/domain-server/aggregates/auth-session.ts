/**
 * AuthSession Aggregate Root
 *
 * Core responsibilities:
 * 1. Manage user session lifecycle
 * 2. Support concurrent multi-device sessions
 * 3. Implement session renewal and revocation logic
 */

import type {
  AuthSessionServerDTO,
  DeviceInfo as IDeviceInfo,
  AuthEventMap,
  AuthSessionClientDTO,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot } from '@dailyuse/utils';

import { SessionStatus, DeviceInfo, AuthSessionId } from '../../domain-shared';

import { IdentityId } from '@dailyuse/domain-shared/shared';
import type { ITokenProvider } from '../services/token-provider.interface';

// ================= Constants =================

/** Access token duration (ms): 15 minutes */
export const ACCESS_TOKEN_DURATION_MS = 15 * 60 * 1000;
/** Refresh token duration (ms): 7 days */
export const REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
/** Default session duration (ms): 7 days */
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
/** Sliding window refresh threshold (ms): 1 hour */
const SLIDING_WINDOW_THRESHOLD_MS = 60 * 60 * 1000;

/** Domain state for AuthSession aggregate */
export interface AuthSessionState {
  id: AuthSessionId;
  identityId: IdentityId;
  deviceInfo: DeviceInfo;
  refreshTokenHash: string | undefined;
  status: typeof SessionStatus.Active;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  isRevoked: boolean;
}

/**
 * AuthSession Aggregate Root.
 * Manages a user's login session.
 */
export class AuthSession extends AggregateRoot<AuthSessionId> {
  // ================= 1. Internal State (Backing Fields) =================
  private _identityId: IdentityId;
  private _deviceInfo: DeviceInfo;
  private _refreshTokenHash: string | undefined;
  private _status: typeof SessionStatus.Active;
  private _createdAt: Date;
  private _expiresAt: Date;
  private _lastActiveAt: Date;
  private _isRevoked: boolean;

  // ================= 2. Constructor (Private) =================
  private constructor(state: AuthSessionState) {
    super(state.id);

    this._identityId = state.identityId;
    this._deviceInfo = state.deviceInfo;
    this._refreshTokenHash = state.refreshTokenHash;
    this._status = state.status;
    this._createdAt = state.createdAt;
    this._expiresAt = state.expiresAt;
    this._lastActiveAt = state.lastActiveAt;
    this._isRevoked = state.isRevoked;
  }

  // ================= 3. Public Properties (Getters) =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get deviceInfo(): IDeviceInfo {
    return this._deviceInfo.toDTO();
  }

  get refreshTokenHash(): string | undefined {
    return this._refreshTokenHash;
  }

  get status(): typeof SessionStatus.Active {
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

  // ================= 4. Factory Methods =================

  /**
   * Business factory: creates a new session.
   */
  public static create(params: {
    id: AuthSessionId;
    identityId: IdentityId;
    deviceInfo: IDeviceInfo;
    refreshTokenHash: string;
    expiresAt: number;
  }): AuthSession {
    const now = new Date();

    const state: AuthSessionState = {
      id: params.id,
      identityId: params.identityId,
      deviceInfo: DeviceInfo.fromDTO(params.deviceInfo),
      refreshTokenHash: params.refreshTokenHash,
      status: SessionStatus.Active,
      createdAt: now,
      expiresAt: new Date(params.expiresAt),
      lastActiveAt: now,
      isRevoked: false,
    };

    const session = new AuthSession(state);

    session.addDomainEvent<AuthEventMap['auth:session-created']>('auth:session-created', {
      identityId: params.identityId,
    });

    return session;
  }

  public static start(params: {
    identityId: IdentityId;
    deviceId: string;
    tokenProvider: ITokenProvider;
  }): { AuthSession: AuthSession; tokens: { accessToken: string; refreshToken: string } } {
    // Use a single session ID for both the JWT token and the persisted session
    const sessionId = AuthSessionId.generate();

    const tokens = params.tokenProvider.generateAuthTokens({
      identityId: params.identityId,
      sessionId,
    });

    const deviceInfo = DeviceInfo.createDefault(params.deviceId);

    const authSession = AuthSession.create({
      id: sessionId,
      identityId: params.identityId,
      // Pass DTO (plain object), not the DeviceInfo value object itself,
      // because AuthSession.create calls DeviceInfo.fromDTO() which spreads
      // the argument — spreading a ValueObject instance only copies the
      // `props` field, producing a nested { props: {...} } structure.
      deviceInfo: deviceInfo.toDTO(),
      refreshTokenHash: params.tokenProvider.hash(tokens.refreshToken),
      expiresAt: Date.now() + REFRESH_TOKEN_DURATION_MS,
    });

    return { AuthSession: authSession, tokens };
  }

  /**
   * Recovery factory: restores from domain state.
   */
  public static load(state: AuthSessionState): AuthSession {
    return new AuthSession(state);
  }

  // ================= 5. Business Actions =================

  /**
   * Checks whether the session is valid.
   */
  public isValid(): boolean {
    // 1. Check if revoked
    if (this._isRevoked) {
      return false;
    }

    // 2. Check status
    if (!SessionStatus.isActive(this._status)) {
      return false;
    }

    // 3. Check if expired
    if (this.isExpired()) {
      return false;
    }

    return true;
  }

  /**
   * Checks whether the session has expired.
   */
  public isExpired(): boolean {
    return this._expiresAt.getTime() < Date.now();
  }

  /**
   * Refreshes session activity timestamp (sliding window).
   * Only refreshes when time since last activity exceeds the threshold.
   */
  public touch(): boolean {
    if (!this.isValid()) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastActive = now - this._lastActiveAt.getTime();

    // Only refresh if threshold exceeded, to avoid frequent updates
    if (timeSinceLastActive < SLIDING_WINDOW_THRESHOLD_MS) {
      return false;
    }

    this._lastActiveAt = new Date(now);
    return true;
  }

  /**
   * Extends session expiration.
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
   * Revokes the session (user logout).
   */
  public revoke(): void {
    if (this._isRevoked) {
      return; // Idempotent
    }

    this._isRevoked = true;
    this._status = SessionStatus.Revoked;

    this.addDomainEvent<AuthEventMap['auth:session-revoked']>('auth:session-revoked', {
      identityId: this._identityId,
    });
  }

  /**
   * Marks the session as expired.
   */
  public markExpired(): void {
    if (SessionStatus.isExpired(this._status)) {
      return; // Idempotent
    }

    this._status = SessionStatus.Expired;
  }

  /**
   * Updates the refresh token hash.
   */
  public updateRefreshTokenHash(hash: string): void {
    if (!this.isValid()) {
      throw new Error('Cannot update refresh token on an invalid session');
    }

    this._refreshTokenHash = hash;
    this._lastActiveAt = new Date();
  }

  /**
   * Returns the remaining session validity in seconds.
   */
  public getRemainingSeconds(): number {
    if (!this.isValid()) {
      return 0;
    }

    const remaining = this._expiresAt.getTime() - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  // ================= 6. Serialization =================

  /**
   * Converts to Server DTO.
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
   * Converts to Client DTO.
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
}
