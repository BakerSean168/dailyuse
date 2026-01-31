export const OAuthProvider = {
    GOOGLE: 'GOOGLE',
    FACEBOOK: 'FACEBOOK',
    GITHUB: 'GITHUB',
    APPLE: 'APPLE',
    WECHAT: 'WECHAT',
    WEIBO: 'WEIBO'
} as const;

export type OAuthProvider = typeof OAuthProvider[keyof typeof OAuthProvider];
