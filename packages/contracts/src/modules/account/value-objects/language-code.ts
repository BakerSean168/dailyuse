export const LanguageCode = {
    EN_US: 'en-US',
    ZH_CN: 'zh-CN',
    JA_JP: 'ja-JP',
} as const;

export type LanguageCode = (typeof LanguageCode)[keyof typeof LanguageCode];