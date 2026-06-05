/**
 * Export User Data — API request/response DTOs
 */

import { z } from 'zod';
import { ExportableModuleSchema } from '../dtos/exportable-module.dto';

// ============ Export Request ============

export const ExportUserDataReqSchema = z
  .object({
    include: z.array(ExportableModuleSchema).optional(),
  })
  .strict();

export type ExportUserDataReq = z.infer<typeof ExportUserDataReqSchema>;

// ============ Export Response ============

export const ExportUserDataResSchema = z
  .object({
    fileName: z.string(),
    content: z.string(),
    summary: z
      .object({
        entityCounts: z.record(z.string(), z.number()),
        warnings: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export type ExportUserDataRes = z.infer<typeof ExportUserDataResSchema>;
