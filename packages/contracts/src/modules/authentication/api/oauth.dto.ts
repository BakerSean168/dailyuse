/**
 * Authentication - OAuth Operations
 *
 * 所有与第三方登录相关的API定义：OAuth授权、获取OAuth URL、回调处理
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos';

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
