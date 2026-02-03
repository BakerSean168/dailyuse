/**
 * AuthIdentity 聚合根实现
 * 实现 AuthIdentityServer 接口
 * 
 * 核心职责:
 * 1. 管理多种凭证 (密码、OAuth、手机等)
 * 2. 协调凭证生命周期 (添加、删除、更新)
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
} from '@dailyuse/domain-shared/authentication';

import {
    IdentityId,
} from '@dailyuse/domain-shared';

import {
  OAuthCredential,
  PhoneCredential,
  PasswordCredential
} from '../entities';



// ================= 常量定义 =================

/** 最大登录失败次数 */
const MAX_FAILED_ATTEMPTS = 5;
/** 锁定时长（毫秒）- 15分钟 */
const LOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * AuthIdentity 聚合根
 * 管理用户的认证身份和凭证
 */
export class AuthIdentity extends AggregateRoot<IdentityId> implements AuthIdentityServer {

  // ================= 1. 内部状态 (Backing Fields) =================
  private _status: typeof AuthIdentityStatus.ACTIVE;
  private _failedLoginAttempts: number;
  private _lastFailedAttempt: Date | null;
  private _lockedUntil: Date | null;
  private _credentials: AuthCredentialServer[];
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. 构造函数 (Private) =================
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
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
  }

  // ================= 3. 公共属性 (Getters) =================
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
    return [...this._credentials]; // 返回副本，防止外部修改
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 场景 A: 邮箱密码注册
   * Service 只需要传 ID 和 哈希好的密码，不需要知道 Credential 怎么创建
   */
  public static async createWithEmail(params: {
    email: string; // 这里的 email 仅用于校验或作为初始状态
    plainPassword: string; // 接收值对象
  }): Promise<AuthIdentity> {
    const now = Date.now();

    const plainPassword = PlainPassword.create({ value: params.plainPassword });
    const hashedPassword = await HashedPassword.create(plainPassword);

    // 1. 聚合根内部负责创建对应的凭证实体
    // 这样 PasswordCredential 的创建逻辑就被封装在 Identity 内部了
    const passwordCredential = PasswordCredential.create({
      id: AuthCredentialId.generate(), // 凭证 ID 也可以在这里生成
      hashedPassword: hashedPassword
    });

    const identityId = IdentityId.generate();
    // 2. 组装 DTO
    const dto: AuthIdentityServerDTO = {
      id: identityId,
      status: AuthIdentityStatus.UNVERIFIED, // 默认未验证
      credentials: [passwordCredential.toServerDTO()],     // 放入凭证列表
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
    };

    const identity = new AuthIdentity(dto);
    
    // 3. 发出事件
    identity.addDomainEvent('auth:identity-created', { 
      identityId: identityId,
      createMethod: 'EMAIL' 
    });

    return identity;
  }

  /**
   * 场景 B: OAuth 注册
   */
  public static createWithOAuth(params: {
    provider: OAuthProvider;
    sub: string;
  }): AuthIdentity {
    // 1. 内部创建 OAuth 凭证
    const oauthCredential = OAuthCredential.create({
        id: AuthCredentialId.generate(),
        provider: params.provider,
        providerSubjectId: params.sub

    });

    const identityId = IdentityId.generate();
    // 2. 组装
    const identity = new AuthIdentity({
        id: identityId,
        credentials: [oauthCredential.toServerDTO()],
        status: AuthIdentityStatus.UNVERIFIED, // OAuth 通常直接激活
        failedLoginAttempts: 0,
        lastFailedAttempt: null,
        lockedUntil: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    identity.addDomainEvent('auth:identity-created', { 
      identityId: identityId,
      createMethod: 'OAUTH' 
    });
    
    return identity;
  }

  /**
   * 🏭 恢复工厂：从持久化 DTO 恢复
   */
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
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    };
    return new AuthIdentity(serverDTO);
  }

  /**
   * 🏭 恢复工厂：从 Server DTO 恢复
   */
  public static fromServerDTO(dto: AuthIdentityServerDTO): AuthIdentity {
    return new AuthIdentity(dto);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * 刷新更新时间
   */
  private refreshUpdatedAt(): void {
    this._updatedAt = new Date();
  }

  /**
   * ✅ 激活身份（邮箱验证完成后）
   */
  public activate(): void {
    if (AuthIdentityStatus.isActive(this._status)) {
      return; // 幂等
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

  /**
   * ✅ 记录登录失败
   */
  public recordFailedLogin(): void {
    this._failedLoginAttempts++;
    this._lastFailedAttempt = new Date();

    // 超过最大次数，锁定账户
    if (this._failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      this._lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      this._status = AuthIdentityStatus.LOCKED;
    }

    this.refreshUpdatedAt();
  }

  /**
   * ✅ 重置登录失败计数（登录成功后调用）
   */
  public resetFailedAttempts(): void {
    if (this._failedLoginAttempts === 0) {
      return; // 幂等
    }

    this._failedLoginAttempts = 0;
    this._lastFailedAttempt = null;

    // 如果之前是锁定状态，解锁
    if (AuthIdentityStatus.isLocked(this._status)) {
      this._lockedUntil = null;
      this._status = AuthIdentityStatus.ACTIVE;
    }

    this.refreshUpdatedAt();
  }

  /**
   * ✅ 检查是否被锁定
   */
  public isLocked(): boolean {
    if (!this._lockedUntil) {
      return false;
    }

    // 检查锁定是否已过期
    if (this._lockedUntil.getTime() < Date.now()) {
      // 自动解锁
      this._lockedUntil = null;
      if (AuthIdentityStatus.isLocked(this._status)) {
        this._status = AuthIdentityStatus.ACTIVE;
      }
      this.refreshUpdatedAt();
      return false;
    }

    return true;
  }

  /**
   * ✅ 获取锁定剩余时间（秒）
   */
  public getLockRemainingSeconds(): number {
    if (!this._lockedUntil) {
      return 0;
    }

    const remaining = this._lockedUntil.getTime() - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * ✅ 添加凭证
   */
  public addCredential(credential: AuthCredentialServer): void {
    // 检查是否已存在相同类型的凭证
    const existingIndex = this._credentials.findIndex(
      c => c.type === credential.type && c.id === credential.id
    );

    if (existingIndex >= 0) {
      throw new Error(`Credential with id ${credential.id} already exists`);
    }

    this._credentials.push(credential);
    this.refreshUpdatedAt();
  }

  /**
   * ✅ 移除凭证
   * @throws 如果是最后一个凭证，抛出错误
   */
  public removeCredential(credentialId: AuthCredentialId): void {
    // 业务规则：至少保留一个凭证
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

  /**
   * ✅ 获取特定类型的凭证
   */
  public getCredentialByType(type: typeof CredentialType.PASSWORD): AuthCredentialServer | null {
    return this._credentials.find(c => c.type === type) ?? null;
  }

  /**
   * ✅ 检查是否有密码凭证
   */
  public hasPassword(): boolean {
    return this._credentials.some(c => c.type === CredentialType.PASSWORD);
  }

  /**
   * ✅ 检查是否有 OAuth 凭证
   */
  public hasOAuth(): boolean {
    return this._credentials.some(c => c.type === CredentialType.OAUTH);
  }

  /**
   * ✅ 禁用身份
   */
  public disable(): void {
    if (AuthIdentityStatus.isDisabled(this._status)) {
      return; // 幂等
    }

    this._status = AuthIdentityStatus.DISABLED;
    this.refreshUpdatedAt();

    this.addDomainEvent<AuthEventMap['auth:identity-disabled']>('auth:identity-disabled' as keyof AuthEventMap, {
      identityId: this.id,
    });
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
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
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): AuthIdentityPersistenceDTO {
    return {
      id: this.id,
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt,
      lockedUntil: this._lockedUntil,
      credentials: this._credentials,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
