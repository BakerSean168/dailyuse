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

// ─── Per-Category Update Schemas ──────────────────────────

export const UpdateAppearanceSchema = z.object({
  theme: z.string().optional(),
  fontSize: z.number().int().min(10).max(24).optional(),
  compactMode: z.boolean().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().nullable().optional(),
});
export type UpdateAppearanceReq = z.infer<typeof UpdateAppearanceSchema>;
export type UpdateAppearanceRes = UserSettingClientDTO;

export const UpdateLocaleSchema = z.object({
  language: z.string().min(2).optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
  currency: z.string().optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
});
export type UpdateLocaleReq = z.infer<typeof UpdateLocaleSchema>;
export type UpdateLocaleRes = UserSettingClientDTO;

export const UpdateWorkflowSchema = z.object({
  autoSave: z.boolean().optional(),
  autoSaveInterval: z.number().int().min(5000).optional(),
  confirmBeforeDelete: z.boolean().optional(),
  defaultTaskView: z.string().optional(),
  defaultGoalView: z.string().optional(),
  defaultScheduleView: z.string().optional(),
});
export type UpdateWorkflowReq = z.infer<typeof UpdateWorkflowSchema>;
export type UpdateWorkflowRes = UserSettingClientDTO;

export const UpdatePrivacySchema = z.object({
  profileVisibility: z.string().optional(),
  showOnlineStatus: z.boolean().optional(),
  shareUsageData: z.boolean().optional(),
  allowSearchByEmail: z.boolean().optional(),
  allowSearchByPhone: z.boolean().optional(),
});
export type UpdatePrivacyReq = z.infer<typeof UpdatePrivacySchema>;
export type UpdatePrivacyRes = UserSettingClientDTO;

export const UpdateNotificationSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  sound: z.boolean().optional(),
});
export type UpdateNotificationReq = z.infer<typeof UpdateNotificationSchema>;
export type UpdateNotificationRes = UserSettingClientDTO;

export const UpdateEditorSchema = z.object({
  theme: z.string().optional(),
  fontSize: z.number().int().min(10).max(24).optional(),
  tabSize: z.number().int().min(1).max(8).optional(),
  wordWrap: z.boolean().optional(),
  lineNumbers: z.boolean().optional(),
  minimap: z.boolean().optional(),
});
export type UpdateEditorReq = z.infer<typeof UpdateEditorSchema>;
export type UpdateEditorRes = UserSettingClientDTO;

export const UpdateShortcutsSchema = z.object({
  enabled: z.boolean().optional(),
  custom: z.record(z.string(), z.string()).optional(),
});
export type UpdateShortcutsReq = z.infer<typeof UpdateShortcutsSchema>;
export type UpdateShortcutsRes = UserSettingClientDTO;

export const UpdateExperimentalSchema = z.object({
  enabled: z.boolean().optional(),
  features: z.array(z.string()).optional(),
});
export type UpdateExperimentalReq = z.infer<typeof UpdateExperimentalSchema>;
export type UpdateExperimentalRes = UserSettingClientDTO;

export const UpdateUISchema = z.object({
  startPage: z.string().optional(),
  sidebarCollapsed: z.boolean().optional(),
});
export type UpdateUIReq = z.infer<typeof UpdateUISchema>;
export type UpdateUIRes = UserSettingClientDTO;

// ─── Composite Update Schema ─────────────────────────────

export const UpdateUserSettingSchema = z.object({
  id: z.string().min(1).optional(),
  appearance: UpdateAppearanceSchema.optional(),
  locale: UpdateLocaleSchema.optional(),
  workflow: UpdateWorkflowSchema.optional(),
  privacy: UpdatePrivacySchema.optional(),
  notification: UpdateNotificationSchema.optional(),
  editor: UpdateEditorSchema.optional(),
  shortcuts: UpdateShortcutsSchema.optional(),
  experimental: UpdateExperimentalSchema.optional(),
  ui: UpdateUISchema.optional(),
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
