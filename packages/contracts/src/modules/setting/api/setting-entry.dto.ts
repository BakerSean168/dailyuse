import { z } from 'zod';
import type { SettingEntryClientDTO } from '../entities';

const settingCategorySchema = z.string().optional();
const entrySchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  category: settingCategorySchema,
});

export const UpdateSettingEntrySchema = entrySchema;
export type UpdateSettingEntryReq = z.infer<typeof UpdateSettingEntrySchema>;
export type UpdateSettingEntryRes = SettingEntryClientDTO;

export const BatchUpdateSettingEntriesSchema = z.object({
  entries: z.array(entrySchema).min(1),
});
export type BatchUpdateSettingEntriesReq = z.infer<typeof BatchUpdateSettingEntriesSchema>;
export type BatchUpdateSettingEntriesRes = {
  readonly updated: number;
  readonly failed: number;
  readonly errors?: Array<{ key: string; error: string }>;
};

export const DeleteSettingEntrySchema = z.object({
  key: z.string().min(1),
});
export type DeleteSettingEntryReq = z.infer<typeof DeleteSettingEntrySchema>;
export type DeleteSettingEntryRes = { readonly ok: boolean; readonly message?: string };

export const QuerySettingEntriesSchema = z.object({
  category: settingCategorySchema,
  keys: z.array(z.string().min(1)).optional(),
  search: z.string().optional(),
});
export type QuerySettingEntriesQuery = z.infer<typeof QuerySettingEntriesSchema>;
export type QuerySettingEntriesRes = {
  readonly entries: SettingEntryClientDTO[];
  readonly total: number;
};
