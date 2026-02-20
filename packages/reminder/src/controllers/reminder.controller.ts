/**
 * Reminder Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CreateReminderTemplateSchema,
  UpdateReminderTemplateSchema,
  GetUpcomingRemindersSchema,
  CreateReminderGroupSchema,
  UpdateReminderGroupSchema,
  SwitchGroupControlModeSchema,
  BatchGroupTemplatesSchema,
} from '@dailyuse/contracts/reminder';
import type {
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
  SwitchGroupControlModeReq,
  BatchGroupTemplatesReq,
} from '@dailyuse/contracts/reminder';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface ReminderUseCases {
  // Template CRUD
  createTemplate(data: CreateReminderTemplateReq, ctx: Context): Promise<Result<unknown>>;
  listTemplates(ctx: Context): Promise<Result<unknown>>;
  getUpcomingReminders(params: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
  getTemplate(id: string): Promise<Result<unknown>>;
  updateTemplate(id: string, data: UpdateReminderTemplateReq): Promise<Result<unknown>>;
  deleteTemplate(id: string): Promise<Result<unknown>>;
  // Group CRUD
  createGroup(data: CreateReminderGroupReq, ctx: Context): Promise<Result<unknown>>;
  listGroups(ctx: Context): Promise<Result<unknown>>;
  getGroup(id: string): Promise<Result<unknown>>;
  updateGroup(id: string, data: UpdateReminderGroupReq): Promise<Result<unknown>>;
  deleteGroup(id: string): Promise<Result<unknown>>;
  switchGroupControlMode(id: string, data: SwitchGroupControlModeReq): Promise<Result<unknown>>;
  batchGroupTemplates(id: string, data: BatchGroupTemplatesReq): Promise<Result<unknown>>;
}

export class ReminderController {
  constructor(private readonly useCases: ReminderUseCases) {}

  // ==================== Template Operations ====================

  async createTemplate(input: CreateReminderTemplateReq, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateReminderTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createTemplate(parsed.data, ctx);
  }

  async listTemplates(ctx: Context): Promise<Result<unknown>> {
    return this.useCases.listTemplates(ctx);
  }

  async getUpcomingReminders(query: Record<string, unknown>, ctx: Context): Promise<Result<unknown>> {
    const parsed = GetUpcomingRemindersSchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.getUpcomingReminders(parsed.data, ctx);
  }

  async getTemplate(id: string): Promise<Result<unknown>> {
    return this.useCases.getTemplate(id);
  }

  async updateTemplate(id: string, input: UpdateReminderTemplateReq): Promise<Result<unknown>> {
    const parsed = UpdateReminderTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateTemplate(id, parsed.data);
  }

  async deleteTemplate(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteTemplate(id);
  }

  // ==================== Group Operations ====================

  async createGroup(input: CreateReminderGroupReq, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateReminderGroupSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createGroup(parsed.data, ctx);
  }

  async listGroups(ctx: Context): Promise<Result<unknown>> {
    return this.useCases.listGroups(ctx);
  }

  async getGroup(id: string): Promise<Result<unknown>> {
    return this.useCases.getGroup(id);
  }

  async updateGroup(id: string, input: UpdateReminderGroupReq): Promise<Result<unknown>> {
    const parsed = UpdateReminderGroupSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateGroup(id, parsed.data);
  }

  async deleteGroup(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteGroup(id);
  }

  async switchGroupControlMode(id: string, input: SwitchGroupControlModeReq): Promise<Result<unknown>> {
    const parsed = SwitchGroupControlModeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.switchGroupControlMode(id, parsed.data);
  }

  async batchGroupTemplates(id: string, input: BatchGroupTemplatesReq): Promise<Result<unknown>> {
    const parsed = BatchGroupTemplatesSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.batchGroupTemplates(id, parsed.data);
  }
}
