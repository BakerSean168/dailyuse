/**
 * Reminder Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Each method:
 * 1. Validates input via Zod schema (where applicable)
 * 2. Delegates to the corresponding handler
 * 3. Returns a Result<T> (transport-agnostic)
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  CreateReminderTemplateSchema,
  UpdateReminderTemplateSchema,
  GetUpcomingRemindersSchema,
  CreateReminderGroupSchema,
  UpdateReminderGroupSchema,
  SwitchGroupControlModeSchema,
  BatchGroupTemplatesSchema,
} from '@dailyuse/contracts/reminder';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { ReminderRouteHandlers } from './routes';

/**
 * Reminder Controller
 *
 * Provides validated handler calls for the Reminder module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class ReminderController {
  constructor(private readonly handlers: ReminderRouteHandlers) {}

  // ==================== Template Operations ====================

  async createTemplate(input: unknown, identityId: string): Promise<Result<unknown>> {
    const parsed = CreateReminderTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.createTemplate(identityId, parsed.data);
    return ok(data);
  }

  async listTemplates(identityId: string): Promise<Result<unknown>> {
    const data = await this.handlers.listTemplates(identityId);
    return ok(data);
  }

  async getUpcomingReminders(identityId: string, query: Record<string, unknown>): Promise<Result<unknown>> {
    const parsed = GetUpcomingRemindersSchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.getUpcomingReminders(identityId, parsed.data);
    return ok(data);
  }

  async getTemplate(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getTemplate(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Template not found' });
    }
    return ok(data);
  }

  async updateTemplate(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateReminderTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.updateTemplate(id, parsed.data);
    return ok(data);
  }

  async deleteTemplate(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteTemplate(id);
    return ok(null);
  }

  // ==================== Group Operations ====================

  async createGroup(input: unknown, identityId: string): Promise<Result<unknown>> {
    const parsed = CreateReminderGroupSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.createGroup(identityId, parsed.data);
    return ok(data);
  }

  async listGroups(identityId: string): Promise<Result<unknown>> {
    const data = await this.handlers.listGroups(identityId);
    return ok(data);
  }

  async getGroup(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getGroup(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Group not found' });
    }
    return ok(data);
  }

  async updateGroup(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateReminderGroupSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.updateGroup(id, parsed.data);
    return ok(data);
  }

  async deleteGroup(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteGroup(id);
    return ok(null);
  }

  async switchGroupControlMode(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = SwitchGroupControlModeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.switchGroupControlMode(id, parsed.data);
    return ok(data);
  }

  async batchGroupTemplates(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = BatchGroupTemplatesSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.batchGroupTemplates(id, parsed.data);
    return ok(data);
  }
}
