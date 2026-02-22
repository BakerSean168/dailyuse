/**
 * PhoneCredential 实体实现
 * 手机凭证 - 支持短信验证码登录
 */

import type {
  PhoneCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils';

import {
  CredentialStatus,
  PhoneNumber,
  type AuthCredentialId,
} from '../../domain-shared';

/** Domain state for PhoneCredential entity */
export interface PhoneCredentialState {
  id: AuthCredentialId;
  status: typeof CredentialStatus.ACTIVE;
  phoneNumber: PhoneNumber;
  isVerified: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/**
 * 手机凭证实体
 */
export class PhoneCredential extends Entity<AuthCredentialId> {

  // ================= 1. 内部状态 =================
  private _status: typeof CredentialStatus.ACTIVE;
  private _phoneNumber: PhoneNumber;
  private _isVerified: boolean;
  private _createdAt: Date;
  private _lastUsedAt: Date | null;

  // 只读类型标识
  public readonly type = 'PHONE';

  // ================= 2. 构造函数 =================
  private constructor(state: PhoneCredentialState) {
    super(state.id);

    this._status = state.status;
    this._phoneNumber = state.phoneNumber;
    this._isVerified = state.isVerified;
    this._createdAt = state.createdAt;
    this._lastUsedAt = state.lastUsedAt;
  }

  // ================= 3. Getters =================
  get status(): typeof CredentialStatus.ACTIVE {
    return this._status;
  }

  get phoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  // ================= 4. 工厂方法 =================

  /**
   * 🏭 业务工厂：创建新的手机凭证
   */
  public static create(params: {
    id: AuthCredentialId;
    phoneNumber: PhoneNumber;
    isVerified?: boolean;
  }): PhoneCredential {
    const now = new Date();
    return new PhoneCredential({
      id: params.id,
      status: CredentialStatus.ACTIVE,
      phoneNumber: params.phoneNumber,
      isVerified: params.isVerified ?? false,
      createdAt: now,
      lastUsedAt: null,
    });
  }

  /**
   * 🏭 恢复工厂：从持久化状态恢复
   */
  public static load(state: PhoneCredentialState): PhoneCredential {
    return new PhoneCredential(state);
  }

  // ================= 5. 业务行为 =================

  /**
   * 标记为已验证
   */
  public verify(): void {
    if (this._isVerified) {
      return; // 幂等
    }
    this._isVerified = true;
    this._lastUsedAt = new Date();
  }

  /**
   * 更新手机号码
   */
  public updatePhoneNumber(newPhoneNumber: PhoneNumber): void {
    if (!CredentialStatus.isActive(this._status)) {
      throw new Error('Cannot update phone number on inactive credential');
    }

    this._phoneNumber = newPhoneNumber;
    this._isVerified = false; // 更换号码后需要重新验证
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
      return;
    }
    this._status = CredentialStatus.SUSPENDED;
  }

  /**
   * 恢复凭证
   */
  public activate(): void {
    if (CredentialStatus.isActive(this._status)) {
      return;
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
      return;
    }
    this._status = CredentialStatus.REVOKED;
  }

  /**
   * 获取脱敏的手机号（用于显示）
   */
  public getMaskedPhoneNumber(): string {
    return this._phoneNumber.getMaskedNumber();
  }

  // ================= 6. 序列化 =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): PhoneCredentialServerDTO {
    return {
      id: this.id,
      type: 'PHONE',
      status: this._status,
      phoneNumber: this._phoneNumber.toDTO(),
      isVerified: this._isVerified,
      createdAt: this._createdAt.getTime(),
      lastUsedAt: this._lastUsedAt?.getTime() ?? null,
    };
  }

}
