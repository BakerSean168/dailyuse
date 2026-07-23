/**
 * Authentication - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId } from '../value-objects/identity-id';
import type { AuthSessionId } from '../value-objects/auth-session-id';
import { AuthIdentityStatus } from '../value-objects/auth-identity-status';

const DeviceInfoSchema = z.object({
  deviceId: z.string(),
  deviceType: z.string(),
});

const AuthIdentitySchema = z.object({
  id: brandedId<IdentityId>(),
  status: z.enum(AuthIdentityStatus),
});

const AuthSessionSchema = z.object({
  id: brandedId<AuthSessionId>(),
  identityId: brandedId<IdentityId>(),
  deviceInfo: DeviceInfoSchema,
  isCurrentSession: z.boolean(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  expiresAt: z.number(),
  lastActiveAt: z.number(),
  deletedAt: z.number().nullable(),
});

/**
 * Auth Response Schema (token pair)
 */
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  identity: AuthIdentitySchema,
  session: AuthSessionSchema,
});

// Residual 713: CurrentUser / SessionList OpenAPI schemas are the sole response shapes
// (CurrentUserDTO / ListSessionsRes are z.infer aliases).
export const CurrentUserResponseSchema = z.object({
  identity: AuthIdentitySchema,
  session: AuthSessionSchema.nullable(),
  emailVerification: z
    .object({
      required: z.boolean(),
      emailMasked: z.string().optional(),
    })
    .optional(),
});

export const SessionListResponseSchema = z.object({
  sessions: z.array(AuthSessionSchema),
});
