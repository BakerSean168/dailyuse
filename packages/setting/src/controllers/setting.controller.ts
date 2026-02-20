/**
 * Setting Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  UpdateUserSettingSchema,
  ResetUserSettingSchema,
  ExportSettingsSchema,
  ImportSettingsSchema,
} from '@dailyuse/contracts/setting';
import type {
  UpdateUserSettingReq,
  ResetUserSettingReq,
  ExportSettingsReq,
  ImportSettingsReq,
} from '@dailyuse/contracts/setting';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface SettingUseCases {
  getUserSetting(ctx: Context): Promise<Result<unknown>>;
  updateUserSetting(data: UpdateUserSettingReq, ctx: Context): Promise<Result<unknown>>;
  resetUserSetting(ctx: Context): Promise<Result<unknown>>;
  exportSettings(ctx: Context): Promise<Result<unknown>>;
  importSettings(data: ImportSettingsReq, ctx: Context): Promise<Result<unknown>>;
  getDefaultSettings(): Result<unknown>;
}

export class SettingController {
  constructor(private readonly useCases: SettingUseCases) {}

  async getUserSetting(ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getUserSetting(ctx);
  }

  async updateUserSetting(input: UpdateUserSettingReq, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateUserSettingSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateUserSetting(parsed.data, ctx);
  }

  async resetUserSetting(input: ResetUserSettingReq, ctx: Context): Promise<Result<unknown>> {
    const parsed = ResetUserSettingSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.resetUserSetting(ctx);
  }

  async exportSettings(input: ExportSettingsReq, ctx: Context): Promise<Result<unknown>> {
    const parsed = ExportSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.exportSettings(ctx);
  }

  async importSettings(input: ImportSettingsReq, ctx: Context): Promise<Result<unknown>> {
    const parsed = ImportSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.importSettings(parsed.data, ctx);
  }

  getDefaultSettings(): Result<unknown> {
    return this.useCases.getDefaultSettings();
  }
}
