/**
 * PasswordCredential 实体实现
 * 密码凭证 - Server 端持有哈希值
 * 
 * Server 可以看到哈希值和盐值
 * 绝对不能序列化给 Client
 */

import type {
  PasswordCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils';

import {
  CredentialStatus,
  HashedPassword,
  type AuthCredentialId,
} from '../../domain-shared';

import type { IPasswordHasher } from '../../domain-shared';

/** Domain state for PasswordCredential entity */
export interface PasswordCredentialState {
  id: AuthCredentialId;
  status: typeof CredentialStatus.ACTIVE;
  hashedPassword: HashedPassword;
  passwordLastChangedAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/**
 * 密码凭证实体
 */
export class PasswordCredential extends Entity<AuthCredentialId> {

  // ================= 1. 内部状态 =================
  private _status: typeof CredentialStatus.ACTIVE;
  private _hashedPassword: HashedPassword;
  private _passwordLastChangedAt: Date;
  private _createdAt: Date;
  private _lastUsedAt: Date | null;

  // 只读类型标识
  public readonly type = 'PASSWORD';

  // ================= 2. 构造函数 =================
  private constructor(state: PasswordCredentialState) {
    super(state.id);

    this._status = state.status;
    this._hashedPassword = state.hashedPassword;
    this._passwordLastChangedAt = state.passwordLastChangedAt;
    this._createdAt = state.createdAt;
    this._lastUsedAt = state.lastUsedAt;
  }

  // ================= 3. Getters =================
  get status(): typeof CredentialStatus.ACTIVE {
    return this._status;
  }

  get hashedPassword(): HashedPassword {
    return this._hashedPassword;
  }

  get passwordLastChangedAt(): Date {
    return this._passwordLastChangedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  // ================= 4. 工厂方法 =================

  /**
   * 🏭 业务工厂：创建新的密码凭证
   */
  public static create(params: {
    id: AuthCredentialId;
    hashedPassword: HashedPassword;
  }): PasswordCredential {
    const now = new Date();
    return new PasswordCredential({
      id: params.id,
      status: CredentialStatus.ACTIVE,
      hashedPassword: params.hashedPassword,
      passwordLastChangedAt: now,
      createdAt: now,
      lastUsedAt: null,
    });
  }

  /**
   * 🏭 恢复工厂：从持久化状态恢复
   */
  public static load(state: PasswordCredentialState): PasswordCredential {
    return new PasswordCredential(state);
  }

  // ================= 5. 业务行为 =================

  /**
   * 比较明文密码是否匹配
   */
  public compare(plainPassword: string, hasher: IPasswordHasher): Promise<boolean> {
    return hasher.compare(plainPassword, this._hashedPassword.hash);
  }

  /**
   * 更新密码
   */
  public updatePassword(newHashedPassword: HashedPassword): void {
    if (!CredentialStatus.isActive(this._status)) {
      throw new Error('Cannot update password on inactive credential');
    }

    this._hashedPassword = newHashedPassword;
    this._passwordLastChangedAt = new Date();
  }

  /**
   * 记录使用时间
   */
  public recordUsage(): void {
    this._lastUsedAt = new Date();
  }

  /**
   * 暂停凭证
   */
  public suspend(): void {
    if (CredentialStatus.isSuspended(this._status)) {
      return; // 幂等
    }

    this._status = CredentialStatus.SUSPENDED;
  }

  /**
   * 恢复凭证
   */
  public activate(): void {
    if (CredentialStatus.isActive(this._status)) {
      return; // 幂等
    }

    if (CredentialStatus.isRevoked(this._status)) {
      throw new Error('Cannot activate a revoked credential');
    }

    this._status = CredentialStatus.ACTIVE;
  }

  /**
   * 吊销凭证
   */
  public revoke(): void {
    if (CredentialStatus.isRevoked(this._status)) {
      return; // 幂等
    }

    this._status = CredentialStatus.REVOKED;
  }

  /**
   * 检查密码是否需要更新（超过指定天数）
   */
  public needsPasswordChange(maxAgeDays: number = 90): boolean {
    return this._hashedPassword.needsReset(maxAgeDays);
  }

  /**
   * 获取密码上次更新距今的天数
   */
  public getPasswordAgeDays(): number {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - this._passwordLastChangedAt.getTime()) / dayMs);
  }

  // ================= 6. 序列化 =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): PasswordCredentialServerDTO {
    return {
      id: this.id,
      type: 'PASSWORD',
      status: this._status,
      hashedPassword: this._hashedPassword.toDTO(),
      passwordLastChangedAt: this._passwordLastChangedAt.getTime(),
      createdAt: this._createdAt.getTime(),
      lastUsedAt: this._lastUsedAt?.getTime() ?? null,
    };
  }
}
