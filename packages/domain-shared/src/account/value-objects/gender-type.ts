import type { GenderType as IGenderType } from '@dailyuse/contracts/account';

// 1. Branded Type - 零开销的名义类型
// 编译时是对象，运行时纯粹是 string
export type GenderType = IGenderType & { readonly __brand: unique symbol };

// 内部常量：定义合法值的集合，作为 Single Source of Truth
const VALUES: IGenderType[] = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

// 2. 伴生对象 - 提供静态方法和行为
export const GenderType = {
  // 预定义值
  MALE: 'MALE' as GenderType,
  FEMALE: 'FEMALE' as GenderType,
  OTHER: 'OTHER' as GenderType,
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY' as GenderType,

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 GenderType
   */
  of(value: string): GenderType {
    // 使用 Type Guard 进行检查
    if (!this.isValid(value)) {
      throw new Error(`Invalid gender type: ${value}`);
    }
    return value;
  },

  /**
   * 🛡️ 类型守卫 (Type Guard)
   * 用于 if (GenderType.isValid(str)) { ... } 场景，TS 会自动推断类型
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

  // ================= 行为方法 =================
  // 行为方法第一个参数永远是 type 自身

  isSpecified(gender: GenderType): boolean {
    return gender !== this.PREFER_NOT_TO_SAY;
  },

  /**
   * UI 展示名称 (国际化 key 或直接返回中文)
   */
  getDisplayName(gender: GenderType): string {
    const map: Record<IGenderType, string> = {
      'MALE': '男',
      'FEMALE': '女',
      'OTHER': '其他',
      'PREFER_NOT_TO_SAY': '不愿透露'
    };
    // 这里的 as string 是为了处理 TS 索引签名的一个小坑，或者直接用 switch
    return map[gender as IGenderType] ?? '未知';
  }
};