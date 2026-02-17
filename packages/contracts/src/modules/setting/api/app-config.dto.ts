import { z } from 'zod';
import type { AppConfigClientDTO } from '../aggregates';

export const GetAppConfigSchema = z.object({
  identityId: z.string().min(1).optional(),
});
export type GetAppConfigReq = z.infer<typeof GetAppConfigSchema>;
export type GetAppConfigRes = AppConfigClientDTO;

export const UpdateAppConfigSchema = z.object({
  windowBounds: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      x: z.number().int(),
      y: z.number().int(),
    })
    .optional(),
  lastOpenedRepository: z.string().nullable().optional(),
  localDataPath: z.string().optional(),
  sidebarCollapsed: z.boolean().optional(),
});
export type UpdateAppConfigReq = z.infer<typeof UpdateAppConfigSchema>;
export type UpdateAppConfigRes = AppConfigClientDTO;
