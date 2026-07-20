/**
 * Authentication - OAuth Operations
 *
 * 所有与第三方登录相关的API定义：OAuth授权、获取OAuth URL、回调处理
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos/auth-response';

// ============================================================================
// Get OAuth URL
// ============================================================================

/**
 * 获取 OAuth 授权 URL Schema
 */
export const GetOAuthUrlSchema = z.object({
  provider: z.enum(['Google', 'Github', 'Microsoft', 'Apple']),
  redirectUri: z.string().url().optional(),
});

export type GetOAuthUrlReq = z.infer<typeof GetOAuthUrlSchema>;

export interface GetOAuthUrlRes {
  authUrl: string;
  state: string;
}

// ============================================================================
// OAuth Callback
// ============================================================================

/**
 * OAuth 回调处理 Schema
 */
export const OAuthCallbackSchema = z.object({
  provider: z.enum(['Google', 'Github', 'Microsoft', 'Apple']),
  code: z.string(),
  state: z.string(),
});

export type OAuthCallbackReq = z.infer<typeof OAuthCallbackSchema>;
export type OAuthCallbackRes = AuthResponseDTO;

// ============================================================================
// OAuth Authorization
// ============================================================================

/**
 * OAuth 授权 Schema
 */
export const OAuthAuthorizeSchema = z.object({
  provider: z.enum(['Google', 'Github', 'Microsoft', 'Apple']),
  code: z.string(),
  state: z.string().optional(),
  redirectUri: z.string().url().optional(),
});

export type OAuthAuthorizeReq = z.infer<typeof OAuthAuthorizeSchema>;
export type OAuthAuthorizeRes = AuthResponseDTO;

// ============================================================================
// Bind / Unbind OAuth (authenticated account linking)
// ============================================================================

/**
 * Bind an OAuth provider to the currently authenticated identity.
 * 将 OAuth 提供者绑定到当前已登录身份。
 *
 * Uses the same authorize callback payload (code + state) issued by getOAuthUrl.
 * 使用 getOAuthUrl 签发的同一授权回调载荷（code + state）。
 */
export const BindOAuthSchema = z.object({
  provider: z.enum(['Google', 'Github', 'Microsoft', 'Apple']),
  code: z.string().min(1),
  state: z.string().min(1),
});

export type BindOAuthReq = z.infer<typeof BindOAuthSchema>;

export interface BindOAuthRes {
  /** Provider that was bound. */
  provider: BindOAuthReq['provider'];
  /** Stable provider subject id (e.g. GitHub numeric user id). */
  providerSubjectId: string;
  /** Whether the binding was newly created (false when already bound to self). */
  created: boolean;
}

/**
 * Unbind an OAuth provider from the currently authenticated identity.
 * 从当前已登录身份解绑 OAuth 提供者。
 */
export const UnbindOAuthSchema = z.object({
  provider: z.enum(['Google', 'Github', 'Microsoft', 'Apple']),
});

export type UnbindOAuthReq = z.infer<typeof UnbindOAuthSchema>;
export type UnbindOAuthRes = void;

// ============================================================================
// OAuth providers availability (UI gating, no state issuance)
// ============================================================================

export interface OAuthProviderAvailability {
  provider: 'Google' | 'Github' | 'Microsoft' | 'Apple';
  enabled: boolean;
}

export interface OAuthProvidersRes {
  providers: OAuthProviderAvailability[];
}
