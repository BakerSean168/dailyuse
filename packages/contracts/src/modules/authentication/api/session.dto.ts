/**
 * Authentication - Session Operations
 *
 * 所有与会话管理相关的API定义：Token刷新、登出、验证Token、会话管理
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AuthSessionId } from '../value-objects/auth-session-id';
import type { IdentityId } from '../value-objects/identity-id';
import type { AuthResponseDTO } from '../dtos/auth-response';
import {
  CurrentUserResponseSchema,
  SessionListResponseSchema,
} from './response-schemas';

// ============================================================================
// Token Refresh
// ============================================================================

/**
 * 刷新 Token Schema
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenReq = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenRes = AuthResponseDTO;

// ============================================================================
// Logout
// ============================================================================

/**
 * 登出
 */
export type LogoutReq = void;

// ============================================================================
// Token Validation
// ============================================================================

/**
 * 验证 Token
 */
export type ValidateTokenReq = void;

export interface ValidateTokenRes {
  valid: boolean;
  identityId?: IdentityId;
  expiresAt?: number;
}

// ============================================================================
// Get Current User
// ============================================================================

export type GetCurrentUserReq = void;

// Residual 713: current-user dual body retired — OpenAPI + transport use CurrentUserResponseSchema.
export type CurrentUserDTO = z.infer<typeof CurrentUserResponseSchema>;
export type GetCurrentUserRes = CurrentUserDTO;

// ============================================================================
// Session Management
// ============================================================================

export type ListSessionsReq = void;

// Residual 713: session list dual body retired — OpenAPI + transport use SessionListResponseSchema.
export type ListSessionsRes = z.infer<typeof SessionListResponseSchema>;

export const RevokeSessionSchema = z.object({
  sessionId: brandedId<AuthSessionId>(),
});

export type RevokeSessionReq = z.infer<typeof RevokeSessionSchema>;
export type RevokeSessionRes = void;

// ============================================================================
// Guest Mode (Desktop)
// ============================================================================

export interface GuestModeRes {
  identityId: IdentityId;
  mode: string;
  message: string;
}
