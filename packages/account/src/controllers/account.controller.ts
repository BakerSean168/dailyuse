/**
 * Account Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  UpdateAccountSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
} from '@dailyuse/contracts/account';
import type {
  GetAccountRes,
  UpdateAccountReq,
  UpdateAccountRes,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  CloseAccountRes,
} from '@dailyuse/contracts/account';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface AccountUseCases {
  getProfile(ctx: Context): Promise<Result<GetAccountRes>>;
  updateProfile(data: UpdateAccountReq, ctx: Context): Promise<Result<UpdateAccountRes>>;
  checkAvailability(data: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>>;
  closeAccount(data: CloseAccountReq, ctx: Context): Promise<Result<CloseAccountRes>>;
}

export class AccountController {
  constructor(private readonly useCases: AccountUseCases) {}

  async getProfile(ctx: Context): Promise<Result<GetAccountRes>> {
    return this.useCases.getProfile(ctx);
  }

  async updateProfile(input: UpdateAccountReq, ctx: Context): Promise<Result<UpdateAccountRes>> {
    const parsed = UpdateAccountSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateProfile(parsed.data, ctx);
  }

  async checkAvailability(input: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    const parsed = CheckAvailabilitySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.checkAvailability(parsed.data);
  }

  async closeAccount(input: CloseAccountReq, ctx: Context): Promise<Result<CloseAccountRes>> {
    const parsed = CloseAccountSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.closeAccount(parsed.data, ctx);
  }
}
