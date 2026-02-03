/**
 * Account Profile Operations
 * 
 * This file contains DTOs for managing account profile information.
 * Includes viewing and updating account details like nickname, avatar, and preferences.
 */

import { z } from 'zod';
import type { AccountClientDTO } from '../aggregates';

// ============================================================================
// ACCOUNT PROFILE Operations
// ============================================================================

/**
 * 获取账户信息
 */
export type GetAccountReq = void;
export type GetAccountRes = AccountClientDTO;

/**
 * 更新账户信息 Schema
 */
export const UpdateAccountSchema = z.object({
  nickname: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  timezone: z.string().optional(),
  language: z.enum(['zh-CN', 'en-US', 'ja-JP']).optional(),
});

export type UpdateAccountReq = z.infer<typeof UpdateAccountSchema>;
export type UpdateAccountRes = AccountClientDTO;
