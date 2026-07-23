/**
 * Authentication - OAuth Operations
 *
 * 所有与第三方登录相关的API定义：OAuth授权、获取OAuth URL、回调处理
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos/auth-response';

// Residual 763: OAuth provider enum dual retired — sole OAuthProviderSchema body.
export const OAuthProviderSchema = z.enum(['Google', 'Github', 'Microsoft', 'Apple']);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

// ============================================================================
// Get OAuth URL
// ============================================================================

/**
 * 获取 OAuth 授权 URL Schema
 */
export const GetOAuthUrlSchema = z.object({
  provider: OAuthProviderSchema,
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
// Residual 759: OAuth callback/bind share one authorize-callback payload schema.
export const OAuthCallbackSchema = z.object({
  provider: OAuthProviderSchema,
  code: z.string().min(1),
  state: z.string().min(1),
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
  provider: OAuthProviderSchema,
  code: z.string(),
  state: z.string().optional(),
  redirectUri: z.string().url().optional(),
});

export type OAuthAuthorizeReq = z.infer<typeof OAuthAuthorizeSchema>;

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
// Residual 759: bind reuses OAuthCallbackSchema (no dual body).
export const BindOAuthSchema = OAuthCallbackSchema;

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
  provider: OAuthProviderSchema,
});

export type UnbindOAuthReq = z.infer<typeof UnbindOAuthSchema>;

// ============================================================================
// OAuth providers availability (UI gating, no state issuance)
// ============================================================================

export interface OAuthProviderAvailability {
  provider: OAuthProvider;
  enabled: boolean;
}

export interface OAuthProvidersRes {
  providers: OAuthProviderAvailability[];
}
