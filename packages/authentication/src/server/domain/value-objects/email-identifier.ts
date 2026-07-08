/**
 * EmailIdentifier 值对象
 *
 * 邮箱标识符 - 用于"查找用户"
 * 不可变，以值定义身份
 */

import type { EmailIdentifierDTO } from '@dailyuse/contracts/authentication';

import { EmailAddress } from '..';

/**
 * 邮箱标识符值对象
 */
export class EmailIdentifier {
  readonly type = 'Email' as const;

  private constructor(
    private readonly _value: EmailAddress,
    private readonly _isVerified: boolean,
  ) {}

  // ================= 工厂方法 =================

  /**
   * 🏭 业务工厂：创建新的邮箱标识符
   */
  public static create(email: string, isVerified = false): EmailIdentifier {
    const emailAddress = EmailAddress.create({ value: email });
    return new EmailIdentifier(emailAddress, isVerified);
  }

  /**
   * 🏭 恢复工厂：从 DTO 恢复
   */
  public static fromDTO(dto: EmailIdentifierDTO): EmailIdentifier {
    const emailAddress = EmailAddress.fromDTO({ value: dto.value });
    return new EmailIdentifier(emailAddress, dto.isVerified);
  }

  // ================= Getters =================

  get value(): string {
    return this._value.value;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get emailAddress(): EmailAddress {
    return this._value;
  }

  // ================= 业务行为 =================

  /**
   * 标记为已验证（返回新实例，保持不可变性）
   */
  public verify(): EmailIdentifier {
    if (this._isVerified) return this;
    return new EmailIdentifier(this._value, true);
  }

  /**
   * 获取打码后的邮箱地址
   */
  public getMaskedEmail(): string {
    return this._value.getMaskedAddress();
  }

  // ================= 值比较 =================

  /**
   * VO 核心：以值比较
   */
  public equals(other: EmailIdentifier): boolean {
    return this._value.value === other._value.value;
  }

  // ================= 序列化 =================

  public toDTO(): EmailIdentifierDTO {
    return {
      type: 'Email',
      value: this._value.value,
      isVerified: this._isVerified,
    };
  }
}
