/**
 * Setting - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId, SettingId } from '../../../primitives';
import { UserPreferencesSchema } from '../preferences/schemas';

/**
 * UserSetting Response Schema
 */
export const UserSettingResponseSchema = z.object({
  id: brandedId<SettingId>(),
  identityId: brandedId<IdentityId>(),
  preferences: UserPreferencesSchema,
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Export Settings Response Schema
 *
 * Residual 771: sole export settings response shape (ExportSettingsRes is z.infer alias).
 */
export const ExportSettingsResponseSchema = z.object({
  data: z.string(),
  fileName: z.string(),
});

/**
 * Import Settings Response Schema
 *
 * Residual 771: sole import settings response shape (ImportSettingsRes is z.infer alias).
 */
export const ImportSettingsResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
});
