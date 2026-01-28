import { ValueObject } from '@dailyuse/utils';
import type { ContactPhoneDTO, ContactPhonePersistenceDTO, ContactPhone as IContactPhone } from '@dailyuse/contracts/account';
import type { DomainDate } from '@dailyuse/contracts/primitives';

export class ContactPhone extends ValueObject<ContactPhoneDTO> implements IContactPhone {

  private constructor(props: ContactPhoneDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的电话值对象（包含校验）
   */
  public static create(props: ContactPhoneDTO): ContactPhone {
    this.validate(props);
    return new ContactPhone(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 创建未验证的电话（初始状态）
   * 场景: 用户添加电话号码
   */
  public static createUnverified(countryCode: string, number: string, fullNumber: string): ContactPhone {
    const props: ContactPhoneDTO = { countryCode, number, fullNumber, isVerified: false };
    this.validate(props);
    return new ContactPhone({ ...props, verifiedAt: undefined });
  }

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: ContactPhoneDTO): void {
    // 校验电话号码格式（假设中国手机号）
    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(props.number)) {
      throw new Error(`Invalid phone number format: ${props.number} (must be 11 digits)`);
    }
    
    // 校验国家代码
    if (!props.countryCode || props.countryCode.length === 0) {
      throw new Error('Country code cannot be empty');
    }
    
    // 校验完整号码
    if (!props.fullNumber || props.fullNumber.length === 0) {
      throw new Error('Full phone number cannot be empty');
    }
  }

  // ================= 行为 (不可变变更) =================

  /**
   * 验证电话
   */
  public verify(): ContactPhone {
    return new ContactPhone({
      ...this.props,
      isVerified: true,
      verifiedAt: this.props.isVerified ? this.props.verifiedAt : Date.now()
    });
  }

  // ================= 计算属性 (Rich Logic) =================

  /**
   * 获取格式化的电话号码显示
   */
  public getFormattedNumber(): string {
    // +86 138 0013 8000
    const { countryCode, number } = this.props;
    const formatted = number.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    return `${countryCode} ${formatted}`;
  }

  /**
   * 获取打码后的电话号码 (UI展示用)
   */
  public getMaskedNumber(): string {
    // +86 138 **** 8000
    const { countryCode, number } = this.props;
    const masked = number.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    return `${countryCode} ${masked}`;
  }

  // ================= Getters =================

  /**
   * 验证时间
   */
  get verifiedAt(): DomainDate | null {
    return this.props.verifiedAt ? new Date(this.props.verifiedAt) : null;
  }

  get countryCode(): string {
    return this.props.countryCode;
  }

  get number(): string {
    return this.props.number;
  }

  get fullNumber(): string {
    return this.props.fullNumber;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  // ================= 序列化 (Serialization) =================

  /**
   * 从持久化 DTO 恢复
   */
  public static fromPersistenceDTO(dto: ContactPhonePersistenceDTO): ContactPhone {
    return new ContactPhone({
      countryCode: dto.countryCode,
      number: dto.number,
      fullNumber: dto.fullNumber,
      isVerified: dto.isVerified,
      verifiedAt: dto.verifiedAt ? new Date(dto.verifiedAt).getTime() : undefined,
    });
  }

  /**
   * 转换为持久化格式
   * 职责: 处理 timestamp 与 Date 对象的转换
   */
  public toPersistenceDTO(): ContactPhonePersistenceDTO {
    return {
      countryCode: this.props.countryCode,
      number: this.props.number,
      fullNumber: this.props.fullNumber,
      isVerified: this.props.isVerified,
      verifiedAt: this.props.verifiedAt ? new Date(this.props.verifiedAt) : undefined,
    };
  }

  /**
   * 转换为 API/Client DTO
   */
  public toDTO(): ContactPhoneDTO {
    return { ...this.props };
  }
}
