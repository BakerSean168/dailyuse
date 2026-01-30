import { ValueObject } from '@dailyuse/utils';
import type { ContactEmailDTO, ContactEmailPersistenceDTO, ContactEmail as IContactEmail  } from '@dailyuse/contracts/account';
import type { DomainDate } from '@dailyuse/contracts/primitives';

export class ContactEmail extends ValueObject<ContactEmailDTO> implements IContactEmail {

  private constructor(props: ContactEmailDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的邮箱值对象（包含校验）
   */
  public static create(props: ContactEmailDTO): ContactEmail {
    this.validate(props);
    return new ContactEmail(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 创建未验证的邮箱（初始状态）
   * 场景: 用户注册时，创建邮箱地址
   */
  public static createUnverified(address: string): ContactEmail {
    this.validate({ address, isVerified: false, isPrimary: true, verifiedAt: null });
    return new ContactEmail({
      address,
      isVerified: false,
      isPrimary: true,
      verifiedAt: null
    });
  }

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: ContactEmailDTO): void {
    // 校验邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.address)) {
      throw new Error(`Invalid email address format: ${props.address}`);
    }
    
    // 邮箱地址长度校验
    if (props.address.length > 255) {
      throw new Error('Email address too long (max 255 characters)');
    }
  }
  // ================= 行为 (不可变变更) =================

  /**
   * 验证邮箱
   */
  public verify(): ContactEmail {
    return new ContactEmail({
      ...this.props,
      isVerified: true,
      verifiedAt: this.props.isVerified ? this.props.verifiedAt : Date.now()
    });
  }

  /**
   * 标记为主邮箱
   */
  public markAsPrimary(): ContactEmail {
    return new ContactEmail({
      ...this.props,
      isPrimary: true
    });
  }

  /**
   * 标记为非主邮箱
   */
  public unmarkAsPrimary(): ContactEmail {
    return new ContactEmail({
      ...this.props,
      isPrimary: false
    });
  }

  // ================= 计算属性 (Rich Logic) =================

  /**
   * 获取打码后的邮箱 (UI展示用)
   */
  public getMaskedAddress(): string {
    // j***e@example.com
    const [user, domain] = this.props.address.split('@');
    return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`;
  }

  /**
   * 获取本地部分（@前面）
   */
  public getLocalPart(): string {
    return this.props.address.split('@')[0];
  }

  /**
   * 获取域名部分（@后面）
   */
  public getDomain(): string {
    return this.props.address.split('@')[1];
  }

  // ================= Getters =================

  /**
   * Getter 转换
   */
  get verifiedAt(): DomainDate | null {
    return this.props.verifiedAt ? new Date(this.props.verifiedAt) : null;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get address(): string {
    return this.props.address;
  }

  // ================= 序列化 (Serialization) =================

  /**
   * 从持久化 DTO 恢复
   */
  public static fromPersistenceDTO(dto: ContactEmailPersistenceDTO): ContactEmail {
    return new ContactEmail({
      address: dto.address,
      isVerified: dto.isVerified,
      verifiedAt: dto.verifiedAt ? new Date(dto.verifiedAt).getTime() : null,
      isPrimary: dto.isPrimary
    });
  }

  public toPersistenceDTO(): ContactEmailPersistenceDTO {
    return { 
      ...this.props,
      verifiedAt: this.props.verifiedAt ? new Date(this.props.verifiedAt) : null
     };
  }

  /**
   * 转换为 API/Client DTO
   */
  public toDTO(): ContactEmailDTO {
    return { ...this.props };
  }
}