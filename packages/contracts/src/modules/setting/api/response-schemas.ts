/**
 * Setting - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { IdentityId } from '@/primitives';

/**
 * UserSetting Response Schema
 */
export const UserSettingResponseSchema = z.object({
  id: z.string(),
  identityId: brandedId<IdentityId>(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Export Settings Response Schema
 */
export const ExportSettingsResponseSchema = z.object({
  data: z.string(),
  fileName: z.string(),
});

/**
 * Import Settings Response Schema
 */
export const ImportSettingsResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
});
