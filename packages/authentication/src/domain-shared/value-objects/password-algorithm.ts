import type { PasswordAlgorithm as IPasswordAlgorithm } from '@dailyuse/contracts/authentication';

/**
 * 🔐 密码算法 - 用于密码哈希和验证的算法标识
 *
 * Branded Type：运行时�?string，编译时具有类型安全�?
 */
export type PasswordAlgorithm = IPasswordAlgorithm & { readonly __brand: unique symbol };

/**
 * 合法值集�?- Single Source of Truth
 * 注意：bcrypt �?argon2 是业界推荐的现代密码哈希算法
 */
const VALUES: IPasswordAlgorithm[] = ['BCRYPT', 'ARGON2', 'SCRYPT'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const PasswordAlgorithm = {
  // ================= 常量定义 =================

  BCRYPT: 'BCRYPT' as PasswordAlgorithm,
  ARGON2: 'ARGON2' as PasswordAlgorithm,
  SCRYPT: 'SCRYPT' as PasswordAlgorithm,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   */
  of(value: string): PasswordAlgorithm {
    if (!this.isValid(value)) {
      throw new Error(`Invalid password algorithm: ${value}`);
    }
    return value as PasswordAlgorithm;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡�?类型守卫：运行时类型检�?
   */
  isValid(value: string): value is PasswordAlgorithm {
    return VALUES.includes(value as IPasswordAlgorithm);
  },

  /**
   * 📋 获取所有可用�?
   */
  getAll(): PasswordAlgorithm[] {
    return VALUES as PasswordAlgorithm[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否�?bcrypt 算法
   */
  isBcrypt(algo: PasswordAlgorithm): boolean {
    return algo === this.BCRYPT;
  },

  /**
   * 是否�?argon2 算法
   */
  isArgon2(algo: PasswordAlgorithm): boolean {
    return algo === this.ARGON2;
  },

  /**
   * 是否�?Scrypt 算法
   */
  isScrypt(algo: PasswordAlgorithm): boolean {
    return algo === this.SCRYPT;
  },

  /**
   * 该算法是否被认为是安全的（现代算法）
   * Bcrypt �?Argon2 被认为是安全�?
   */
  isSecure(algo: PasswordAlgorithm): boolean {
    return this.isBcrypt(algo) || this.isArgon2(algo);
  },

  /**
   * 该算法是否已过时（应该迁移）
   */
  isDeprecated(algo: PasswordAlgorithm): boolean {
    return this.isScrypt(algo);
  },

  /**
   * 获取推荐的成本参数（轮数或工作因子）
   * 用于服务端在哈希时使�?
   */
  getRecommendedCost(algo: PasswordAlgorithm): number {
    const map: Record<IPasswordAlgorithm, number> = {
      'BCRYPT': 12,         // bcrypt rounds
      'ARGON2': 3,          // argon2 iterations
      'SCRYPT': 100000      // Scrypt iterations
    };
    return map[algo as IPasswordAlgorithm] ?? 100000;
  },
};
