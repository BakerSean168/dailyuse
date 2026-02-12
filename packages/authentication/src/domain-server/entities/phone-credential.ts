/**
 * PhoneCredential 实体实现
 * 手机凭证 - 支持短信验证码登�?
 */

import type {
  PhoneCredentialServer,
  PhoneCredentialServerDTO,
  PhoneCredentialPersistenceDTO,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils';

import {
  CredentialType,
  CredentialStatus,
  PhoneNumber,
  type AuthCredentialId,
} from '../../domain-shared';

/**
 * 手机凭证实体
 */
export class PhoneCredential extends Entity<AuthCredentialId> implements PhoneCredentialServer {

  // ================= 1. 内部状�?=================
  private _status: typeof CredentialStatus.ACTIVE;
  private _phoneNumber: PhoneNumber;
  private _isVerified: boolean;
  private _createdAt: Date;
  private _lastUsedAt: Date | null;

  // 只读类型标识
  public readonly type = 'PHONE';

  // ================= 2. 构造函�?=================
  private constructor(props: PhoneCredentialServerDTO) {
    super(props.id);

    this._status = CredentialStatus.of(props.status);
    this._phoneNumber = PhoneNumber.fromDTO(props.phoneNumber);
    this._isVerified = props.isVerified;
    this._createdAt = new Date(props.createdAt);
    this._lastUsedAt = props.lastUsedAt ? new Date(props.lastUsedAt) : null;
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
   * 🏭 业务工厂：创建新的手机凭�?
   */
  public static create(params: {
    id: AuthCredentialId;
    phoneNumber: PhoneNumber;
    isVerified?: boolean;
  }): PhoneCredential {
    const now = Date.now();
    const dto: PhoneCredentialServerDTO = {
      id: params.id,
      type: 'PHONE',
      status: CredentialStatus.ACTIVE,
      phoneNumber: params.phoneNumber.toDTO(),
      isVerified: params.isVerified ?? false,
      createdAt: now,
      lastUsedAt: null,
    };
    return new PhoneCredential(dto);
  }

  /**
   * 🏭 恢复工厂：从持久�?DTO 恢复
   */
  public static fromPersistenceDTO(dto: PhoneCredentialPersistenceDTO): PhoneCredential {
    const serverDTO: PhoneCredentialServerDTO = {
      id: dto.id,
      type: 'PHONE',
      status: dto.status,
      phoneNumber: dto.phoneNumber,
      isVerified: dto.isVerified,
      createdAt: dto.createdAt.getTime(),
      lastUsedAt: dto.lastUsedAt?.getTime() ?? null,
    };
    return new PhoneCredential(serverDTO);
  }

  /**
   * 🏭 恢复工厂：从 Server DTO 恢复
   */
  public static fromServerDTO(dto: PhoneCredentialServerDTO): PhoneCredential {
    return new PhoneCredential(dto);
  }

  // ================= 5. 业务行为 =================

  /**
   * �?标记为已验证
   */
  public verify(): void {
    if (this._isVerified) {
      return; // 幂等
    }
    this._isVerified = true;
    this._lastUsedAt = new Date();
  }

  /**
   * �?更新手机号码
   */
  public updatePhoneNumber(newPhoneNumber: PhoneNumber): void {
    if (!CredentialStatus.isActive(this._status)) {
      throw new Error('Cannot update phone number on inactive credential');
    }

    this._phoneNumber = newPhoneNumber;
    this._isVerified = false; // 更换号码后需要重新验�?
  }

  /**
   * �?记录使用时间
   */
  public recordUsage(): void {
    this._lastUsedAt = new Date();
  }

  /**
   * �?暂停凭证
   */
  public suspend(): void {
    if (CredentialStatus.isSuspended(this._status)) {
      return;
    }
    this._status = CredentialStatus.SUSPENDED;
  }

  /**
   * �?恢复凭证
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
   * �?吊销凭证
   */
  public revoke(): void {
    if (CredentialStatus.isRevoked(this._status)) {
      return;
    }
    this._status = CredentialStatus.REVOKED;
  }

  /**
   * �?获取脱敏的手机号（用于显示）
   */
  public getMaskedPhoneNumber(): string {
    return this._phoneNumber.getMaskedNumber();
  }

  // ================= 6. 序列�?=================

  /**
   * 转换�?Server DTO
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

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): PhoneCredentialPersistenceDTO {
    return {
      id: this.id,
      type: 'PHONE',
      status: this._status,
      phoneNumber: this._phoneNumber.toDTO(),
      isVerified: this._isVerified,
      createdAt: this._createdAt,
      lastUsedAt: this._lastUsedAt,
    };
  }
}
