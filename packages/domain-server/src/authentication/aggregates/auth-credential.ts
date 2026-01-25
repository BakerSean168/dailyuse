/**
 * AuthCredential 聚合根实现
 * 实现 AuthCredentialServer 接口
 */

import type {
  ApiKeyCredentialServer,
  AuthCredentialClientDTO,
  AuthCredentialPersistenceDTO,
  AuthCredentialServer,
  AuthCredentialServerDTO,
  CredentialHistoryServer,
  PasswordCredentialServer,
  RememberMeTokenServer,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot, generateUUID } from '@dailyuse/utils';
import { PasswordCredential } from '../entities/password-credential';
import { ApiKeyCredential } from '../entities/api-key-credential';
import { RememberMeToken } from '../entities/remember-me-token';
import { CredentialHistory } from '../entities/credential-history';
import { DeviceInfo } from '../value-objects/device-info';
import crypto from 'crypto';

export class AuthCredential extends AggregateRoot implements AuthCredentialServer {
  public readonly accountUuid: string;
  public readonly type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  private _passwordCredential: PasswordCredential | null;
  private _apiKeyCredentials: ApiKeyCredential[];
  private _rememberMeTokens: RememberMeToken[];
  private _twoFactor: {
    enabled: boolean;
    secret?: string | null;
    backupCodes: string[];
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null;
  } | null;
  private _biometric: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: number | null;
  } | null;
  private _status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  private _security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null;
    lockedUntil?: number | null;
    lastPasswordChangeAt?: number | null;
  };
  private _history: CredentialHistory[];
  public readonly createdAt: number;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
    passwordCredential?: PasswordCredential | null;
    apiKeyCredentials?: ApiKeyCredential[];
    rememberMeTokens?: RememberMeToken[];
    twoFactor?: {
      enabled: boolean;
      secret?: string | null;
      backupCodes: string[];
      method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
      verifiedAt?: number | null;
    } | null;
    biometric?: {
      enabled: boolean;
      type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
      deviceId?: string | null;
      enrolledAt?: number | null;
    } | null;
    status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
    security?: {
      requirePasswordChange: boolean;
      passwordExpiresAt?: number | null;
      failedLoginAttempts: number;
      lastFailedLoginAt?: number | null;
      lockedUntil?: number | null;
      lastPasswordChangeAt?: number | null;
    };
    history?: CredentialHistory[];
    createdAt?: number;
    updatedAt?: number;
  }) {
    super(params.uuid ?? generateUUID());
    this.accountUuid = params.accountUuid;
    this.type = params.type;
    this._passwordCredential = params.passwordCredential ?? null;
    this._apiKeyCredentials = params.apiKeyCredentials ?? [];
    this._rememberMeTokens = params.rememberMeTokens ?? [];
    this._twoFactor = params.twoFactor ?? null;
    this._biometric = params.biometric ?? null;
    this._status = params.status ?? 'ACTIVE';
    this._security = params.security ?? {
      requirePasswordChange: false,
      failedLoginAttempts: 0,
    };
    this._history = params.history ?? [];
    this.createdAt = params.createdAt ?? new Date();
    this._updatedAt = params.updatedAt ?? new Date();
  }

  public get passwordCredential(): PasswordCredentialServer | null {
    return this._passwordCredential as any;
  }

  public get apiKeyCredentials(): ApiKeyCredentialServer[] {
    return this._apiKeyCredentials as any;
  }

  public get rememberMeTokens(): RememberMeTokenServer[] {
    return this._rememberMeTokens as any;
  }

  public get twoFactor() {
    return this._twoFactor;
  }

  public get biometric() {
    return this._biometric;
  }

  public get status(): 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED' {
    return this._status;
  }

  public get security() {
    return this._security;
  }

  public get history(): CredentialHistoryServer[] {
    return this._history as any;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Factory methods
  public static create(params: {
    accountUuid: string;
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
    hashedPassword?: string;
  }): AuthCredential {
    const credential = new AuthCredential({
      accountUuid: params.accountUuid,
      type: params.type,
    });

    if (params.hashedPassword && params.type === 'PASSWORD') {
      const passwordCred = PasswordCredential.create({
        credentialUuid: credential.uuid,
        hashedPassword: params.hashedPassword,
        salt: crypto.randomBytes(16).toString('hex'),
      });
      credential._passwordCredential = passwordCred;
    }

    credential._addHistory('CREDENTIAL_CREATED', { type: params.type });
    return credential;
  }

  public static fromServerDTO(dto: AuthCredentialServerDTO): AuthCredential {
    return new AuthCredential({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      type: dto.type,
      passwordCredential: dto.passwordCredential
        ? PasswordCredential.fromServerDTO(dto.passwordCredential as any)
        : null,
      apiKeyCredentials: dto.apiKeyCredentials.map((k) => ApiKeyCredential.fromServerDTO(k as any)),
      rememberMeTokens: dto.rememberMeTokens.map((t) => RememberMeToken.fromServerDTO(t as any)),
      twoFactor: dto.twoFactor,
      biometric: dto.biometric,
      status: dto.status,
      security: dto.security,
      history: dto.history.map((h) => CredentialHistory.fromServerDTO(h as any)),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromPersistenceDTO(dto: AuthCredentialPersistenceDTO): AuthCredential {
    const passwordCred = dto.password_credential ? JSON.parse(dto.password_credential) : null;
    const apiKeys = JSON.parse(dto.api_key_credentials);
    const tokens = JSON.parse(dto.remember_me_tokens);
    const twoFactor = dto.two_factor ? JSON.parse(dto.two_factor) : null;
    const biometric = dto.biometric ? JSON.parse(dto.biometric) : null;
    const security = JSON.parse(dto.security);
    
    // 防御性处理 history 字段 - 确保是有效的 JSON 字符串
    let history: any[];
    try {
      if (!dto.history || typeof dto.history !== 'string') {
        console.warn('[AuthCredential] Invalid history format, using empty array', {
          historyType: typeof dto.history,
          historyValue: dto.history,
          uuid: dto.uuid,
        });
        history = [];
      } else {
        history = JSON.parse(dto.history);
      }
    } catch (error) {
      console.error('[AuthCredential] Failed to parse history, using empty array', {
        error: error instanceof Error ? error.message : String(error),
        historyValue: dto.history,
        uuid: dto.uuid,
      });
      history = [];
    }

    return new AuthCredential({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      type: dto.type,
      passwordCredential: passwordCred ? PasswordCredential.fromPersistenceDTO(passwordCred) : null,
      apiKeyCredentials: apiKeys.map((k: any) => ApiKeyCredential.fromPersistenceDTO(k)),
      rememberMeTokens: tokens.map((t: any) => RememberMeToken.fromPersistenceDTO(t)),
      twoFactor,
      biometric,
      status: dto.status,
      security,
      history: history.map((h: any) => CredentialHistory.fromPersistenceDTO(h)),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // Password methods
  public setPassword(hashedPassword: string): void {
    if (!this._passwordCredential) {
      this._passwordCredential = PasswordCredential.create({
        credentialUuid: this.uuid,
        hashedPassword,
        salt: crypto.randomBytes(16).toString('hex'),
      });
    } else {
      this._passwordCredential = PasswordCredential.create({
        credentialUuid: this.uuid,
        hashedPassword,
        salt: crypto.randomBytes(16).toString('hex'),
      });
    }

    this._security.lastPasswordChangeAt = Date.now();
    this._security.requirePasswordChange = false;
    this._updatedAt = new Date();
    this._addHistory('PASSWORD_CHANGED');
  }

  public verifyPassword(hashedPassword: string): boolean {
    return this._passwordCredential?.hashedPassword === hashedPassword;
  }

  public requirePasswordChange(): void {
    this._security.requirePasswordChange = true;
    this._updatedAt = new Date();
    this._addHistory('PASSWORD_CHANGE_REQUIRED');
  }

  // Remember-Me Token methods
  public generateRememberMeToken(deviceInfo: any, expiresInDays = 30): RememberMeTokenServer {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenSeries = crypto.randomBytes(16).toString('hex');

    const device =
      deviceInfo instanceof DeviceInfo ? deviceInfo : DeviceInfo.fromServerDTO(deviceInfo);

    const token = RememberMeToken.create({
      credentialUuid: this.uuid,
      accountUuid: this.accountUuid,
      plainToken,
      tokenSeries,
      device,
      expiresInDays,
    });

    this._rememberMeTokens.push(token);
    this._updatedAt = new Date();
    this._addHistory('REMEMBER_ME_TOKEN_GENERATED', { deviceId: device.deviceId });

    return token as any;
  }

  public verifyRememberMeToken(
    token: string,
    deviceFingerprint: string,
  ): RememberMeTokenServer | null {
    const foundToken = this._rememberMeTokens.find(
      (t) => t.verifyToken(token) && t.verifyDevice(deviceFingerprint) && t.isValid(),
    );

    if (foundToken) {
      this._addHistory('REMEMBER_ME_TOKEN_VERIFIED', { tokenUuid: foundToken.uuid });
      return foundToken as any;
    }

    return null;
  }

  public refreshRememberMeToken(
    oldToken: string,
    deviceFingerprint: string,
  ): RememberMeTokenServer | null {
    const existingToken = this.verifyRememberMeToken(oldToken, deviceFingerprint);
    if (!existingToken) return null;

    // Revoke old token
    this.revokeRememberMeToken(existingToken.uuid);

    // Generate new token
    const device = this._rememberMeTokens.find((t) => t.uuid === existingToken.uuid)?.device;
    if (!device) return null;

    return this.generateRememberMeToken(device);
  }

  public revokeRememberMeToken(tokenUuid: string): void {
    const token = this._rememberMeTokens.find((t) => t.uuid === tokenUuid);
    if (token) {
      token.revoke();
      this._updatedAt = new Date();
      this._addHistory('REMEMBER_ME_TOKEN_REVOKED', { tokenUuid });
    }
  }

  public revokeAllRememberMeTokens(): void {
    this._rememberMeTokens.forEach((t) => t.revoke());
    this._updatedAt = new Date();
    this._addHistory('ALL_REMEMBER_ME_TOKENS_REVOKED');
  }

  public revokeRememberMeTokensByDevice(deviceId: string): void {
    this._rememberMeTokens.filter((t) => t.device.deviceId === deviceId).forEach((t) => t.revoke());
    this._updatedAt = new Date();
    this._addHistory('REMEMBER_ME_TOKENS_REVOKED_BY_DEVICE', { deviceId });
  }

  public cleanupExpiredRememberMeTokens(): void {
    const expiredCount = this._rememberMeTokens.filter((t) => t.isExpired()).length;
    this._rememberMeTokens = this._rememberMeTokens.filter((t) => !t.isExpired());
    if (expiredCount > 0) {
      this._updatedAt = new Date();
      this._addHistory('EXPIRED_REMEMBER_ME_TOKENS_CLEANED', { count: expiredCount });
    }
  }

  // API Key methods
  public generateApiKey(name: string, expiresInDays?: number): ApiKeyCredentialServer {
    const plainKey = crypto.randomBytes(32).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(plainKey).digest('hex');
    const keyPrefix = plainKey.substring(0, 8);

    const apiKey = ApiKeyCredential.create({
      credentialUuid: this.uuid,
      name,
      key: hashedKey,
      keyPrefix,
      expiresInDays,
    });

    this._apiKeyCredentials.push(apiKey);
    this._updatedAt = new Date();
    this._addHistory('API_KEY_GENERATED', { name, keyPrefix });

    return apiKey as any;
  }

  public revokeApiKey(keyUuid: string): void {
    const key = this._apiKeyCredentials.find((k) => k.uuid === keyUuid);
    if (key) {
      key.revoke();
      this._updatedAt = new Date();
      this._addHistory('API_KEY_REVOKED', { keyUuid });
    }
  }

  // Two-Factor methods
  public enableTwoFactor(method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP'): string {
    // Generate a random secret (TOTP secret generation should be handled by application layer)
    const secret = crypto.randomBytes(32).toString('hex');
    const backupCodes = this.generateBackupCodes();

    this._twoFactor = {
      enabled: true,
      secret,
      backupCodes,
      method,
      verifiedAt: Date.now(),
    };

    this._updatedAt = new Date();
    this._addHistory('TWO_FACTOR_ENABLED', { method });

    return secret;
  }

  public disableTwoFactor(): void {
    this._twoFactor = null;
    this._updatedAt = new Date();
    this._addHistory('TWO_FACTOR_DISABLED');
  }

  public verifyTwoFactorCode(code: string): boolean {
    if (!this._twoFactor?.enabled || !this._twoFactor.secret) return false;

    // TOTP verification should be handled by application layer
    // Domain layer only validates that 2FA is enabled
    this._addHistory('TWO_FACTOR_VERIFICATION_ATTEMPTED');
    return false;
  }

  public generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  public useBackupCode(code: string): boolean {
    if (!this._twoFactor?.enabled) return false;

    const index = this._twoFactor.backupCodes.indexOf(code.toUpperCase());
    if (index !== -1) {
      this._twoFactor.backupCodes.splice(index, 1);
      this._updatedAt = new Date();
      this._addHistory('BACKUP_CODE_USED');
      return true;
    }

    return false;
  }

  // Biometric methods
  public enrollBiometric(type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID', deviceId: string): void {
    this._biometric = {
      enabled: true,
      type,
      deviceId,
      enrolledAt: Date.now(),
    };

    this._updatedAt = new Date();
    this._addHistory('BIOMETRIC_ENROLLED', { type, deviceId });
  }

  public revokeBiometric(): void {
    this._biometric = null;
    this._updatedAt = new Date();
    this._addHistory('BIOMETRIC_REVOKED');
  }

  // Security methods
  public recordFailedLogin(): void {
    this._security.failedLoginAttempts++;
    this._security.lastFailedLoginAt = Date.now();

    if (this._security.failedLoginAttempts >= 5) {
      this._security.lockedUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
      this._addHistory('ACCOUNT_LOCKED', { reason: 'too_many_failed_attempts' });
    }

    this._updatedAt = new Date();
    this._addHistory('FAILED_LOGIN_RECORDED', { attempts: this._security.failedLoginAttempts });
  }

  public resetFailedAttempts(): void {
    this._security.failedLoginAttempts = 0;
    this._security.lastFailedLoginAt = null;
    this._security.lockedUntil = null;
    this._updatedAt = new Date();
    this._addHistory('FAILED_ATTEMPTS_RESET');
  }

  public isLocked(): boolean {
    if (!this._security.lockedUntil) return false;
    return Date.now() < this._security.lockedUntil;
  }

  public suspend(): void {
    this._status = 'SUSPENDED';
    this._updatedAt = new Date();
    this._addHistory('CREDENTIAL_SUSPENDED');
  }

  public activate(): void {
    this._status = 'ACTIVE';
    this._updatedAt = new Date();
    this._addHistory('CREDENTIAL_ACTIVATED');
  }

  public revoke(): void {
    this._status = 'REVOKED';
    this._updatedAt = new Date();
    this._addHistory('CREDENTIAL_REVOKED');
  }

  // DTO conversion
  public toServerDTO(): AuthCredentialServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      type: this.type,
      passwordCredential: this._passwordCredential,
      apiKeyCredentials: this._apiKeyCredentials,
      rememberMeTokens: this._rememberMeTokens,
      twoFactor: this._twoFactor,
      biometric: this._biometric,
      status: this._status,
      security: this._security,
      history: this._history,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): AuthCredentialClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      type: this.type,
      passwordCredential: this._passwordCredential ? this._passwordCredential.toClientDTO() : null,
      apiKeyCredentials: this._apiKeyCredentials.map((k) => k.toClientDTO()),
      rememberMeTokens: this._rememberMeTokens.map((t) => t.toClientDTO()),
      twoFactor: this._twoFactor
        ? {
            enabled: this._twoFactor.enabled,
            method: this._twoFactor.method,
            verifiedAt: this._twoFactor.verifiedAt,
          }
        : null,
      biometric: this._biometric,
      status: this._status,
      security: this._security,
      history: this._history.map((h) => h.toClientDTO()),
      createdAt: this.createdAt,
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toPersistenceDTO(): AuthCredentialPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      type: this.type,
      password_credential: this._passwordCredential
        ? JSON.stringify(this._passwordCredential.toPersistenceDTO())
        : null,
      api_key_credentials: JSON.stringify(this._apiKeyCredentials.map((k) => k.toPersistenceDTO())),
      remember_me_tokens: JSON.stringify(this._rememberMeTokens.map((t) => t.toPersistenceDTO())),
      two_factor: this._twoFactor ? JSON.stringify(this._twoFactor) : null,
      biometric: this._biometric ? JSON.stringify(this._biometric) : null,
      status: this._status,
      security: JSON.stringify(this._security),
      history: JSON.stringify(this._history.map((h) => h.toPersistenceDTO())),
      createdAt: this.createdAt,
      updatedAt: this._updatedAt.getTime(),
    };
  }

  // Private helper
  private _addHistory(action: string, details?: any): void {
    const history = CredentialHistory.create({
      credentialUuid: this.uuid,
      action,
      details,
    });
    this._history.push(history);
  }
}
