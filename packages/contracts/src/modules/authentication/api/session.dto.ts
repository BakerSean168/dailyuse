/**
 * Authentication - Session Operations
 * 
 * 所有与会话管理相关的API定义：Token刷新、登出、验证Token、会话管理
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos';

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
export type LogoutRes = void;

// ============================================================================
// Token Validation
// ============================================================================

/**
 * 验证 Token
 */
export type ValidateTokenReq = void;

export interface ValidateTokenRes {
  valid: boolean;
  accountUuid?: string;
  expiresAt?: number;
}

// ============================================================================
// Get Current User
// ============================================================================

export type GetCurrentUserReq = void;
export type GetCurrentUserRes = AuthResponseDTO;

// ============================================================================
// Session Management
// ============================================================================

export type ListSessionsReq = void;

export interface ListSessionsRes {
  sessions: Array<{
    sessionId: string;
    deviceInfo?: string;
    createdAt: number;
    lastActiveAt: number;
    ipAddress?: string;
  }>;
}

export const RevokeSessionSchema = z.object({
  sessionId: z.string(),
});

export type RevokeSessionReq = z.infer<typeof RevokeSessionSchema>;
export type RevokeSessionRes = void;
