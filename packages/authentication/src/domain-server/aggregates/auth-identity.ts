/**
 * AuthIdentity 聚合根实�?
 * 实现 AuthIdentityServer 接口
 * 
 * 核心职责:
 * 1. 管理多种凭证 (密码、OAuth、手机等)
 * 2. 协调凭证生命周期 (添加、删除、更�?
 * 3. 实施业务规则 (至少保留一个凭证、登录失败锁定等)
 */

import type {
  AuthIdentityPersistenceDTO,
  AuthIdentityServer,
  AuthIdentityServerDTO,
  AuthCredentialServer,
  AuthEventMap,
  PasswordCredentialServerDTO,
  PasswordCredentialPersistenceDTO,
  OAuthCredentialServerDTO,
  OAuthCredentialPersistenceDTO,
  PhoneCredentialServerDTO,
  PhoneCredentialPersistenceDTO,
  AuthCredentialServerDTO,
  AuthCredentialPersistenceDTO
} from '@dailyuse/contracts/authentication';
import { AggregateRoot } from '@dailyuse/utils';

import {
  AuthIdentityStatus,
  CredentialType,
  CredentialStatus,
  AuthCredentialId,
  HashedPassword,
  OAuthProvider,
  PlainPassword
} from '../../domain-shared';

import {
  IdentityId,
} from '@dailyuse/domain-shared/shared';

import {
  OAuthCredential,
  PhoneCredential,
  PasswordCredential
} from '../entities';
import type { IPasswordHasher } from '../../domain-shared';
import type { AuthIdentityClientDTO } from '@dailyuse/contracts/authentication';

// ================= 常量定义 =================

/** 最大登录失败次�?*/
const MAX_FAILED_ATTEMPTS = 5;
/** 锁定时长（毫秒）- 15分钟 */
const LOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * AuthIdentity 聚合�?
 * 管理用户的认证身份和凭证
 */
export class AuthIdentity extends AggregateRoot<IdentityId> implements AuthIdentityServer {

  // ================= 1. 内部状�?(Backing Fields) =================
  private _status: typeof AuthIdentityStatus.ACTIVE;
  private _failedLoginAttempts: number;
  private _lastFailedAttempt: Date | null;
  private _lockedUntil: Date | null;
  private _credentials: AuthCredentialServer[];
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. 构造函�?(Private) =================
  private constructor(props: AuthIdentityServerDTO) {
    super(props.id);

    this._status = AuthIdentityStatus.of(props.status);
    this._failedLoginAttempts = props.failedLoginAttempts;
    this._lastFailedAttempt = props.lastFailedAttempt ? new Date(props.lastFailedAttempt) : null;
    this._lockedUntil = props.lockedUntil ? new Date(props.lockedUntil) : null;
    this._credentials = props.credentials.map(cred => {
      if (cred.type === CredentialType.PASSWORD) {
        return PasswordCredential.fromServerDTO(cred as PasswordCredentialServerDTO);
      }
      if (cred.type === CredentialType.OAUTH) {
        return OAuthCredential.fromServerDTO(cred as OAuthCredentialServerDTO);
      }
      if (cred.type === CredentialType.PHONE) {
        return PhoneCredential.fromServerDTO(cred as PhoneCredentialServerDTO);
      }
      throw new Error(`Unknown credential type: ${cred.type}`);
    });
    this._version = props.version ?? 1;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
    this._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;
  }

  // ================= 3. 公共属�?(Getters) =================
  get status(): typeof AuthIdentityStatus.ACTIVE {
    return this._status;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get lastFailedAttempt(): Date | null {
    return this._lastFailedAttempt;
  }

  get lockedUntil(): Date | null {
    return this._lockedUntil;
  }

  get credentials(): AuthCredentialServer[] {
    return [...this._credentials];
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

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ================= 4. 工厂方法 (Factories) =================

  public static async createWithEmail(params: {
    email: string;
    plainPassword: string;
    hasher: IPasswordHasher;
  }): Promise<AuthIdentity> {
    const now = Date.now();

    const plainPassword = PlainPassword.create({ value: params.plainPassword });
    const hashedPassword = await HashedPassword.create(plainPassword, params.hasher);

    const passwordCredential = PasswordCredential.create({
      id: AuthCredentialId.generate(),
      hashedPassword: hashedPassword
    });

    const identityId = IdentityId.generate();
    const dto: AuthIdentityServerDTO = {
      id: identityId,
      status: AuthIdentityStatus.UNVERIFIED,
      credentials: [passwordCredential.toServerDTO()],
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const identity = new AuthIdentity(dto);
    
    identity.addDomainEvent<AuthEventMap['auth:identity-created']>('auth:identity-created', { 
      identityId: identityId,
      createMethod: 'EMAIL',
      email: params.email
    });

    return identity;
  }

  public static createWithOAuth(params: {
    provider: OAuthProvider;
    sub: string;
  }): AuthIdentity {
    const oauthCredential = OAuthCredential.create({
        id: AuthCredentialId.generate(),
        provider: params.provider,
        providerSubjectId: params.sub
    });

    const identityId = IdentityId.generate();
    const identity = new AuthIdentity({
        id: identityId,
        credentials: [oauthCredential.toServerDTO()],
        status: AuthIdentityStatus.UNVERIFIED,
        failedLoginAttempts: 0,
        lastFailedAttempt: null,
        lockedUntil: null,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
    });

    identity.addDomainEvent<AuthEventMap['auth:identity-created']>('auth:identity-created', { 
      identityId: identityId,
      createMethod: 'OAUTH',
      oauthProvider: params.provider
    });
    
    return identity;
  }

  public static fromPersistenceDTO(dto: AuthIdentityPersistenceDTO): AuthIdentity {
    const serverDTO: AuthIdentityServerDTO = {
      id: dto.id,
      status: dto.status,
      failedLoginAttempts: dto.failedLoginAttempts,
      lastFailedAttempt: dto.lastFailedAttempt?.getTime() ?? null,
      lockedUntil: dto.lockedUntil?.getTime() ?? null,
      credentials: dto.credentials.map(cred => {
      if (cred.type === CredentialType.PASSWORD) {
        return PasswordCredential.fromPersistenceDTO(cred as PasswordCredentialPersistenceDTO).toServerDTO();
      }
      if (cred.type === CredentialType.OAUTH) {
        return OAuthCredential.fromPersistenceDTO(cred as OAuthCredentialPersistenceDTO).toServerDTO();
      }
      if (cred.type === CredentialType.PHONE) {
        return PhoneCredential.fromPersistenceDTO(cred as PhoneCredentialPersistenceDTO).toServerDTO();
      }
      throw new Error(`Unknown credential type: ${cred.type}`);
      }),
      version: dto.version,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt?.getTime() ?? null,
    };
    return new AuthIdentity(serverDTO);
  }

  public static fromServerDTO(dto: AuthIdentityServerDTO): AuthIdentity {
    return new AuthIdentity(dto);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  public async verifyPassword(plainPassword: string, hasher: IPasswordHasher): Promise<boolean> {
    const credential = this.getCredentialByType(CredentialType.PASSWORD);

    if (credential instanceof PasswordCredential) {
      return credential.compare(plainPassword, hasher);
    }

    throw new Error('Credential not found or is not a password credential');
  }

  private refreshUpdatedAt(): void {
    this._updatedAt = new Date();
  }

  public activate(): void {
    if (AuthIdentityStatus.isActive(this._status)) {
      return;
    }

    if (AuthIdentityStatus.isDisabled(this._status)) {
      throw new Error('Cannot activate a disabled identity');
    }

    this._status = AuthIdentityStatus.ACTIVE;
    this.refreshUpdatedAt();

    this.addDomainEvent<AuthEventMap['auth:identity-activated']>('auth:identity-activated' as keyof AuthEventMap, {
      identityId: this.id,
    });
  }

  public recordFailedLogin(): void {
    this._failedLoginAttempts++;
    this._lastFailedAttempt = new Date();

    if (this._failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      this._lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      this._status = AuthIdentityStatus.LOCKED;
    }

    this.refreshUpdatedAt();
  }

  public resetFailedAttempts(): void {
    if (this._failedLoginAttempts === 0) {
      return;
    }

    this._failedLoginAttempts = 0;
    this._lastFailedAttempt = null;

    if (AuthIdentityStatus.isLocked(this._status)) {
      this._lockedUntil = null;
      this._status = AuthIdentityStatus.ACTIVE;
    }

    this.refreshUpdatedAt();
  }

  public isLocked(): boolean {
    if (!this._lockedUntil) {
      return false;
    }

    if (this._lockedUntil.getTime() < Date.now()) {
      this._lockedUntil = null;
      if (AuthIdentityStatus.isLocked(this._status)) {
        this._status = AuthIdentityStatus.ACTIVE;
      }
      this.refreshUpdatedAt();
      return false;
    }

    return true;
  }

  public isLoggedIn(): boolean {
    return AuthIdentityStatus.isActive(this._status) && !this.isLocked();
  }

  public clearLogin(): void {
    this.resetFailedAttempts();
  }

  public getLockRemainingSeconds(): number {
    if (!this._lockedUntil) {
      return 0;
    }

    const remaining = this._lockedUntil.getTime() - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  public addCredential(credential: AuthCredentialServer): void {
    const existingIndex = this._credentials.findIndex(
      c => c.type === credential.type && c.id === credential.id
    );

    if (existingIndex >= 0) {
      throw new Error(`Credential with id ${credential.id} already exists`);
    }

    this._credentials.push(credential);
    this.refreshUpdatedAt();
  }

  public removeCredential(credentialId: AuthCredentialId): void {
    if (this._credentials.length <= 1) {
      throw new Error('Cannot remove the last credential. At least one credential must be kept.');
    }

    const index = this._credentials.findIndex(c => c.id === credentialId);
    if (index < 0) {
      throw new Error(`Credential with id ${credentialId} not found`);
    }

    this._credentials.splice(index, 1);
    this.refreshUpdatedAt();
  }

  public getCredentialByType(type: typeof CredentialType.PASSWORD): AuthCredentialServer | null {
    return this._credentials.find(c => c.type === type) ?? null;
  }

  public hasPassword(): boolean {
    return this._credentials.some(c => c.type === CredentialType.PASSWORD);
  }

  public hasOAuth(): boolean {
    return this._credentials.some(c => c.type === CredentialType.OAUTH);
  }

  public disable(): void {
    if (AuthIdentityStatus.isDisabled(this._status)) {
      return;
    }

    this._status = AuthIdentityStatus.DISABLED;
    this.refreshUpdatedAt();

    this.addDomainEvent<AuthEventMap['auth:identity-disabled']>('auth:identity-disabled' as keyof AuthEventMap, {
      identityId: this.id,
    });
  }

  // ================= 6. 序列�?(Serialization) =================

  public toServerDTO(): AuthIdentityServerDTO {
    return {
      id: this.id,
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt?.getTime() ?? null,
      lockedUntil: this._lockedUntil?.getTime() ?? null,
      credentials: this._credentials.map(cred => {
        switch (cred.type) {
          case CredentialType.PASSWORD:
            return PasswordCredential.fromPersistenceDTO(cred as PasswordCredentialPersistenceDTO).toServerDTO();
          case CredentialType.OAUTH:
            return OAuthCredential.fromPersistenceDTO(cred as OAuthCredentialPersistenceDTO).toServerDTO();
          case CredentialType.PHONE:
            return PhoneCredential.fromPersistenceDTO(cred as PhoneCredentialPersistenceDTO).toServerDTO();
          default:
            throw new Error(`Unknown credential type: ${cred.type}`);
        }
      }),
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): AuthIdentityClientDTO {
    const hasPassword = this._credentials.some(c => c.type === CredentialType.PASSWORD);
    const hasOAuth = this._credentials.some(c => c.type === CredentialType.OAUTH);

    return {
      id: this.id,
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt?.getTime() ?? null,
      lockedUntil: this._lockedUntil?.getTime() ?? null,
      credentials: this._credentials.map(cred => {
        return {
          id: cred.id,
          type: cred.type,
          displayName: cred.type === CredentialType.OAUTH
            ? (cred as any).provider ?? 'OAuth'
            : cred.type === CredentialType.PASSWORD
              ? 'Password'
              : 'Phone',
          lastUsedAt: (cred as any).lastUsedAt?.getTime?.() ?? null,
          isPrimary: (cred as any).isPrimary ?? false,
          version: 1,
          createdAt: (cred as any).createdAt?.getTime?.() ?? Date.now(),
          updatedAt: (cred as any).updatedAt?.getTime?.() ?? Date.now(),
          deletedAt: null,
        };
      }),
      hasPassword,
      hasOAuth,
      version: 1,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: null,
    };
  }

  public toPersistenceDTO(): AuthIdentityPersistenceDTO {
    return {
      id: this.id,
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt,
      lockedUntil: this._lockedUntil,
      credentials: this._credentials,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
