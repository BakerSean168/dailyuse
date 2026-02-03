/**
 * Account Lifecycle Operations
 * 
 * This file contains DTOs for account lifecycle management.
 * Includes closing account, exporting and importing account data.
 */

import { z } from 'zod';
import type { ExportAccountDataDTO, ImportAccountDataResultDTO } from '../dtos';

// ============================================================================
// ACCOUNT LIFECYCLE Operations
// ============================================================================

/**
 * 注销账号 Schema
 */
export const CloseAccountSchema = z.object({
  reason: z.string().min(1, "请填写注销原因"),
  feedback: z.string().optional(),
});

export type CloseAccountReq = z.infer<typeof CloseAccountSchema>;
export type CloseAccountRes = void;

/**
 * 导出账户数据
 */
export type ExportAccountDataReq = void;
export type ExportAccountDataRes = ExportAccountDataDTO;

/**
 * 导入账户数据 Schema
 */
export const ImportAccountDataSchema = z.object({
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  mergeMode: z.enum(['REPLACE', 'MERGE', 'SKIP']).optional().default('MERGE'),
});

export type ImportAccountDataReq = z.infer<typeof ImportAccountDataSchema>;
export type ImportAccountDataRes = ImportAccountDataResultDTO;
