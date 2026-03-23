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
  ReminderTemplateListRes,
  ReminderGroupListRes,
} from '@dailyuse/contracts/reminder';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface ReminderUseCases {
  // Template CRUD
  createTemplate(data: CreateReminderTemplateReq, ctx: Context): Promise<Result<unknown>>;
  listTemplates(ctx: Context): Promise<Result<ReminderTemplateListRes>>;
  getUpcomingReminders(params: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
  getTemplate(id: string, ctx: Context): Promise<Result<unknown>>;
  updateTemplate(
    id: string,
    data: UpdateReminderTemplateReq,
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteTemplate(id: string, ctx: Context): Promise<Result<unknown>>;
  // Template Actions
  enableTemplate(id: string, ctx: Context): Promise<Result<unknown>>;
  pauseTemplate(id: string, ctx: Context): Promise<Result<unknown>>;
  toggleTemplate(id: string, ctx: Context): Promise<Result<unknown>>;
  moveTemplate(id: string, groupId: string | null, ctx: Context): Promise<Result<unknown>>;
  getTemplateHistory(id: string, ctx: Context): Promise<Result<unknown>>;
  // Template Responses
  recordResponse(
    templateId: string,
    data: { action: string; note?: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getTemplateResponses(templateId: string, ctx: Context): Promise<Result<unknown>>;
  getResponseStats(templateId: string, ctx: Context): Promise<Result<unknown>>;
  // Frequency Analysis
  analyzeFrequency(templateId: string, ctx: Context): Promise<Result<unknown>>;
  adjustFrequency(
    templateId: string,
    data: { action: string; customInterval?: number },
    ctx: Context,
  ): Promise<Result<unknown>>;
  rejectFrequencyAdjustment(templateId: string, ctx: Context): Promise<Result<unknown>>;
  // Group CRUD
  createGroup(data: CreateReminderGroupReq, ctx: Context): Promise<Result<unknown>>;
  listGroups(ctx: Context): Promise<Result<ReminderGroupListRes>>;
  getGroup(id: string, ctx: Context): Promise<Result<unknown>>;
  updateGroup(id: string, data: UpdateReminderGroupReq, ctx: Context): Promise<Result<unknown>>;
  deleteGroup(id: string, ctx: Context): Promise<Result<unknown>>;
  switchGroupControlMode(
    id: string,
    data: SwitchGroupControlModeReq,
    ctx: Context,
  ): Promise<Result<unknown>>;
  batchGroupTemplates(
    id: string,
    data: BatchGroupTemplatesReq,
    ctx: Context,
  ): Promise<Result<unknown>>;
  toggleGroup(id: string, ctx: Context): Promise<Result<unknown>>;
  // Preferences
  getPreferences(ctx: Context): Promise<Result<unknown>>;
  updatePreferences(data: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
}

export class ReminderController {
  constructor(private readonly useCases: ReminderUseCases) {}

  // ==================== Template Operations ====================

  async createTemplate(input: unknown, ctx: Context): Promise<Result<unknown>> {
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

  async getUpcomingReminders(
    query: Record<string, unknown>,
    ctx: Context,
  ): Promise<Result<unknown>> {
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

  async getTemplate(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getTemplate(id, ctx);
  }

  async updateTemplate(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateReminderTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateTemplate(id, parsed.data, ctx);
  }

  async deleteTemplate(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.deleteTemplate(id, ctx);
  }

  // ==================== Group Operations ====================

  async createGroup(input: unknown, ctx: Context): Promise<Result<unknown>> {
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

  async getGroup(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getGroup(id, ctx);
  }

  async updateGroup(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateReminderGroupSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateGroup(id, parsed.data, ctx);
  }

  async deleteGroup(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.deleteGroup(id, ctx);
  }

  async switchGroupControlMode(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = SwitchGroupControlModeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.switchGroupControlMode(id, parsed.data, ctx);
  }

  async batchGroupTemplates(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = BatchGroupTemplatesSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.batchGroupTemplates(id, parsed.data, ctx);
  }

  // ==================== Template Actions ====================

  async enableTemplate(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.enableTemplate(id, ctx);
  }

  async pauseTemplate(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.pauseTemplate(id, ctx);
  }

  async toggleTemplate(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.toggleTemplate(id, ctx);
  }

  async moveTemplate(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const rawGroupId = (input as any)?.groupId;
    if (rawGroupId !== null && rawGroupId !== undefined && typeof rawGroupId !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'groupId must be a string or null' });
    }
    return this.useCases.moveTemplate(id, rawGroupId ?? null, ctx);
  }

  async getTemplateHistory(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getTemplateHistory(id, ctx);
  }

  // ==================== Response Operations ====================

  async recordResponse(templateId: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const action = (input as any)?.action;
    if (!action || typeof action !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'action is required' });
    }
    return this.useCases.recordResponse(
      templateId,
      {
        action,
        note: (input as any)?.note,
      },
      ctx,
    );
  }

  async getTemplateResponses(templateId: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getTemplateResponses(templateId, ctx);
  }

  async getResponseStats(templateId: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getResponseStats(templateId, ctx);
  }

  // ==================== Frequency Analysis ====================

  async analyzeFrequency(templateId: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.analyzeFrequency(templateId, ctx);
  }

  async adjustFrequency(
    templateId: string,
    input: unknown,
    ctx: Context,
  ): Promise<Result<unknown>> {
    const action = (input as any)?.action;
    if (!action || typeof action !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'action is required (apply | custom)' });
    }
    return this.useCases.adjustFrequency(
      templateId,
      {
        action,
        customInterval: (input as any)?.customInterval,
      },
      ctx,
    );
  }

  async rejectFrequencyAdjustment(templateId: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.rejectFrequencyAdjustment(templateId, ctx);
  }

  // ==================== Group Actions ====================

  async toggleGroup(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.toggleGroup(id, ctx);
  }

  // ==================== Preferences ====================

  async getPreferences(ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getPreferences(ctx);
  }

  async updatePreferences(input: unknown, ctx: Context): Promise<Result<unknown>> {
    if (!input || typeof input !== 'object') {
      return fail({ code: 'VALIDATION_ERROR', message: 'request body is required' });
    }
    return this.useCases.updatePreferences(input as Record<string, unknown>, ctx);
  }
}
