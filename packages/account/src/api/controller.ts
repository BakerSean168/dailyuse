/**
 * Account Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  UpdateAccountSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
} from '@dailyuse/contracts/account';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { AccountRouteHandlers } from './routes';

export class AccountController {
  constructor(private readonly handlers: AccountRouteHandlers) {}

  async getProfile(accountId: string): Promise<Result<unknown>> {
    const data = await this.handlers.getProfile(accountId);
    return ok(data);
  }

  async updateProfile(accountId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateAccountSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.updateProfile(accountId, parsed.data);
    return ok(data);
  }

  async checkAvailability(input: unknown): Promise<Result<unknown>> {
    const parsed = CheckAvailabilitySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.checkAvailability(parsed.data);
    return ok(data);
  }

  async closeAccount(accountId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = CloseAccountSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    await this.handlers.closeAccount(accountId, parsed.data);
    return ok(null);
  }
}
