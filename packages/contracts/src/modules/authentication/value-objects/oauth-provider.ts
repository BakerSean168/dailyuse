export const OAuthProvider = {
  Google: 'Google',
  Facebook: 'Facebook',
  Github: 'Github',
  Apple: 'Apple',
  Wechat: 'Wechat',
  Weibo: 'Weibo',
} as const;

export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider];
