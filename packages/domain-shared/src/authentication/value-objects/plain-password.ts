import { ValueObject } from '@dailyuse/utils';
import type { PlainPasswordDTO, PlainPassword as IPlainPassword } from '@dailyuse/contracts/authentication';

/**
 * 🔐 明文密码值对象
 *
 * ⚠️ 安全警告：
 * - 此对象仅在用户输入时短期存在
 * - 绝对不能被持久化或在网络上传输（使用 HTTPS）
 * - 必须立即被哈希后丢弃
 * - 仅在客户端验证（Server 端也要校验！）
 *
 * 责任：
 * - 验证密码强度和长度
 * - 提供密码相关的业务逻辑
 * - 在完成哈希后立即被垃圾回收
 */
export class PlainPassword extends ValueObject<PlainPasswordDTO> implements IPlainPassword {

  private constructor(props: PlainPasswordDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的明文密码值对象（包含校验）
   * 
   * @throws 当密码不符合安全要求时
   * 
   * ⚠️ 此方法应该在 Server 端也有一份实现，进行二次校验
   */
  public static create(props: PlainPasswordDTO): PlainPassword {
    this.validate(props);
    return new PlainPassword(props);
  }

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑 - 密码强度校验
   * 
   * 校验规则：
   * 1. 最小长度：8 个字符
   * 2. 最大长度：128 个字符
   * 3. 不能为空或仅空格
   * 4. 强度等级 (可选，根据业务决定)
   */
  private static validate(props: PlainPasswordDTO): void {
    const password = props.value;

    // 不允许为空或仅空格
    if (!password || password.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    // 最小长度校验
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // 最大长度校验
    if (password.length > 128) {
      throw new Error('Password must not exceed 128 characters');
    }

    // 推荐：至少包含大写字母、小写字母、数字和特殊字符之中的两种
    // (可根据业务要求调整)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const complexityCount = [hasUpperCase, hasLowerCase, hasDigit, hasSpecialChar].filter(Boolean).length;

    // 至少包含 2 种复杂度（可选，根据业务调整）
    // 如果要求更强的密码，可以改为 complexityCount < 3
    if (complexityCount < 2) {
      throw new Error('Password must contain at least 2 of: uppercase, lowercase, digit, special character');
    }
  }

  // ===================== Getters =================
  public get value(): string {
    return this.props.value;
  }

  // ================= 计算属性 =================

  /**
   * 计算密码强度等级
   * @returns 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG'
   */
  public getStrength(): 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG' {
    const password = this.props.value;
    let score = 0;

    // 长度评分
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // 复杂度评分
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

    // 映射到强度等级
    if (score <= 2) return 'WEAK';
    if (score <= 4) return 'FAIR';
    if (score <= 6) return 'GOOD';
    return 'STRONG';
  }

  /**
   * 获取密码强度的百分比（用于 UI 进度条）
   * @returns 0-100
   */
  public getStrengthPercentage(): number {
    const strength = this.getStrength();
    const map: Record<typeof strength, number> = {
      'WEAK': 25,
      'FAIR': 50,
      'GOOD': 75,
      'STRONG': 100
    };
    return map[strength];
  }

  /**
   * 获取密码强度的描述
   */
  public getStrengthDescription(): string {
    const strength = this.getStrength();
    const map: Record<typeof strength, string> = {
      'WEAK': '密码强度弱，建议增加复杂度',
      'FAIR': '密码强度一般，建议增加长度或复杂度',
      'GOOD': '密码强度良好',
      'STRONG': '密码强度很强'
    };
    return map[strength];
  }

  /**
   * 判断密码是否包含常见的弱密码模式
   * @returns true 如果密码包含弱模式
   */
  public hasCommonPatterns(): boolean {
    const password = this.props.value.toLowerCase();
    
    // 常见弱模式
    const commonPatterns = [
      'password',
      '123456',
      'qwerty',
      'abc123',
      'admin',
      'letmein',
      '111111',
      '000000'
    ];

    return commonPatterns.some(pattern => password.includes(pattern));
  }

  /**
   * 获取密码改进的建议
   */
  public getSuggestions(): string[] {
    const password = this.props.value;
    const suggestions: string[] = [];

    if (password.length < 12) {
      suggestions.push('增加密码长度至少到 12 个字符');
    }

    if (!/[A-Z]/.test(password)) {
      suggestions.push('添加至少一个大写字母');
    }

    if (!/[a-z]/.test(password)) {
      suggestions.push('添加至少一个小写字母');
    }

    if (!/\d/.test(password)) {
      suggestions.push('添加至少一个数字');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      suggestions.push('添加至少一个特殊字符');
    }

    if (this.hasCommonPatterns()) {
      suggestions.push('避免使用常见的密码模式');
    }

    return suggestions;
  }

  // ================= 序列化 =================
  /**
   * ⚠️ 转换为 DTO
   * 
   * 警告：此方法应该极少被调用
   * 密码不应该被序列化到客户端或存储中
   * 如果必须传输，必须：
   * 1. 使用 HTTPS 加密
   * 2. 立即在 Server 端哈希并丢弃原文
   */
  public toDTO(): PlainPasswordDTO {
    return { ...this.props };
  }
}
