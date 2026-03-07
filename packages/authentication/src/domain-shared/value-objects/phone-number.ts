import { ValueObject } from '@dailyuse/utils';
import type {
  PhoneNumberDTO,
  PhoneNumberPersistenceDTO,
  PhoneNumber as IPhoneNumber,
} from '@dailyuse/contracts/authentication';

/**
 * 📱 手机号码值对�?
 *
 * 责任�?
 * - 验证手机号格式和长度
 * - 支持多个国家的手机号（目前以中国为主�?
 * - 提供手机号相关的业务逻辑（打码、验证等�?
 * - 不可变性：所有修改操作都返回新实�?
 */
export class PhoneNumber extends ValueObject<PhoneNumberDTO> implements IPhoneNumber {
  private constructor(props: PhoneNumberDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的手机号码值对象（包含校验�?
   * @throws 当手机号格式不合法时
   */
  public static create(props: PhoneNumberDTO): PhoneNumber {
    this.validate(props);
    return new PhoneNumber(props);
  }

  // ================= 工厂方法 2: �?DTO 恢复 =================
  /**
   * �?DTO 恢复手机号码对象
   */
  public static fromDTO(dto: PhoneNumberDTO): PhoneNumber {
    return new PhoneNumber(dto);
  }

  // ================= Getters =================
  public get value(): string {
    return this.props.value;
  }

  domain(): string {
    return this.props.value;
  }

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: PhoneNumberDTO): void {
    // 移除所有非数字字符进行校验
    const digitsOnly = props.value.replace(/\D/g, '');

    // 中国手机号校验（最常见的格式）
    // 允许格式�?3/14/15/16/17/18/19 开头的 11 位数�?
    const chinaPhoneRegex = /^1[3-9]\d{9}$/;
    if (!chinaPhoneRegex.test(digitsOnly)) {
      throw new Error(`Invalid phone number format: ${props.value}`);
    }

    // 国际格式手机号校验（可选的 + 和国家码�?
    const internationalRegex = /^\+?[1-9]\d{1,14}$/;
    if (!internationalRegex.test(digitsOnly.replace('+', ''))) {
      throw new Error('Phone number must match international format');
    }
  }

  // ================= 计算属�?=================

  /**
   * 获取纯数字格式的手机号（去除所有特殊字符）
   */
  public getDigitsOnly(): string {
    return this.props.value.replace(/\D/g, '');
  }

  /**
   * 获取国家码部分（如果有）
   * @example '+86-13800000000' => '86'
   */
  public getCountryCode(): string {
    if (this.props.value.startsWith('+')) {
      const match = this.props.value.match(/^\+(\d+)/);
      return match ? match[1] : '86'; // 默认中国
    }
    return '86'; // 默认中国
  }

  /**
   * 获取打码后的手机�?(UI 展示�?
   * @example '13800000000' => '138****0000'
   */
  public getMaskedNumber(): string {
    const digitsOnly = this.getDigitsOnly();
    if (digitsOnly.length < 8) return digitsOnly;

    const prefix = digitsOnly.slice(0, 3);
    const suffix = digitsOnly.slice(-4);
    const masked = '*'.repeat(digitsOnly.length - 7);

    return `${prefix}${masked}${suffix}`;
  }

  /**
   * 是否是中国大陆手机号
   */
  public isChinaMainland(): boolean {
    const digitsOnly = this.getDigitsOnly();
    return /^1[3-9]\d{9}$/.test(digitsOnly);
  }

  /**
   * 获取运营商（仅针对中国大陆手机号�?
   * @returns 'ChinaMobile' | 'ChinaUnicom' | 'ChinaTelecom' | 'Unknown'
   */
  public getCarrier(): 'ChinaMobile' | 'ChinaUnicom' | 'ChinaTelecom' | 'Unknown' {
    if (!this.isChinaMainland()) {
      return 'Unknown';
    }

    const prefix = this.getDigitsOnly().slice(0, 3);

    // 中国移动�?34-139, 147, 150, 151, 152, 157, 158, 159, 178, 182, 183, 184, 187, 188, 198
    if (
      [
        '134',
        '135',
        '136',
        '137',
        '138',
        '139',
        '147',
        '150',
        '151',
        '152',
        '157',
        '158',
        '159',
        '178',
        '182',
        '183',
        '184',
        '187',
        '188',
        '198',
      ].includes(prefix)
    ) {
      return 'ChinaMobile';
    }

    // 中国联通：130, 131, 132, 155, 156, 166, 171, 175, 176, 185, 186, 196
    if (
      ['130', '131', '132', '155', '156', '166', '171', '175', '176', '185', '186', '196'].includes(
        prefix,
      )
    ) {
      return 'ChinaUnicom';
    }

    // 中国电信�?33, 149, 153, 173, 177, 180, 181, 189, 190, 191, 193, 199
    if (
      ['133', '149', '153', '173', '177', '180', '181', '189', '190', '191', '193', '199'].includes(
        prefix,
      )
    ) {
      return 'ChinaTelecom';
    }

    return 'Unknown';
  }

  // ================= 序列�? API / Client =================
  /**
   * 转换�?DTO（用�?API 传输�?
   */
  public toDTO(): PhoneNumberDTO {
    return { ...this.props };
  }

  // ================= 序列�? Persistence =================
  /**
   * 转换为持久化格式（数据库存储�?
   */
  public toPersistence(): PhoneNumberPersistenceDTO {
    return {
      value: this.props.value,
    };
  }
}
