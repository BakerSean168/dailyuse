import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos';
import { OAuthProvider } from '../value-objects/oauth-provider';

// ============ 1. 获取跳转链接 ============
export const GetOAuthUrlSchema = z.object({
  provider: z.enum(OAuthProvider),
  // 前端可以指定回调成功后跳转回哪个页面 (比如是从购物车页面跳去登录的)
  redirectUrl: z.string().url().optional(), 
});

export type GetOAuthUrlReq = z.infer<typeof GetOAuthUrlSchema>;
export interface GetOAuthUrlRes {
  url: string; // 后端构造好的带 state 的第三方授权地址
}

// ============ 2. OAuth 回调 ============
// 前端接收到 callback?code=xxx 后调用此接口
export const OAuthCallbackSchema = z.object({
  provider: z.enum(OAuthProvider),
  code: z.string(),
  state: z.string().optional(), // 用于防 CSRF 攻击校验
});

export type OAuthCallbackReq = z.infer<typeof OAuthCallbackSchema>;
export type OAuthCallbackRes = AuthResponseDTO;
