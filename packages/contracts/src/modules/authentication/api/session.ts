import { z } from 'zod';
import type { AuthIdentityClientDTO, AuthSessionClientDTO } from '../aggregates';

// ============ 1. 获取当前用户 (WhoAmI) ============
// 依赖 Header 中的 AccessToken
export type GetCurrentUserReq = void;
export interface GetCurrentUserRes {
  identity: AuthIdentityClientDTO;
  currentSession: AuthSessionClientDTO;
}

// ============ 2. 刷新 Token ============
export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenReq = z.infer<typeof RefreshTokenSchema>;
export interface RefreshTokenRes {
  accessToken: string;
  refreshToken: string; // 轮换机制：每次刷新下发新的 RefreshToken
}

// ============ 3. 获取会话列表 ============
export type ListSessionsReq = void;
export interface ListSessionsRes {
  sessions: AuthSessionClientDTO[];
}

// ============ 4. 踢出/注销会话 ============
export const RevokeSessionSchema = z.object({
  sessionId: z.string(),
});

export type RevokeSessionReq = z.infer<typeof RevokeSessionSchema>;
export type RevokeSessionRes = void;