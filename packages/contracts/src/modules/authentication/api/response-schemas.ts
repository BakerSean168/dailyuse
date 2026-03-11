/**
 * Authentication - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';

const DeviceInfoSchema = z
  .object({
    deviceId: z.string(),
    deviceType: z.string(),
  })
  .passthrough();

const AuthIdentitySchema = z
  .object({
    id: z.string(),
    status: z.string(),
  })
  .passthrough();

const AuthSessionSchema = z
  .object({
    id: z.string(),
    identityId: z.string(),
    deviceInfo: DeviceInfoSchema,
    isCurrentSession: z.boolean(),
    version: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
    expiresAt: z.number(),
    lastActiveAt: z.number(),
    deletedAt: z.number().nullable(),
  })
  .passthrough();

/**
 * Auth Response Schema (token pair)
 */
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  identity: AuthIdentitySchema,
  session: AuthSessionSchema,
});

export const CurrentUserResponseSchema = z.object({
  identity: AuthIdentitySchema,
  session: AuthSessionSchema.nullable(),
});

export const SessionListResponseSchema = z.object({
  sessions: z.array(AuthSessionSchema),
});
