/**
 * Data Portability Controller
 *
 * Zod validation and use case orchestration.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  ExportUserDataReqSchema,
  ImportUserDataReqSchema,
  type ExportUserDataRes,
  type ImportUserDataRes,
} from '@dailyuse/contracts/data-portability';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { DataPortabilityApplicationPort } from '../application';

export class DataPortabilityController {
  constructor(private readonly api: DataPortabilityApplicationPort) {}

  async exportUserData(input: unknown, ctx: Context): Promise<Result<ExportUserDataRes>> {
    const parsed = ExportUserDataReqSchema.safeParse(input);
    if (!parsed.success) {
      return fail({ code: 'VALIDATION_ERROR', message: '参数验证失败', details: formatZodErrors(parsed.error.issues) });
    }
    return ok(await this.api.exportUserData(ctx.identityId, parsed.data));
  }

  async importUserData(input: unknown, ctx: Context): Promise<Result<ImportUserDataRes>> {
    const parsed = ImportUserDataReqSchema.safeParse(input);
    if (!parsed.success) {
      return fail({ code: 'VALIDATION_ERROR', message: '参数验证失败', details: formatZodErrors(parsed.error.issues) });
    }
    return ok(await this.api.importUserData(ctx.identityId, parsed.data));
  }
}
