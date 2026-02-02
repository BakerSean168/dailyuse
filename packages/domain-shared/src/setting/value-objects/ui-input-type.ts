import type { UIInputType as IUIInputType } from '@dailyuse/contracts/setting';

/**
 * 📝 UI 输入类型 - 用于设置值输入的 UI 组件类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type UIInputType = IUIInputType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IUIInputType[] = ['Text', 'Number', 'Switch', 'Select', 'Radio', 'Checkbox', 'Slider', 'Color', 'File'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const UIInputType = {
  // ================= 常量定义 =================
  
  Text: 'Text' as UIInputType,
  Number: 'Number' as UIInputType,
  Switch: 'Switch' as UIInputType,
  Select: 'Select' as UIInputType,
  Radio: 'Radio' as UIInputType,
  Checkbox: 'Checkbox' as UIInputType,
  Slider: 'Slider' as UIInputType,
  Color: 'Color' as UIInputType,
  File: 'File' as UIInputType,

  // ================= 工厂方法 =================

  of(value: string): UIInputType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid UIInputType: ${value}`);
    }
    return value as UIInputType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is UIInputType {
    return VALUES.includes(value as IUIInputType);
  },

  // ================= 遍历方法 =================

  getAll(): UIInputType[] {
    return VALUES as UIInputType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为选择类型的输入
   */
  isSelection(value: UIInputType): boolean {
    return value === 'Select' || value === 'Radio' || value === 'Checkbox';
  },

  /**
   * 判断是否为文本输入类型
   */
  isTextInput(value: UIInputType): boolean {
    return value === 'Text' || value === 'Number' || value === 'Color' || value === 'File';
  },

  /**
   * 判断是否为切换类型
   */
  isToggle(value: UIInputType): boolean {
    return value === 'Switch';
  },

  /**
   * 判断是否为滑块类型
   */
  isSlider(value: UIInputType): boolean {
    return value === 'Slider';
  },

  /**
   * 判断是否为文件选择
   */
  isFile(value: UIInputType): boolean {
    return value === 'File';
  },
};
