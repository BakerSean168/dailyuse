import { OAuthProvider as IOAuthProvider } from '@dailyuse/contracts/authentication';

/**
 * 🔑 凭证类型 - 认证方式标识
 *
 * Branded Type：运行时�?string，编译时具有类型安全�?
 * 零序列化成本，内存开销极小
 */
export type OAuthProvider = IOAuthProvider & { readonly __brand: unique symbol };

/**
 * 合法值集�?- Single Source of Truth
 * 用于校验和遍�?
 * �?优化�?1：直接从 Contract 对象中获取所有值，无需手动抄写一�?
 * Object.values(IOAuthProvider) 会返回 ['Google', 'Facebook', ...]
 */
const VALUES: IOAuthProvider[] = Object.values(IOAuthProvider) as IOAuthProvider[];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实�?
 */
export const OAuthProvider = {
  // ================= 常量定义 =================

  Google: 'Google' as OAuthProvider,
  Facebook: 'Facebook' as OAuthProvider,
  Github: 'Github' as OAuthProvider,
  Apple: 'Apple' as OAuthProvider,
  Wechat: 'Wechat' as OAuthProvider,
  Weibo: 'Weibo' as OAuthProvider,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 OAuthProvider
   * @throws 当输入值不在合法值列表中�?
   */
  of(value: string): OAuthProvider {
    if (!this.isValid(value)) {
      throw new Error(`Invalid credential type: ${value}`);
    }
    return value as OAuthProvider;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡�?类型守卫：运行时类型检�?
   * 用于条件判断时的类型细化
   */
  isValid(value: string): value is OAuthProvider {
    return VALUES.includes(value as IOAuthProvider);
  },

  /**
   * 📋 获取所有可用�?
   * 用于前端渲染选项列表
   */
  getAll(): OAuthProvider[] {
    return VALUES as OAuthProvider[];
  },

  // ================= 行为方法 (State Logic) =================
};
