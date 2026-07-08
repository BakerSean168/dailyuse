import type { LanguageCode as ILanguageCode } from '@dailyuse/contracts/account';

export type LanguageCode = ILanguageCode & { readonly __brand: unique symbol };

const VALUES: ILanguageCode[] = ['en-US', 'zh-CN', 'ja-JP'];

export const LanguageCode = {
  EN_US: 'en-US' as LanguageCode,
  ZH_CN: 'zh-CN' as LanguageCode,
  JA_JP: 'ja-JP' as LanguageCode,

  of(value: string): LanguageCode {
    if (!this.isValid(value)) {
      throw new Error(`Invalid language code: ${value}`);
    }
    return value as LanguageCode;
  },

  isValid(value: string): value is LanguageCode {
    return VALUES.includes(value as ILanguageCode);
  },

  getAll(): LanguageCode[] {
    return VALUES as LanguageCode[];
  },

  isChinese(code: LanguageCode): boolean { return code === this.ZH_CN; },
  isEnglish(code: LanguageCode): boolean { return code === this.EN_US; },
  isJapanese(code: LanguageCode): boolean { return code === this.JA_JP; },

  getIso639_1(code: LanguageCode): string {
    return (code as string).split('-')[0];
  },

  getCountryCode(code: LanguageCode): string {
    const parts = (code as string).split('-');
    return parts.length > 1 ? parts[1] : '';
  },

  getDirection(_code: LanguageCode): 'ltr' | 'rtl' {
    return 'ltr';
  },

  getHtmlLangAttribute(code: LanguageCode): string {
    return code as string;
  },
};
