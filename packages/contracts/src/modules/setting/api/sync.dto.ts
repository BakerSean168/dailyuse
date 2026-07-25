import { z } from 'zod';
import {
  ExportSettingsResponseSchema,
  ImportSettingsResponseSchema,
} from './response-schemas';

export const SyncSettingsSchema = z.object({
  force: z.boolean().optional(),
});
export type SyncSettingsReq = z.infer<typeof SyncSettingsSchema>;

export const ExportSettingsSchema = z.object({
  format: z.enum(['json']).default('json').optional(),
});
export type ExportSettingsReq = z.infer<typeof ExportSettingsSchema>;

// Residual 771: export/import settings Res duals retired — OpenAPI + transport use
// *ResponseSchema (semantic Res are z.infer aliases).
export type ExportSettingsRes = z.infer<typeof ExportSettingsResponseSchema>;

export const ImportSettingsSchema = z.object({
  data: z.string().min(1),
  overwrite: z.boolean().optional(),
});
export type ImportSettingsReq = z.infer<typeof ImportSettingsSchema>;
export type ImportSettingsRes = z.infer<typeof ImportSettingsResponseSchema>;
