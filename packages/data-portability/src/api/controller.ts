/**
 * Data Portability Controller
 *
 * Zod validation and use case orchestration.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import { ExportUserDataReqSchema, ImportUserDataReqSchema } from '../contracts/portable-schema';
import type { ExportUserDataReq, ImportUserDataReq } from '../contracts/portable-schema';
import { formatZodErrors } from '@dailyuse/utils/result';

export interface DataPortabilityUseCases {
  exportUserData(data: ExportUserDataReq, ctx: Context): Promise<Result<unknown>>;
  importUserData(data: ImportUserDataReq, ctx: Context): Promise<Result<unknown>>;
}

export class DataPortabilityController {
  constructor(private readonly useCases: DataPortabilityUseCases) {}

  async exportUserData(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = ExportUserDataReqSchema.safeParse(input);
    if (!parsed.success) {
      return fail({ code: 'VALIDATION_ERROR', message: '参数验证失败', details: formatZodErrors(parsed.error.issues) });
    }
    return this.useCases.exportUserData(parsed.data, ctx);
  }

  async importUserData(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = ImportUserDataReqSchema.safeParse(input);
    if (!parsed.success) {
      return fail({ code: 'VALIDATION_ERROR', message: '参数验证失败', details: formatZodErrors(parsed.error.issues) });
    }
    return this.useCases.importUserData(parsed.data, ctx);
  }
}
