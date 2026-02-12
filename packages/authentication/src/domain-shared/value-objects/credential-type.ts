import type { CredentialType as ICredentialType } from '@dailyuse/contracts/authentication';

/**
 * 🔑 凭证类型 - 认证方式标识
 *
 * Branded Type：运行时�?string，编译时具有类型安全�?
 * 零序列化成本，内存开销极小
 */
export type CredentialType = ICredentialType & { readonly __brand: unique symbol };

/**
 * 合法值集�?- Single Source of Truth
 * 用于校验和遍�?
 */
const VALUES: ICredentialType[] = ['PASSWORD', 'OAUTH', 'PHONE', 'MAGIC_LINK'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实�?
 */
export const CredentialType = {
  // ================= 常量定义 =================

  PASSWORD: 'PASSWORD' as CredentialType,
  OAUTH: 'OAUTH' as CredentialType,
  PHONE: 'PHONE' as CredentialType,
  MAGIC_LINK: 'MAGIC_LINK' as CredentialType,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 CredentialType
   * @throws 当输入值不在合法值列表中�?
   */
  of(value: string): CredentialType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid credential type: ${value}`);
    }
    return value as CredentialType;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡�?类型守卫：运行时类型检�?
   * 用于条件判断时的类型细化
   */
  isValid(value: string): value is CredentialType {
    return VALUES.includes(value as ICredentialType);
  },

  /**
   * 📋 获取所有可用�?
   * 用于前端渲染选项列表
   */
  getAll(): CredentialType[] {
    return VALUES as CredentialType[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否是基于密码的认证方式
   */
  isPasswordBased(type: CredentialType): boolean {
    return type === this.PASSWORD;
  },

  /**
   * 是否�?OAuth 认证方式
   */
  isOAuth(type: CredentialType): boolean {
    return type === this.OAUTH;
  },

  /**
   * 是否是手机号认证方式
   */
  isPhoneBased(type: CredentialType): boolean {
    return type === this.PHONE;
  },

  /**
   * 是否是魔法链接认证方�?
   */
  isMagicLink(type: CredentialType): boolean {
    return type === this.MAGIC_LINK;
  },

  /**
   * 是否需要在服务器端验证（密码和魔法链接�?
   */
  requiresServerVerification(type: CredentialType): boolean {
    return this.isPasswordBased(type) || this.isMagicLink(type);
  },
};
