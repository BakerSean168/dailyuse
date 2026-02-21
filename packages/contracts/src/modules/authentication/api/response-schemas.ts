/**
 * Authentication - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';

/**
 * Auth Response Schema (token pair)
 */
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
});
