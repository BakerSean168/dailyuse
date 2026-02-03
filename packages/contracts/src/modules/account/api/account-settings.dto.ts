/**
 * Account Settings Operations
 * 
 * This file contains DTOs for managing account settings.
 * Includes notification preferences, security settings, and display preferences.
 */

import { z } from 'zod';
import type { AccountSettingsDTO } from '../dtos';

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
