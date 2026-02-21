/**
 * Account - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';

/**
 * Account Response Schema
 */
export const AccountResponseSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  nickname: z.string().optional(),
  avatar: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Availability Response Schema
 */
export const AvailabilityResponseSchema = z.object({
  available: z.boolean(),
  suggestion: z.string().optional(),
});
