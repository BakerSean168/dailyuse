import { ValueObject } from '@dailyuse/utils';
import type { EmailAddressDTO, EmailAddressPersistenceDTO, EmailAddress as IEmailAddress } from '@dailyuse/contracts/authentication';

/**
 * 📧 邮箱地址值对�?
 *
 * 责任�?
 * - 验证邮箱格式和长�?
 * - 提供邮箱相关的业务逻辑（域名提取、打码等�?
 * - 不可变性：所有修改操作都返回新实�?
 */
export class EmailAddress extends ValueObject<EmailAddressDTO> implements IEmailAddress {

  private constructor(props: EmailAddressDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的邮箱地址值对象（包含校验�?
   * @throws 当邮箱格式不合法�?
   */
  public static create(props: EmailAddressDTO): EmailAddress {
    this.validate(props);
    return new EmailAddress(props);
  }

  // ================= 工厂方法 2: �?DTO 恢复 =================
  /**
   * �?DTO 恢复邮箱地址对象
   * 用于�?API 响应或客户端数据还原对象
   */
  public static fromDTO(dto: EmailAddressDTO): EmailAddress {
    return new EmailAddress(dto);
  }

  // ================= Getters =================
  public get value(): string {
    return this.props.value;
  }

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: EmailAddressDTO): void {
    // 邮箱格式校验（RFC 5322 简化版本）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.value)) {
      throw new Error(`Invalid email address format: ${props.value}`);
    }

    // 邮箱长度校验（RFC 5321�?
    if (props.value.length > 254) {
      throw new Error('Email address too long (max 254 characters)');
    }

    // 本地部分（@前）不超�?64 字符
    const [localPart] = props.value.split('@');
    if (localPart.length > 64) {
      throw new Error('Email local part too long (max 64 characters)');
    }

    // 不允许空�?
    if (!props.value || props.value.trim().length === 0) {
      throw new Error('Email address cannot be empty');
    }
  }

  // ================= 计算属�?=================

  /**
   * 获取域名部分（@后面�?
   * @example 'user@example.com' => 'example.com'
   */
  public domain(): string {
    const parts = this.props.value.split('@');
    return parts.length > 1 ? parts[1] : '';
  }

  /**
   * 获取本地部分（@前面�?
   * @example 'user.name@example.com' => 'user.name'
   */
  public getLocalPart(): string {
    const parts = this.props.value.split('@');
    return parts[0] || '';
  }

  /**
   * 获取打码后的邮箱 (UI展示�?
   * @example 'john@example.com' => 'j***n@example.com'
   */
  public getMaskedAddress(): string {
    const [localPart, domain] = this.props.value.split('@');
    if (!localPart || !domain) return this.props.value;

    // 至少显示首尾�?1 个字�?
    const visibleCount = Math.max(2, Math.ceil(localPart.length / 3));
    const maskedLocalPart = 
      localPart.slice(0, 1) + 
      '*'.repeat(localPart.length - 2) + 
      localPart.slice(-1);
    
    return `${maskedLocalPart}@${domain}`;
  }

  /**
   * 是否是免费邮箱（�?gmail, qq, 163 等）
   */
  public isFreeEmail(): boolean {
    const domain = this.domain().toLowerCase();
    const freeEmailDomains = [
      'gmail.com',
      'qq.com',
      '163.com',
      '126.com',
      'foxmail.com',
      'hotmail.com',
      'outlook.com',
      'yahoo.com',
      'mail.com'
    ];
    return freeEmailDomains.includes(domain);
  }

  /**
   * 是否是公司邮箱（非免费邮箱）
   */
  public isCorporateEmail(): boolean {
    return !this.isFreeEmail();
  }

  // ================= 序列�? API / Client =================
  /**
   * 转换�?DTO（用�?API 传输�?
   */
  public toDTO(): EmailAddressDTO {
    return { ...this.props };
  }

  // ================= 序列�? Persistence =================
  /**
   * 转换为持久化格式（数据库存储�?
   */
  public toPersistence(): EmailAddressPersistenceDTO {
    return {
      value: this.props.value
    };
  }
}
