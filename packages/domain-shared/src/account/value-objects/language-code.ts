import type { LanguageCode as ILanguageCode } from '@dailyuse/contracts/account';

/**
 * 🌐 语言代码 - 用户界面语言设置
 *
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type LanguageCode = ILanguageCode & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ILanguageCode[] = ['en-US', 'zh-CN', 'ja-JP'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实例
 */
export const LanguageCode = {
  // ================= 常量定义 =================

  EN_US: 'en-US' as LanguageCode,
  ZH_CN: 'zh-CN' as LanguageCode,
  JA_JP: 'ja-JP' as LanguageCode,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 LanguageCode
   * @throws 当输入值不在合法值列表中时
   */
  of(value: string): LanguageCode {
    if (!this.isValid(value)) {
      throw new Error(`Invalid language code: ${value}`);
    }
    return value as LanguageCode;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   * 用于条件判断时的类型细化
   */
  isValid(value: string): value is LanguageCode {
    return VALUES.includes(value as ILanguageCode);
  },

  /**
   * 📋 获取所有可用值
   * 用于前端渲染语言选择器
   */
  getAll(): LanguageCode[] {
    return VALUES as LanguageCode[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 判断是否是中文（简体中文）
   */
  isChinese(code: LanguageCode): boolean {
    return code === this.ZH_CN;
  },

  /**
   * 判断是否是英文（美国英文）
   */
  isEnglish(code: LanguageCode): boolean {
    return code === this.EN_US;
  },

  /**
   * 判断是否是日文
   */
  isJapanese(code: LanguageCode): boolean {
    return code === this.JA_JP;
  },

  /**
   * 获取语言名称（用于语言选择器展示）
   */
  getDisplayName(code: LanguageCode): string {
    const map: Record<ILanguageCode, string> = {
      'en-US': 'English (US)',
      'zh-CN': '简体中文',
      'ja-JP': '日本語'
    };
    return map[code as ILanguageCode] ?? '未知语言';
  },

  /**
   * 获取本地化的语言名称（用该语言显示语言名称）
   */
  getNativeDisplayName(code: LanguageCode): string {
    const map: Record<ILanguageCode, string> = {
      'en-US': 'English',
      'zh-CN': '中文',
      'ja-JP': '日本語'
    };
    return map[code as ILanguageCode] ?? '未知';
  },

  /**
   * 获取语言的 ISO 639-1 代码（两字母代码）
   * @example 'zh-CN' => 'zh'
   */
  getIso639_1(code: LanguageCode): string {
    return (code as string).split('-')[0];
  },

  /**
   * 获取语言的地区代码
   * @example 'zh-CN' => 'CN'
   */
  getCountryCode(code: LanguageCode): string {
    const parts = (code as string).split('-');
    return parts.length > 1 ? parts[1] : '';
  },

  /**
   * 获取语言的方向（用于 RTL/LTR 布局）
   * @returns 'ltr' 或 'rtl'
   */
  getDirection(code: LanguageCode): 'ltr' | 'rtl' {
    // 目前支持的语言都是 LTR（从左到右）
    // 如果后续支持 Arabic 等，可以返回 'rtl'
    return 'ltr';
  },

  /**
   * 获取该语言下的 HTML lang 属性值
   */
  getHtmlLangAttribute(code: LanguageCode): string {
    return code as string;
  }
};
