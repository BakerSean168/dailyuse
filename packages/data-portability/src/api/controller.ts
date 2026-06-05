/**
 * Data Portability Controller
 *
 * Zod validation and use case orchestration.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  ExportUserDataReqSchema,
  ImportUserDataReqSchema,
  type ExportUserDataReq,
  type ImportUserDataReq,
  type ExportUserDataRes,
  type ImportUserDataRes,
} from '@dailyuse/contracts/data-portability';
import { formatZodErrors } from '@dailyuse/utils/result';

export interface DataPortabilityUseCases {
  exportUserData(data: ExportUserDataReq, ctx: Context): Promise<Result<ExportUserDataRes>>;
  importUserData(data: ImportUserDataReq, ctx: Context): Promise<Result<ImportUserDataRes>>;
}

export class DataPortabilityController {
  constructor(private readonly useCases: DataPortabilityUseCases) {}

  async exportUserData(input: unknown, ctx: Context): Promise<Result<ExportUserDataRes>> {
    const parsed = ExportUserDataReqSchema.safeParse(input);
    if (!parsed.success) {
      return fail({ code: 'VALIDATION_ERROR', message: '参数验证失败', details: formatZodErrors(parsed.error.issues) });
    }
    return this.useCases.exportUserData(parsed.data, ctx);
  }

  async importUserData(input: unknown, ctx: Context): Promise<Result<ImportUserDataRes>> {
    const parsed = ImportUserDataReqSchema.safeParse(input);
    if (!parsed.success) {
      return fail({ code: 'VALIDATION_ERROR', message: '参数验证失败', details: formatZodErrors(parsed.error.issues) });
    }
    return this.useCases.importUserData(parsed.data, ctx);
  }
}
