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
import { AggregateRoot } from '@dailyuse/utils/domain';

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
  version: number;
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
  // ================= 1. Internal State =================
  private _props: AuthSessionState;

  // ================= 2. Constructor (Private) =================
  private constructor(state: AuthSessionState) {
    super(state.id);
    this._props = state;
  }

  // ================= 3. Public Properties (Getters) =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get deviceInfo(): IDeviceInfo {
    return this._props.deviceInfo.toDTO();
  }

  get refreshTokenHash(): string | undefined {
    return this._props.refreshTokenHash;
  }

  get status(): typeof SessionStatus.Active {
    return this._props.status;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get expiresAt(): Date {
    return this._props.expiresAt;
  }

  get lastActiveAt(): Date {
    return this._props.lastActiveAt;
  }

  get isRevoked(): boolean {
    return this._props.isRevoked;
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
      version: 1,
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
    if (this._props.isRevoked) {
      return false;
    }

    // 2. Check status
    if (!SessionStatus.isActive(this._props.status)) {
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
    return this._props.expiresAt.getTime() < Date.now();
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
    const timeSinceLastActive = now - this._props.lastActiveAt.getTime();

    // Only refresh if threshold exceeded, to avoid frequent updates
    if (timeSinceLastActive < SLIDING_WINDOW_THRESHOLD_MS) {
      return false;
    }

    this._props.lastActiveAt = new Date(now);
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

    this._props.expiresAt = new Date(now + duration);
    this._props.lastActiveAt = new Date(now);
  }

  /**
   * Revokes the session (user logout).
   */
  public revoke(): void {
    if (this._props.isRevoked) {
      return; // Idempotent
    }

    this._props.isRevoked = true;
    this._props.status = SessionStatus.Revoked;

    this.addDomainEvent<AuthEventMap['auth:session-revoked']>('auth:session-revoked', {
      identityId: this._props.identityId,
    });
  }

  /**
   * Marks the session as expired.
   */
  public markExpired(): void {
    if (SessionStatus.isExpired(this._props.status)) {
      return; // Idempotent
    }

    this._props.status = SessionStatus.Expired;
  }

  /**
   * Updates the refresh token hash.
   */
  public updateRefreshTokenHash(hash: string): void {
    if (!this.isValid()) {
      throw new Error('Cannot update refresh token on an invalid session');
    }

    this._props.refreshTokenHash = hash;
    this._props.lastActiveAt = new Date();
  }

  /**
   * Returns the remaining session validity in seconds.
   */
  public getRemainingSeconds(): number {
    if (!this.isValid()) {
      return 0;
    }

    const remaining = this._props.expiresAt.getTime() - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  // ================= 6. Serialization =================

  /**
   * Converts to Server DTO.
   */
  public toServerDTO(): AuthSessionServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      deviceInfo: this._props.deviceInfo.toDTO(),
      refreshTokenHash: this._props.refreshTokenHash,
      status: this._props.status,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      expiresAt: this._props.expiresAt.getTime(),
      lastActiveAt: this._props.lastActiveAt.getTime(),
      isRevoked: this._props.isRevoked,
    };
  }

  /**
   * Converts to Client DTO.
   */
  public toClientDTO(isCurrentSession: boolean = false): AuthSessionClientDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      deviceInfo: this._props.deviceInfo.toDTO(),
      isCurrentSession,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.lastActiveAt.getTime(), // Use lastActiveAt as updatedAt
      expiresAt: this._props.expiresAt.getTime(),
      lastActiveAt: this._props.lastActiveAt.getTime(),
      deletedAt: this._props.isRevoked ? Date.now() : null,
    };
  }
}
