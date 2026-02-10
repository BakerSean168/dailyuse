import { z } from 'zod';
import type { ExportAccountDataDTO, ImportAccountDataResultDTO } from '../dtos';

export const CloseAccountSchema = z.object({
  reason: z.string().min(1, '请填写注销原因'),
  feedback: z.string().optional(),
});

export type CloseAccountReq = z.infer<typeof CloseAccountSchema>;
export type CloseAccountRes = void;

export type ExportAccountDataReq = void;
export type ExportAccountDataRes = ExportAccountDataDTO;

export const ImportAccountDataSchema = z.object({
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  mergeMode: z.enum(['REPLACE', 'MERGE', 'SKIP']).optional().default('MERGE'),
});

export type ImportAccountDataReq = z.infer<typeof ImportAccountDataSchema>;
export type ImportAccountDataRes = ImportAccountDataResultDTO;
