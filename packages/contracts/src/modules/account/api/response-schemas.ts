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
  status: z.string(),
  profile: z.object({
    nickname: z.string(),
    realName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    bio: z.string().nullable(),
    gender: z.string(),
    birthday: z.union([z.number(), z.null()]),
  }),
  settings: z.object({
    theme: z.string(),
    language: z.string(),
    timezone: z.string(),
    notificationEnabled: z.boolean(),
  }),
  email: z.object({
    address: z.string().email(),
    isVerified: z.boolean(),
    verifiedAt: z.union([z.number(), z.null()]),
    isPrimary: z.boolean(),
  }),
  phone: z
    .object({
      countryCode: z.string(),
      number: z.string(),
      fullNumber: z.string(),
      isVerified: z.boolean(),
      verifiedAt: z.union([z.number(), z.null()]),
    })
    .nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.union([z.number(), z.null()]),
});

/**
 * Availability Response Schema
 */
export const AvailabilityResponseSchema = z.object({
  available: z.boolean(),
  suggestion: z.string().optional(),
});
