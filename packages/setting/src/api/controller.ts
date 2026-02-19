/**
 * Setting Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  UpdateUserSettingSchema,
  ResetUserSettingSchema,
  ExportSettingsSchema,
  ImportSettingsSchema,
} from '@dailyuse/contracts/setting';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { SettingRouteHandlers } from './routes';

export class SettingController {
  constructor(private readonly handlers: SettingRouteHandlers) {}

  async getUserSetting(identityId: string): Promise<Result<unknown>> {
    const data = await this.handlers.getUserSetting(identityId);
    return ok(data);
  }

  async updateUserSetting(identityId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateUserSettingSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.updateUserSetting(identityId, parsed.data);
    return ok(data);
  }

  async resetUserSetting(identityId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = ResetUserSettingSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.resetUserSetting(identityId);
    return ok(data);
  }

  async exportSettings(identityId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = ExportSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.exportSettings(identityId);
    return ok(data);
  }

  async importSettings(identityId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = ImportSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    let importData: Record<string, any>;
    try {
      importData = JSON.parse(parsed.data.data) as Record<string, any>;
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Invalid JSON in data field' });
    }

    const data = await this.handlers.importSettings(
      identityId,
      importData,
      { merge: !parsed.data.overwrite },
    );
    return ok(data);
  }

  async getDefaultSettings(): Promise<Result<unknown>> {
    const data = this.handlers.getDefaultSettings();
    return ok(data);
  }
}
