import { z } from 'zod';
import type { UserSettingClientDTO } from '../aggregates';
import { CATEGORY_SCHEMAS } from '../preferences/schemas';

// ─── Public Transport Schemas (no identityId) ─────────────
// These are used by the public API - identityId is injected from request context

/** Public schema for GET - no identityId (injected from context) */
export const GetUserSettingPublicSchema = z.object({});
export type GetUserSettingPublic = z.infer<typeof GetUserSettingPublicSchema>;
export type GetUserSettingRes = UserSettingClientDTO;

/** Public schema for RESET - no identityId (injected from context) */
export const ResetUserSettingPublicSchema = z.object({
  category: z.string().optional(),
  confirmedReset: z.boolean().default(true),
});
export type ResetUserSettingPublic = z.infer<typeof ResetUserSettingPublicSchema>;
export type ResetUserSettingRes = UserSettingClientDTO;

// ─── Category-level Patch Schema ──────────────────────────

const categoryNames = Object.keys(CATEGORY_SCHEMAS) as [string, ...string[]];

export const PatchUserSettingSchema = z.object({
  category: z.enum(categoryNames),
  patch: z.record(z.string(), z.unknown()),
});
export type PatchUserSettingReq = z.infer<typeof PatchUserSettingSchema>;
export type PatchUserSettingRes = UserSettingClientDTO;

export interface SettingOperationRes {
  readonly ok: boolean;
  readonly message?: string;
}
