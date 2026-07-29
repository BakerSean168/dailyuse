/**
 * Setting Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@memoflow/contracts/result';
import { fail, ok } from '@memoflow/contracts/result';
import type { Context } from '@memoflow/contracts/shared';
import {
  PatchUserSettingSchema,
  ResetUserSettingPublicSchema,
  ExportSettingsSchema,
  ImportSettingsSchema,
} from '@memoflow/contracts/setting';
import type { PreferenceCategory } from '@memoflow/contracts/setting';
import { formatZodErrors } from '@memoflow/utils/result';
import type { SettingApplicationPort } from '../application';

export class SettingController {
  constructor(private readonly api: SettingApplicationPort) {}

  async getUserSetting(ctx: Context): Promise<Result<unknown>> {
    return ok(await this.api.getUserSetting(ctx.identityId));
  }

  async patchUserSetting(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = PatchUserSettingSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return ok(
      await this.api.patchUserSetting(
        ctx.identityId,
        parsed.data.category as PreferenceCategory,
        parsed.data.patch,
      ),
    );
  }

  async resetUserSetting(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = ResetUserSettingPublicSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return ok(await this.api.resetUserSetting(ctx.identityId, parsed.data.category));
  }

  async exportSettings(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = ExportSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return ok(await this.api.exportSettings(ctx.identityId));
  }

  async importSettings(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = ImportSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    let importData: Record<string, unknown>;
    try {
      importData = JSON.parse(parsed.data.data) as Record<string, unknown>;
    } catch {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON in data field',
      });
    }

    return ok(
      await this.api.importSettings(ctx.identityId, importData, {
        merge: !parsed.data.overwrite,
      }),
    );
  }

  getDefaultSettings(): Result<unknown> {
    return ok(this.api.getDefaultSettings());
  }
}
