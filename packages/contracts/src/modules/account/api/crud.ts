/**
 * Account Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities/dtos）
 */

import { z } from 'zod';
import type { AccountClientDTO } from '../aggregates';
import type { AccountSettingsDTO, ExportAccountDataDTO, ImportAccountDataResultDTO } from '../dtos';

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

// ============================================================================
// ACCOUNT AVAILABILITY Check
// ============================================================================

/**
 * 检查属性可用性 Schema
 */
export const CheckAvailabilitySchema = z.object({
  type: z.enum(['NICKNAME', 'EMAIL']),
  value: z.string(),
});

export type CheckAvailabilityReq = z.infer<typeof CheckAvailabilitySchema>;

export interface CheckAvailabilityRes {
  available: boolean;
  suggestion?: string;
}

// ============================================================================
// ACCOUNT LIFECYCLE Operations
// ============================================================================

/**
 * 注销账号 Schema
 */
export const CloseAccountSchema = z.object({
  reason: z.string().min(1, "请填写注销原因"),
  feedback: z.string().optional(),
});

export type CloseAccountReq = z.infer<typeof CloseAccountSchema>;
export type CloseAccountRes = void;

/**
 * 导出账户数据
 */
export type ExportAccountDataReq = void;
export type ExportAccountDataRes = ExportAccountDataDTO;

/**
 * 导入账户数据 Schema
 */
export const ImportAccountDataSchema = z.object({
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  mergeMode: z.enum(['REPLACE', 'MERGE', 'SKIP']).optional().default('MERGE'),
});

export type ImportAccountDataReq = z.infer<typeof ImportAccountDataSchema>;
export type ImportAccountDataRes = ImportAccountDataResultDTO;

// ============================================================================
// ACCOUNT SETTINGS Operations
// ============================================================================

/**
 * 获取账户设置
 */
export type GetAccountSettingsReq = void;
export type GetAccountSettingsRes = AccountSettingsDTO;

/**
 * 更新账户设置 Schema
 */
export const UpdateAccountSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  privacyLevel: z.enum(['public', 'friends', 'private']).optional(),
  dataRetention: z.number().int().min(1).max(3650).optional(), // 1 day to 10 years
});

export type UpdateAccountSettingsReq = z.infer<typeof UpdateAccountSettingsSchema>;
export type UpdateAccountSettingsRes = AccountSettingsDTO;
