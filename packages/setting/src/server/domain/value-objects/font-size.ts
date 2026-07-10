import { FontSize as FontSizeContract, type FontSize as IFontSize } from '@dailyuse/contracts/setting';

/**
 * 📝 字体大小 - 应用的字体大小选项
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type FontSize = IFontSize & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IFontSize[] = Object.values(FontSizeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const FontSize = {
  // ================= 常量定义 =================
  
  Small: 'Small' as FontSize,
  Medium: 'Medium' as FontSize,
  Large: 'Large' as FontSize,

  // ================= 工厂方法 =================

  of(value: string): FontSize {
    if (!this.isValid(value)) {
      throw new Error(`Invalid FontSize: ${value}`);
    }
    return value as FontSize;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is FontSize {
    return VALUES.includes(value as IFontSize);
  },

  // ================= 遍历方法 =================

  getAll(): FontSize[] {
    return VALUES as FontSize[];
  },

  // ================= 工具方法 =================

  /**
   * 获取字体大小的像素值
   */
  toPx(value: FontSize): number {
    const sizeMap: Record<IFontSize, number> = {
      Small: 12,
      Medium: 14,
      Large: 16,
    };
    return sizeMap[value as IFontSize];
  },

  /**
   * 判断是否为小字体
   */
  isSmall(value: FontSize): boolean {
    return value === 'Small';
  },

  /**
   * 判断是否为大字体
   */
  isLarge(value: FontSize): boolean {
    return value === 'Large';
  },
};
