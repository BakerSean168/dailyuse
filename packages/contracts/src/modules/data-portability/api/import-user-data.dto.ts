/**
 * Import User Data — API request/response DTOs
 */

import { z } from 'zod';

// ============ Import Request ============

export const ImportUserDataReqSchema = z
  .object({
    content: z.string().max(10_000_000, 'Import content exceeds 10 MB limit'),
    dryRun: z.boolean().optional(),
  })
  .strict();

export type ImportUserDataReq = z.infer<typeof ImportUserDataReqSchema>;

// ============ Import Response ============

export const ImportUserDataResSchema = z
  .object({
    batchId: z.string(),
    dryRun: z.boolean(),
    created: z.record(z.string(), z.number()),
    updatedSingletons: z.record(z.string(), z.number()),
    skipped: z.record(z.string(), z.number()),
    warnings: z.array(z.string()),
  })
  .strict();

export type ImportUserDataRes = z.infer<typeof ImportUserDataResSchema>;
