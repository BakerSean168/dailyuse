/**
 * AuthIdentity 聚合根实现
 *
 * 核心职责:
 * 1. 管理标识符集合 (邮箱/手机号 VO) —— 解决"如何找到用户"
 * 2. 管理 OAuth 绑定集合 (Entity 形式的标识符) —— 解决"通过第三方如何找到用户"
 * 3. 管理凭证集合 (仅密码凭证) —— 解决"如何验证用户"
 * 4. 协调生命周期 (添加、删除、更新)
 * 5. 实施业务规则 (至少保留一个登录途径、登录失败锁定等)
 */

import type {
  AuthIdentityServerDTO,
  AuthEventMap,
  AuthIdentifierDTO,
  OAuthBindingServerDTO,
  AuthIdentityClientDTO,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot } from '@dailyuse/utils';

import {
  AuthIdentityStatus,
  CredentialType,
  AuthCredentialId,
  HashedPassword,
  OAuthProvider,
  PlainPassword,
} from '../../domain-shared';

import { IdentityId } from '@dailyuse/domain-shared/shared';

import { PasswordCredential, OAuthBinding } from '../entities';
import { EmailIdentifier, PhoneIdentifier, type ConcreteIdentifier } from '../value-objects';
import type { IPasswordHasher } from '../../domain-shared';

// ================= 常量定义 =================

/** 最大登录失败次数 */
const MAX_FAILED_ATTEMPTS = 5;
/** 锁定时长（毫秒）- 15分钟 */
const LOCK_DURATION_MS = 15 * 60 * 1000;

/** Domain state for AuthIdentity aggregate */
export interface AuthIdentityState {
  id: IdentityId;
  status: typeof AuthIdentityStatus.Active;
  failedLoginAttempts: number;
  lastFailedAttempt: Date | null;
  lockedUntil: Date | null;
  identifiers: ConcreteIdentifier[];
  oauthBindings: OAuthBinding[];
  credentials: PasswordCredential[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * AuthIdentity 聚合根
 * 管理用户的认证身份、标识符、绑定和凭证
 */
export class AuthIdentity extends AggregateRoot<IdentityId> {
  // ================= 1. 内部状态 (Backing Fields) =================
  private _status: typeof AuthIdentityStatus.Active;
  private _failedLoginAttempts: number;
  private _lastFailedAttempt: Date | null;
  private _lockedUntil: Date | null;
  private _identifiers: ConcreteIdentifier[];
  private _oauthBindings: OAuthBinding[];
  private _credentials: PasswordCredential[];
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. 构造函数 (Private) =================
  private constructor(state: AuthIdentityState) {
    super(state.id);

    this._status = state.status;
    this._failedLoginAttempts = state.failedLoginAttempts;
    this._lastFailedAttempt = state.lastFailedAttempt;
    this._lockedUntil = state.lockedUntil;
    this._identifiers = [...state.identifiers];
    this._oauthBindings = [...state.oauthBindings];
    this._credentials = [...state.credentials];
    this._version = state.version;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
    this._deletedAt = state.deletedAt;
  }

  // ================= 3. 公共属性 (Getters) =================
  get status(): typeof AuthIdentityStatus.Active {
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

  get identifiers(): AuthIdentifierDTO[] {
    return this._identifiers.map((i) => i.toDTO());
  }

  get oauthBindings(): OAuthBindingServerDTO[] {
    return this._oauthBindings.map((b) => b.toServerDTO());
  }

  get credentials(): PasswordCredential[] {
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

  /**
   * 🏭 通过邮箱和密码创建身份
   * Email 进入 Identifier 集合，Password 进入 Credential 集合
   */
  public static async createWithEmailAndPassword(params: {
    email: string;
    plainPassword: string;
    hasher: IPasswordHasher;
  }): Promise<AuthIdentity> {
    const now = new Date();

    const plainPassword = PlainPassword.create({ value: params.plainPassword });
    const hashedPassword = await HashedPassword.create(plainPassword, params.hasher);

    const emailIdentifier = EmailIdentifier.create(params.email, false);
    const passwordCredential = PasswordCredential.create({
      id: AuthCredentialId.generate(),
      hashedPassword: hashedPassword,
    });

    const identityId = IdentityId.generate();
    const identity = new AuthIdentity({
      id: identityId,
      status: AuthIdentityStatus.Unverified,
      identifiers: [emailIdentifier],
      oauthBindings: [],
      credentials: [passwordCredential],
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    identity.addDomainEvent<AuthEventMap['auth:identity-created']>('auth:identity-created', {
      identityId: identityId,
      createMethod: 'Email',
      email: params.email,
    });

    return identity;
  }

  /**
   * 🏭 通过 OAuth 创建身份
   * OAuthBinding 进入 oauthBindings 集合
   */
  public static createWithOAuth(params: { provider: OAuthProvider; sub: string }): AuthIdentity {
    const oauthBinding = OAuthBinding.create({
      id: AuthCredentialId.generate(),
      provider: params.provider,
      providerSubjectId: params.sub,
    });

    const identityId = IdentityId.generate();
    const now = new Date();
    const identity = new AuthIdentity({
      id: identityId,
      identifiers: [],
      oauthBindings: [oauthBinding],
      credentials: [],
      status: AuthIdentityStatus.Unverified,
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    identity.addDomainEvent<AuthEventMap['auth:identity-created']>('auth:identity-created', {
      identityId: identityId,
      createMethod: 'Oauth',
      oauthProvider: params.provider,
    });

    return identity;
  }

  /**
   * 🏭 从持久化状态恢复
   */
  public static load(state: AuthIdentityState): AuthIdentity {
    return new AuthIdentity(state);
  }

  // ================= 5. 标识符操作方法 =================

  /**
   * 添加邮箱标识符
   */
  public addEmailIdentifier(email: string): void {
    const existing = this.findIdentifierByEmail(email);
    if (existing) throw new Error('Email already bound');
    this._identifiers.push(EmailIdentifier.create(email, false));
    this.refreshUpdatedAt();
  }

  /**
   * 移除邮箱标识符
   */
  public removeEmailIdentifier(email: string): void {
    const idx = this._identifiers.findIndex((i) => i.type === 'Email' && i.value === email);
    if (idx < 0) throw new Error('Email identifier not found');
    if (!this.hasOtherLoginPathAfterIdentifierRemoval(idx)) {
      throw new Error('Cannot remove the last login path');
    }
    this._identifiers.splice(idx, 1);
    this.refreshUpdatedAt();
  }

  /**
   * 添加手机标识符
   */
  public addPhoneIdentifier(phone: string): void {
    const existing = this.findIdentifierByPhone(phone);
    if (existing) throw new Error('Phone already bound');
    this._identifiers.push(PhoneIdentifier.create(phone, false));
    this.refreshUpdatedAt();
  }

  /**
   * 移除手机标识符
   */
  public removePhoneIdentifier(phone: string): void {
    const idx = this._identifiers.findIndex((i) => i.type === 'Phone' && i.value === phone);
    if (idx < 0) throw new Error('Phone identifier not found');
    if (!this.hasOtherLoginPathAfterIdentifierRemoval(idx)) {
      throw new Error('Cannot remove the last login path');
    }
    this._identifiers.splice(idx, 1);
    this.refreshUpdatedAt();
  }

  /**
   * 验证邮箱标识符
   */
  public verifyEmailIdentifier(email: string): void {
    const idx = this._identifiers.findIndex((i) => i.type === 'Email' && i.value === email);
    if (idx < 0) throw new Error('Email identifier not found');
    this._identifiers[idx] = (this._identifiers[idx] as EmailIdentifier).verify();
    this.refreshUpdatedAt();
  }

  /**
   * 验证手机标识符
   */
  public verifyPhoneIdentifier(phone: string): void {
    const idx = this._identifiers.findIndex((i) => i.type === 'Phone' && i.value === phone);
    if (idx < 0) throw new Error('Phone identifier not found');
    this._identifiers[idx] = (this._identifiers[idx] as PhoneIdentifier).verify();
    this.refreshUpdatedAt();
  }

  /**
   * 根据邮箱查找标识符
   */
  public findIdentifierByEmail(email: string): EmailIdentifier | null {
    return (
      (this._identifiers.find((i) => i.type === 'Email' && i.value === email) as EmailIdentifier) ??
      null
    );
  }

  /**
   * 根据手机号查找标识符
   */
  public findIdentifierByPhone(phone: string): PhoneIdentifier | null {
    return (
      (this._identifiers.find((i) => i.type === 'Phone' && i.value === phone) as PhoneIdentifier) ??
      null
    );
  }

  /**
   * 获取所有 OAuth 绑定
   */
  public getOAuthBindings(): OAuthBinding[] {
    return [...this._oauthBindings];
  }

  /**
   * 添加 OAuth 绑定
   */
  public addOAuthBinding(binding: OAuthBinding): void {
    const existing = this._oauthBindings.find(
      (b) => b.provider === binding.provider && b.providerSubjectId === binding.providerSubjectId,
    );
    if (existing) throw new Error(`OAuth binding for ${binding.provider} already exists`);
    this._oauthBindings.push(binding);
    this.refreshUpdatedAt();
  }

  /**
   * 移除 OAuth 绑定
   */
  public removeOAuthBinding(bindingId: string): void {
    const idx = this._oauthBindings.findIndex((b) => b.id === bindingId);
    if (idx < 0) throw new Error(`OAuth binding with id ${bindingId} not found`);
    if (!this.hasOtherLoginPathAfterOAuthRemoval(idx)) {
      throw new Error('Cannot remove the last login path');
    }
    this._oauthBindings.splice(idx, 1);
    this.refreshUpdatedAt();
  }

  // ================= 6. 业务行为 (Business Actions) =================

  public async verifyPassword(plainPassword: string, hasher: IPasswordHasher): Promise<boolean> {
    const credential = this.getCredentialByType(CredentialType.Password);

    if (!credential) {
      throw new Error('Credential not found or is not a password credential');
    }

    return credential.compare(plainPassword, hasher);
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

    this._status = AuthIdentityStatus.Active;
    this.refreshUpdatedAt();

    this.addDomainEvent<AuthEventMap['auth:identity-activated']>('auth:identity-activated', {
      identityId: this.id,
    });
  }

  public recordFailedLogin(): void {
    this._failedLoginAttempts++;
    this._lastFailedAttempt = new Date();

    if (this._failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      this._lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      this._status = AuthIdentityStatus.Locked;
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
      this._status = AuthIdentityStatus.Active;
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
        this._status = AuthIdentityStatus.Active;
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

  public addCredential(credential: PasswordCredential): void {
    const existingIndex = this._credentials.findIndex(
      (c) => c.type === credential.type && c.id === credential.id,
    );

    if (existingIndex >= 0) {
      throw new Error(`Credential with id ${credential.id} already exists`);
    }

    this._credentials.push(credential);
    this.refreshUpdatedAt();
  }

  public removeCredential(credentialId: AuthCredentialId): void {
    if (this._credentials.length <= 1 && this._oauthBindings.length === 0) {
      throw new Error('Cannot remove the last credential. At least one login path must be kept.');
    }

    const index = this._credentials.findIndex((c) => c.id === credentialId);
    if (index < 0) {
      throw new Error(`Credential with id ${credentialId} not found`);
    }

    this._credentials.splice(index, 1);
    this.refreshUpdatedAt();
  }

  public getCredentialByType(type: typeof CredentialType.Password): PasswordCredential | null {
    return this._credentials.find((c) => c.type === type) ?? null;
  }

  public hasPassword(): boolean {
    return this._credentials.some((c) => c.type === CredentialType.Password);
  }

  public hasEmail(): boolean {
    return this._identifiers.some((i) => i.type === 'Email');
  }

  public hasPhone(): boolean {
    return this._identifiers.some((i) => i.type === 'Phone');
  }

  public hasOAuth(): boolean {
    return this._oauthBindings.length > 0;
  }

  public disable(): void {
    if (AuthIdentityStatus.isDisabled(this._status)) {
      return;
    }

    this._status = AuthIdentityStatus.Disabled;
    this.refreshUpdatedAt();

    this.addDomainEvent<AuthEventMap['auth:identity-disabled']>('auth:identity-disabled', {
      identityId: this.id,
    });
  }

  // ================= 7. 私有辅助方法 =================

  /**
   * 移除某个标识符后，是否还有其他登录途径
   */
  private hasOtherLoginPathAfterIdentifierRemoval(removeIdx: number): boolean {
    const remainingIdentifiers = this._identifiers.filter((_, idx) => idx !== removeIdx);
    return (
      remainingIdentifiers.length > 0 ||
      this._oauthBindings.length > 0 ||
      this._credentials.length > 0
    );
  }

  /**
   * 移除某个 OAuth 绑定后，是否还有其他登录途径
   */
  private hasOtherLoginPathAfterOAuthRemoval(removeIdx: number): boolean {
    const remainingBindings = this._oauthBindings.filter((_, idx) => idx !== removeIdx);
    return (
      this._identifiers.length > 0 || remainingBindings.length > 0 || this._credentials.length > 0
    );
  }

  // ================= 8. 序列化 (Serialization) =================

  public toServerDTO(): AuthIdentityServerDTO {
    return {
      id: this.id,
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt?.getTime() ?? null,
      lockedUntil: this._lockedUntil?.getTime() ?? null,
      identifiers: this._identifiers.map((i) => i.toDTO()),
      oauthBindings: this._oauthBindings.map((b) => b.toServerDTO()),
      credentials: this._credentials.map((cred) => cred.toServerDTO()),
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): AuthIdentityClientDTO {
    return {
      id: this.id,
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt?.getTime() ?? null,
      lockedUntil: this._lockedUntil?.getTime() ?? null,
      identifiers: this._identifiers.map((i) => i.toDTO()),
      credentials: this._credentials.map((cred) => ({
        id: cred.id,
        type: cred.type,
        displayName: 'Password',
        lastUsedAt: cred.lastUsedAt?.getTime() ?? null,
        isPrimary: true,
        version: 1,
        createdAt: cred.createdAt.getTime(),
        updatedAt: cred.passwordLastChangedAt.getTime(),
        deletedAt: null,
      })),
      hasPassword: this.hasPassword(),
      hasEmail: this.hasEmail(),
      hasPhone: this.hasPhone(),
      hasOAuth: this.hasOAuth(),
      version: 1,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: null,
    };
  }
}
