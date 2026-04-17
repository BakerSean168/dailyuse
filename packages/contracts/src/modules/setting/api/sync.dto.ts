import { z } from 'zod';
import type { UserSettingClientDTO } from '../aggregates/user-setting-client';

export const SyncSettingsSchema = z.object({
  force: z.boolean().optional(),
});
export type SyncSettingsReq = z.infer<typeof SyncSettingsSchema>;
export type SyncSettingsRes = UserSettingClientDTO;

export const ExportSettingsSchema = z.object({
  format: z.enum(['json']).default('json').optional(),
});
export type ExportSettingsReq = z.infer<typeof ExportSettingsSchema>;
export type ExportSettingsRes = {
  readonly data: string;
  readonly fileName: string;
};

export const ImportSettingsSchema = z.object({
  data: z.string().min(1),
  overwrite: z.boolean().optional(),
});
export type ImportSettingsReq = z.infer<typeof ImportSettingsSchema>;
export type ImportSettingsRes = {
  readonly imported: number;
  readonly skipped: number;
};
