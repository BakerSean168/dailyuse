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
  // Template Actions
  enableTemplate(id: string): Promise<Result<unknown>>;
  pauseTemplate(id: string): Promise<Result<unknown>>;
  toggleTemplate(id: string): Promise<Result<unknown>>;
  moveTemplate(id: string, groupId: string): Promise<Result<unknown>>;
  getTemplateHistory(id: string): Promise<Result<unknown>>;
  // Template Responses
  recordResponse(templateId: string, data: { action: string; note?: string }): Promise<Result<unknown>>;
  getTemplateResponses(templateId: string): Promise<Result<unknown>>;
  getResponseStats(templateId: string): Promise<Result<unknown>>;
  // Frequency Analysis
  analyzeFrequency(templateId: string): Promise<Result<unknown>>;
  adjustFrequency(templateId: string, data: { action: string; customInterval?: number }): Promise<Result<unknown>>;
  rejectFrequencyAdjustment(templateId: string): Promise<Result<unknown>>;
  // Group CRUD
  createGroup(data: CreateReminderGroupReq, ctx: Context): Promise<Result<unknown>>;
  listGroups(ctx: Context): Promise<Result<unknown>>;
  getGroup(id: string): Promise<Result<unknown>>;
  updateGroup(id: string, data: UpdateReminderGroupReq): Promise<Result<unknown>>;
  deleteGroup(id: string): Promise<Result<unknown>>;
  switchGroupControlMode(id: string, data: SwitchGroupControlModeReq): Promise<Result<unknown>>;
  batchGroupTemplates(id: string, data: BatchGroupTemplatesReq): Promise<Result<unknown>>;
  toggleGroup(id: string): Promise<Result<unknown>>;
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

  async getTemplate(id: string): Promise<Result<unknown>> {
    return this.useCases.getTemplate(id);
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
    return this.useCases.updateTemplate(id, parsed.data);
  }

  async deleteTemplate(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteTemplate(id);
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

  async getGroup(id: string): Promise<Result<unknown>> {
    return this.useCases.getGroup(id);
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
    return this.useCases.updateGroup(id, parsed.data);
  }

  async deleteGroup(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteGroup(id);
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
    return this.useCases.switchGroupControlMode(id, parsed.data);
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
    return this.useCases.batchGroupTemplates(id, parsed.data);
  }

  // ==================== Template Actions ====================

  async enableTemplate(id: string): Promise<Result<unknown>> {
    return this.useCases.enableTemplate(id);
  }

  async pauseTemplate(id: string): Promise<Result<unknown>> {
    return this.useCases.pauseTemplate(id);
  }

  async toggleTemplate(id: string): Promise<Result<unknown>> {
    return this.useCases.toggleTemplate(id);
  }

  async moveTemplate(id: string, input: unknown): Promise<Result<unknown>> {
    const groupId = (input as any)?.groupId;
    if (!groupId || typeof groupId !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'groupId is required' });
    }
    return this.useCases.moveTemplate(id, groupId);
  }

  async getTemplateHistory(id: string): Promise<Result<unknown>> {
    return this.useCases.getTemplateHistory(id);
  }

  // ==================== Response Operations ====================

  async recordResponse(templateId: string, input: unknown): Promise<Result<unknown>> {
    const action = (input as any)?.action;
    if (!action || typeof action !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'action is required' });
    }
    return this.useCases.recordResponse(templateId, {
      action,
      note: (input as any)?.note,
    });
  }

  async getTemplateResponses(templateId: string): Promise<Result<unknown>> {
    return this.useCases.getTemplateResponses(templateId);
  }

  async getResponseStats(templateId: string): Promise<Result<unknown>> {
    return this.useCases.getResponseStats(templateId);
  }

  // ==================== Frequency Analysis ====================

  async analyzeFrequency(templateId: string): Promise<Result<unknown>> {
    return this.useCases.analyzeFrequency(templateId);
  }

  async adjustFrequency(templateId: string, input: unknown): Promise<Result<unknown>> {
    const action = (input as any)?.action;
    if (!action || typeof action !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'action is required (apply | custom)' });
    }
    return this.useCases.adjustFrequency(templateId, {
      action,
      customInterval: (input as any)?.customInterval,
    });
  }

  async rejectFrequencyAdjustment(templateId: string): Promise<Result<unknown>> {
    return this.useCases.rejectFrequencyAdjustment(templateId);
  }

  // ==================== Group Actions ====================

  async toggleGroup(id: string): Promise<Result<unknown>> {
    return this.useCases.toggleGroup(id);
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
