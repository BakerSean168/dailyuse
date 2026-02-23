import { z } from 'zod';
import type { UserSettingClientDTO } from '../aggregates';
import { CATEGORY_SCHEMAS, UserPreferencesSchema } from '../preferences/schemas';
import type { PreferenceCategory } from '../preferences/defaults';

const identityIdSchema = z.string().min(1);

export const GetUserSettingSchema = z.object({
  identityId: identityIdSchema.optional(),
});
export type GetUserSettingReq = z.infer<typeof GetUserSettingSchema>;
export type GetUserSettingRes = UserSettingClientDTO;

export const CreateUserSettingSchema = z.object({
  identityId: identityIdSchema,
});
export type CreateUserSettingReq = z.infer<typeof CreateUserSettingSchema>;
export type CreateUserSettingRes = UserSettingClientDTO;

// ─── Category-level Patch Schema ──────────────────────────

const categoryNames = Object.keys(CATEGORY_SCHEMAS) as [PreferenceCategory, ...PreferenceCategory[]];

export const PatchUserSettingSchema = z.object({
  category: z.enum(categoryNames),
  patch: z.record(z.unknown()),
});
export type PatchUserSettingReq = z.infer<typeof PatchUserSettingSchema>;
export type PatchUserSettingRes = UserSettingClientDTO;

// ─── Composite Update Schema (backward compat) ───────────

export const UpdateUserSettingSchema = UserPreferencesSchema.partial();
export type UpdateUserSettingReq = z.infer<typeof UpdateUserSettingSchema>;
export type UpdateUserSettingRes = UserSettingClientDTO;

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
