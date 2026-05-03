/**
 * Account Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  UpdateAccountSchema,
  UpdateAccountSettingsSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
} from '@dailyuse/contracts/account';
import type {
  GetAccountRes,
  UpdateAccountReq,
  UpdateAccountRes,
  UpdateAccountSettingsReq,
  UpdateAccountSettingsRes,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  CloseAccountRes,
} from '@dailyuse/contracts/account';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface AccountUseCases {
  getProfile(cx: ExecutionContext): Promise<Result<GetAccountRes>>;
  updateProfile(data: UpdateAccountReq, cx: ExecutionContext): Promise<Result<UpdateAccountRes>>;
  updateSettings(
    data: UpdateAccountSettingsReq,
    cx: ExecutionContext,
  ): Promise<Result<UpdateAccountSettingsRes>>;
  checkAvailability(data: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>>;
  closeAccount(data: CloseAccountReq, cx: ExecutionContext): Promise<Result<CloseAccountRes>>;
}

export class AccountController {
  constructor(private readonly useCases: AccountUseCases) {}

  async getProfile(cx: ExecutionContext): Promise<Result<GetAccountRes>> {
    return this.useCases.getProfile(cx);
  }

  async updateProfile(input: unknown, cx: ExecutionContext): Promise<Result<UpdateAccountRes>> {
    const parsed = UpdateAccountSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateProfile(parsed.data, cx);
  }

  async checkAvailability(input: unknown): Promise<Result<CheckAvailabilityRes>> {
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

  async updateSettings(input: unknown, cx: ExecutionContext): Promise<Result<UpdateAccountSettingsRes>> {
    const parsed = UpdateAccountSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateSettings(parsed.data, cx);
  }

  async closeAccount(input: unknown, cx: ExecutionContext): Promise<Result<CloseAccountRes>> {
    const parsed = CloseAccountSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.closeAccount(parsed.data, cx);
  }
}
