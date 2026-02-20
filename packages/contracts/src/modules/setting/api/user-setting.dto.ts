import { z } from 'zod';
import { openApiJsonValue } from '@/primitives';
import type { UserSettingClientDTO } from '../aggregates';

const identityIdSchema = z.string().min(1);
const unknownRecordSchema = z.record(z.string(), openApiJsonValue);

export const GetUserSettingSchema = z.object({
  identityId: identityIdSchema.optional(),
});
export type GetUserSettingReq = z.infer<typeof GetUserSettingSchema>;
export type GetUserSettingRes = UserSettingClientDTO;

export const CreateUserSettingSchema = z.object({
  identityId: identityIdSchema,
  entries: unknownRecordSchema.optional(),
});
export type CreateUserSettingReq = z.infer<typeof CreateUserSettingSchema>;
export type CreateUserSettingRes = UserSettingClientDTO;

export const UpdateAppearanceSchema = z.object({
  theme: z.string().optional(),
  fontSize: z.string().optional(),
  density: z.string().optional(),
  compactMode: z.boolean().optional(),
});
export type UpdateAppearanceReq = z.infer<typeof UpdateAppearanceSchema>;
export type UpdateAppearanceRes = UserSettingClientDTO;

export const UpdateLocaleSchema = z.object({
  language: z.string().min(2).optional(),
  timezone: z.string().optional(),
  timeFormat: z.string().optional(),
  dateFormat: z.string().optional(),
});
export type UpdateLocaleReq = z.infer<typeof UpdateLocaleSchema>;
export type UpdateLocaleRes = UserSettingClientDTO;

export const UpdateWorkflowSchema = z.object({
  defaultView: z.string().optional(),
  startOfWeek: z.number().int().min(0).max(6).optional(),
  autoSave: z.boolean().optional(),
  focusMode: z.boolean().optional(),
});
export type UpdateWorkflowReq = z.infer<typeof UpdateWorkflowSchema>;
export type UpdateWorkflowRes = UserSettingClientDTO;

export const UpdatePrivacySchema = z.object({
  profileVisibility: z.string().optional(),
  shareAnalytics: z.boolean().optional(),
  telemetryEnabled: z.boolean().optional(),
});
export type UpdatePrivacyReq = z.infer<typeof UpdatePrivacySchema>;
export type UpdatePrivacyRes = UserSettingClientDTO;

export const UpdateExperimentalSchema = z.object({
  featureFlags: unknownRecordSchema.optional(),
});
export type UpdateExperimentalReq = z.infer<typeof UpdateExperimentalSchema>;
export type UpdateExperimentalRes = UserSettingClientDTO;

export const UpdateUserSettingSchema = z.object({
  id: z.string().min(1).optional(),
  appearance: UpdateAppearanceSchema.optional(),
  locale: UpdateLocaleSchema.optional(),
  workflow: UpdateWorkflowSchema.optional(),
  privacy: UpdatePrivacySchema.optional(),
  experimental: UpdateExperimentalSchema.optional(),
  entries: unknownRecordSchema.optional(),
});
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
