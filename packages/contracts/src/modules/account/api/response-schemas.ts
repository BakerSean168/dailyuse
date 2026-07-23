/**
 * Account - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId } from '../value-objects/identity-id';
import { AccountStatus } from '../value-objects/account-status';
import { GenderType } from '../value-objects/gender-type';
import { ThemeType } from '../value-objects/theme-type';
import { LanguageCode } from '../value-objects/language-code';

/**
 * Account Response Schema
 */
export const AccountResponseSchema = z.object({
  id: brandedId<IdentityId>(),
  status: z.enum(AccountStatus),
  profile: z.object({
    nickname: z.string(),
    realName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    bio: z.string().nullable(),
    gender: z.enum(GenderType),
    birthday: z.union([z.number(), z.null()]),
  }),
  settings: z.object({
    theme: z.enum(ThemeType),
    language: z.enum(LanguageCode),
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
 *
 * Residual 767: sole availability response shape (CheckAvailabilityRes is z.infer alias).
 */
export const AvailabilityResponseSchema = z.object({
  available: z.boolean(),
  suggestion: z.string().optional(),
});
