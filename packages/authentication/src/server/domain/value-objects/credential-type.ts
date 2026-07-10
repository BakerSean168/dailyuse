import { CredentialType as CredentialTypeContract, type CredentialType as ICredentialType } from '@dailyuse/contracts/authentication';

/**
 * 🔑 凭证类型 - 认证方式标识
 *
 * 重构后仅保留真正的凭证类型：
 * - Password: 密码凭证
 * - MagicLink: 魔法链接凭证 (未来扩展)
 *
 * 原 Oauth 和 Phone 类型已迁移为标识符 (Identifier)
 *
 * Branded Type：运行时是 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type CredentialType = ICredentialType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ICredentialType[] = Object.values(CredentialTypeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实例
 */
export const CredentialType = {
  // ================= 常量定义 =================

  Password: 'Password' as CredentialType,
  MagicLink: 'MagicLink' as CredentialType,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 CredentialType
   * @throws 当输入值不在合法值列表中时
   */
  of(value: string): CredentialType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid credential type: ${value}`);
    }
    return value as CredentialType;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   * 用于条件判断时的类型细化
   */
  isValid(value: string): value is CredentialType {
    return VALUES.includes(value as ICredentialType);
  },

  /**
   * 📋 获取所有可用值
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
    return type === this.Password;
  },

  /**
   * 是否是魔法链接认证方式
   */
  isMagicLink(type: CredentialType): boolean {
    return type === this.MagicLink;
  },

  /**
   * 是否需要在服务器端验证（密码和魔法链接）
   */
  requiresServerVerification(type: CredentialType): boolean {
    return this.isPasswordBased(type) || this.isMagicLink(type);
  },
};
