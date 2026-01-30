import type { GenderType as IGenderType } from '@dailyuse/contracts/account';

/**
 * 👥 性别类型 - 用户个人信息
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type GenderType = IGenderType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IGenderType[] = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实例
 */
export const GenderType = {
  // ================= 常量定义 =================
  
  MALE: 'MALE' as GenderType,
  FEMALE: 'FEMALE' as GenderType,
  OTHER: 'OTHER' as GenderType,
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY' as GenderType,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 GenderType
   * @throws 当输入值不在合法值列表中时
   */
  of(value: string): GenderType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid gender type: ${value}`);
    }
    return value;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   * 用于条件判断时的类型细化
   * @example
   * if (GenderType.isValid(input)) {
   *   const gender: GenderType = input; // TS 自动推断
   * }
   */
  isValid(value: string): value is GenderType {
    return VALUES.includes(value as IGenderType);
  },

  /**
   * 📋 获取所有可用值
   * 用于前端渲染 Select/RadioGroup 选项
   */
  getAll(): GenderType[] {
    return VALUES as GenderType[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否有明确指定性别
   * （而不是选择"不愿透露"）
   */
  isSpecified(gender: GenderType): boolean {
    return gender !== this.PREFER_NOT_TO_SAY;
  },

  /**
   * 获取 UI 显示名称（用于列表展示）
   */
  getDisplayName(gender: GenderType): string {
    const map: Record<IGenderType, string> = {
      'MALE': '男',
      'FEMALE': '女',
      'OTHER': '其他',
      'PREFER_NOT_TO_SAY': '不愿透露'
    };
    return map[gender as IGenderType] ?? '未知';
  }
};