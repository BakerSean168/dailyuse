import { z } from 'zod';
import type { UserSettingClientDTO } from '../aggregates';
import { CATEGORY_SCHEMAS } from '../preferences/schemas';
import type { PreferenceCategory } from '../preferences/defaults';

const identityIdSchema = z.string().min(1);

// ─── Public Transport Schemas (no identityId) ─────────────
// These are used by the public API - identityId is injected from request context

/** Public schema for GET - no identityId (injected from context) */
export const GetUserSettingPublicSchema = z.object({});
export type GetUserSettingPublic = z.infer<typeof GetUserSettingPublicSchema>;

/** Public schema for CREATE - no identityId (injected from context) */
export const CreateUserSettingPublicSchema = z.object({});
export type CreateUserSettingPublic = z.infer<typeof CreateUserSettingPublicSchema>;

/** Public schema for RESET - no identityId (injected from context) */
export const ResetUserSettingPublicSchema = z.object({
  category: z.string().optional(),
  confirmedReset: z.boolean().default(true),
});
export type ResetUserSettingPublic = z.infer<typeof ResetUserSettingPublicSchema>;

// ─── Internal Schemas (with identityId for application layer) ────

/** @internal Internal schema with identityId - for application layer use */
export const GetUserSettingSchema = z.object({
  identityId: identityIdSchema.optional(),
});
export type GetUserSettingReq = z.infer<typeof GetUserSettingSchema>;
export type GetUserSettingRes = UserSettingClientDTO;

/** @internal Internal schema with identityId - for application layer use */
export const CreateUserSettingSchema = z.object({
  identityId: identityIdSchema,
});
export type CreateUserSettingReq = z.infer<typeof CreateUserSettingSchema>;
export type CreateUserSettingRes = UserSettingClientDTO;

// ─── Category-level Patch Schema ──────────────────────────

const categoryNames = Object.keys(CATEGORY_SCHEMAS) as [string, ...string[]];

export const PatchUserSettingSchema = z.object({
  category: z.enum(categoryNames),
  patch: z.record(z.string(), z.unknown()),
});
export type PatchUserSettingReq = z.infer<typeof PatchUserSettingSchema>;
export type PatchUserSettingRes = UserSettingClientDTO;

/** @internal Internal schema with identityId - for application layer use */
export const ResetUserSettingSchema = z.object({
  identityId: identityIdSchema.optional(),
  category: z.string().optional(),
  confirmedReset: z.boolean().default(true),
});
export type ResetUserSettingReq = z.infer<typeof ResetUserSettingSchema>;
export type ResetUserSettingRes = UserSettingClientDTO;

export interface SettingOperationRes {
  readonly ok: boolean;
  readonly message?: string;
}
