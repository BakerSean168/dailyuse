/**
 * PhoneIdentifier 值对象
 *
 * 手机号标识符 - 用于"查找用户"
 * 不可变，以值定义身份
 */

import type { PhoneIdentifierDTO } from '@memoflow/contracts/authentication';

import { PhoneNumber } from '..';

/**
 * 手机号标识符值对象
 */
export class PhoneIdentifier {
  readonly type = 'Phone' as const;

  private constructor(
    private readonly _value: PhoneNumber,
    private readonly _isVerified: boolean,
  ) {}

  // ================= 工厂方法 =================

  /**
   * 🏭 业务工厂：创建新的手机标识符
   */
  public static create(phoneNumber: string, isVerified = false): PhoneIdentifier {
    const phone = PhoneNumber.create({ value: phoneNumber });
    return new PhoneIdentifier(phone, isVerified);
  }

  /**
   * 🏭 恢复工厂：从 DTO 恢复
   */
  public static fromDTO(dto: PhoneIdentifierDTO): PhoneIdentifier {
    const phone = PhoneNumber.fromDTO(dto.value);
    return new PhoneIdentifier(phone, dto.isVerified);
  }

  // ================= Getters =================

  get value(): string {
    return this._value.value;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get phoneNumber(): PhoneNumber {
    return this._value;
  }

  // ================= 业务行为 =================

  /**
   * 标记为已验证（返回新实例，保持不可变性）
   */
  public verify(): PhoneIdentifier {
    if (this._isVerified) return this;
    return new PhoneIdentifier(this._value, true);
  }

  /**
   * 获取脱敏的手机号（用于显示）
   */
  public getMaskedPhoneNumber(): string {
    return this._value.getMaskedNumber();
  }

  // ================= 值比较 =================

  /**
   * VO 核心：以值比较
   */
  public equals(other: PhoneIdentifier): boolean {
    return this._value.value === other._value.value;
  }

  // ================= 序列化 =================

  public toDTO(): PhoneIdentifierDTO {
    return {
      type: 'Phone',
      value: this._value.toDTO(),
      isVerified: this._isVerified,
    };
  }
}
