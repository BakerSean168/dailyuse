/**
 * createReminderModule — explicit composition root for the reminder server runtime.
 * createReminderModule —— 提醒模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Pattern: one composition root per module, constructor injection only,
 * no hidden service locator.
 * 模式：每个模块一个组合根，仅使用构造函数注入，无隐藏的服务定位器。
 */

import type { IReminderTemplateRepository } from '../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../domain-server/repositories/IReminderGroupRepository';
import type { IReminderResponseRepository } from '../domain-server/repositories/IReminderResponseRepository';
import type { IUserReminderPreferenceRepository } from '../domain-server/repositories/IUserReminderPreferenceRepository';
import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import { ok, fail } from '@dailyuse/contracts/result';
import { IdentityId } from '@dailyuse/domain-shared';
import { ReminderTemplate } from '../domain-server/aggregates/reminder-template';
import { ReminderGroup } from '../domain-server/aggregates/reminder-group';
import { ReminderDomainService } from '../domain-server/services/ReminderDomainService';
import { RecordReminderResponse } from '../application-server/use-cases/commands/record-reminder-response';
import { AnalyzeReminderFrequency } from '../application-server/use-cases/queries/analyze-reminder-frequency';
import { AdjustReminderFrequency } from '../application-server/use-cases/commands/adjust-reminder-frequency';
import { UserReminderPreferences } from '../domain-server/aggregates/user-reminder-preferences';

// ---------------------------------------------------------------------------
// Dependencies — everything the reminder runtime needs from the outside world.
// 依赖 —— 提醒模块服务端运行时向外部索取的全部依赖。
// ---------------------------------------------------------------------------

export type ReminderRuntimeContributionsInput =
  | ReminderModuleRuntimeContribution
  | readonly ReminderModuleRuntimeContribution[];

export interface ReminderModuleDependencies {
  readonly reminderTemplateRepository: IReminderTemplateRepository;
  readonly reminderGroupRepository: IReminderGroupRepository;
  readonly reminderResponseRepository: IReminderResponseRepository;
  readonly userReminderPreferenceRepository: IUserReminderPreferenceRepository;
  readonly runtimeContributions?: ReminderRuntimeContributionsInput;
}

// ---------------------------------------------------------------------------
// Runtime contribution — module-owned side effects (cron, event listeners).
// 运行时贡献 —— 模块拥有的副作用（定时任务、事件监听等）。
// ---------------------------------------------------------------------------

export interface ReminderModuleRuntimeContribution {
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Application Port — transport-neutral callable surface.
// 应用层端口 —— 传输层无关的可调用门面。
// ---------------------------------------------------------------------------

export interface ReminderApplicationPort {
  // Template CRUD / 模板 CRUD
  createTemplate(data: Record<string, any>, ctx: Context): Promise<Result<unknown>>;
  listTemplates(ctx: Context): Promise<Result<unknown>>;
  getUpcomingReminders(params: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
  getTemplate(id: string, ctx: Context): Promise<Result<unknown>>;
  updateTemplate(id: string, data: Record<string, any>, ctx: Context): Promise<Result<unknown>>;
  deleteTemplate(id: string, ctx: Context): Promise<Result<unknown>>;

  // Template Actions / 模板操作
  enableTemplate(id: string): Promise<Result<unknown>>;
  pauseTemplate(id: string): Promise<Result<unknown>>;
  toggleTemplate(id: string, ctx: Context): Promise<Result<unknown>>;
  moveTemplate(id: string, groupId: string): Promise<Result<unknown>>;
  getTemplateHistory(id: string): Promise<Result<unknown>>;

  // Response Operations / 响应操作
  recordResponse(
    templateId: string,
    data: { action: string; note?: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getTemplateResponses(templateId: string): Promise<Result<unknown>>;
  getResponseStats(templateId: string): Promise<Result<unknown>>;

  // Frequency Analysis / 频率分析
  analyzeFrequency(templateId: string): Promise<Result<unknown>>;
  adjustFrequency(
    templateId: string,
    data: { action: string; customInterval?: number },
    ctx: Context,
  ): Promise<Result<unknown>>;
  rejectFrequencyAdjustment(templateId: string, ctx: Context): Promise<Result<unknown>>;

  // Group CRUD / 分组 CRUD
  createGroup(data: Record<string, any>, ctx: Context): Promise<Result<unknown>>;
  listGroups(ctx: Context): Promise<Result<unknown>>;
  getGroup(id: string, ctx: Context): Promise<Result<unknown>>;
  updateGroup(id: string, data: Record<string, any>, ctx: Context): Promise<Result<unknown>>;
  deleteGroup(id: string, ctx: Context): Promise<Result<unknown>>;
  switchGroupControlMode(id: string, data: { mode: string }): Promise<Result<unknown>>;
  batchGroupTemplates(groupId: string, data: { action: string }): Promise<Result<unknown>>;
  toggleGroup(id: string): Promise<Result<unknown>>;

  // Preferences / 偏好设置
  getPreferences(ctx: Context): Promise<Result<unknown>>;
  updatePreferences(data: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
}

// ---------------------------------------------------------------------------
// Module instance — primary return type from the composition root.
// 模块实例 —— 组合根的主要返回类型。
// ---------------------------------------------------------------------------

export interface ReminderModuleInstance {
  readonly reminderTemplateRepository: IReminderTemplateRepository;
  readonly reminderGroupRepository: IReminderGroupRepository;
  readonly reminderResponseRepository: IReminderResponseRepository;
  readonly userReminderPreferenceRepository: IUserReminderPreferenceRepository;
  readonly api: ReminderApplicationPort;
  start(): void | Promise<void>;
  dispose(): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRuntimeContributions(
  input?: ReminderRuntimeContributionsInput,
): readonly ReminderModuleRuntimeContribution[] {
  if (!input) return [];
  if (Array.isArray(input)) return Array.from(input);
  return [input as ReminderModuleRuntimeContribution];
}

// ---------------------------------------------------------------------------
// Composition root factory
// 组合根工厂
// ---------------------------------------------------------------------------

/**
 * Canonical composition root for the Reminder module.
 * 提醒模块的规范化组合根。
 *
 * Reading order:
 * 1. Define Dependencies / 定义依赖
 * 2. Define transport-neutral ApplicationPort / 定义传输层无关的应用端口
 * 3. Assemble domain services once / 一次性组装领域服务
 * 4. Wrap them in `api` / 包装成 `api`
 * 5. Let the module instance own `start` / `dispose` / 模块实例拥有生命周期
 */
export function createReminderModule(
  dependencies: ReminderModuleDependencies,
): ReminderModuleInstance {
  const {
    reminderTemplateRepository,
    reminderGroupRepository,
    reminderResponseRepository,
    userReminderPreferenceRepository,
  } = dependencies;

  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  let started = false;

  // Assemble domain & application services once
  // 一次性组装领域和应用服务
  const reminderDomainService = new ReminderDomainService(
    reminderTemplateRepository,
    reminderGroupRepository,
  );
  const recordReminderResponse = new RecordReminderResponse(reminderResponseRepository);
  const analyzeReminderFrequency = new AnalyzeReminderFrequency(
    reminderTemplateRepository,
    reminderResponseRepository,
  );
  const adjustReminderFrequency = new AdjustReminderFrequency(reminderTemplateRepository);

  // ---------------------------------------------------------------------------
  // ApplicationPort — extracted from the old api/module.ts inline handlers.
  // 应用端口 —— 从旧的 api/module.ts 内联处理器中提取。
  // ---------------------------------------------------------------------------

  const api: ReminderApplicationPort = {
    // ==================== Template CRUD / 模板 CRUD ====================

    async createTemplate(data, ctx) {
      const normalizedInput = {
        ...data,
        activeTime: {
          activatedAt: data.activeTime?.startDate,
        },
        activeHours: data.activeHours
          ? {
              enabled: true,
              startHour: data.activeHours.startHour,
              endHour: data.activeHours.endHour,
            }
          : undefined,
        recurrence: data.recurrence
          ? { ...data.recurrence, weekly: data.recurrence.weekly ?? null }
          : undefined,
        notificationConfig: {
          ...data.notificationConfig,
          actions: data.notificationConfig?.actions ?? null,
        },
      };
      const template = ReminderTemplate.create({
        ...normalizedInput,
        identityId: IdentityId.of(ctx.identityId),
      } as Parameters<typeof ReminderTemplate.create>[0]);
      await reminderTemplateRepository.save(template);
      return ok(template.toClientDTO());
    },

    async listTemplates(ctx) {
      const templates = await reminderTemplateRepository.findByIdentityId(ctx.identityId);
      const data = templates.map((t) => t.toClientDTO());
      return ok({
        templates: data,
        total: data.length,
        page: 1,
        pageSize: data.length,
        hasMore: false,
      });
    },

    async getUpcomingReminders(params, ctx) {
      return ok(
        await reminderTemplateRepository.findByNextTriggerBefore(
          params.beforeTime ? new Date(params.beforeTime as string | number).getTime() : Date.now(),
          ctx.identityId,
        ),
      );
    },

    async getTemplate(id, ctx) {
      const template = await reminderTemplateRepository.findById(id);
      if (!template || (template as any).identityId !== ctx.identityId) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      return ok(template);
    },

    async updateTemplate(id, data, ctx) {
      const existing = await reminderTemplateRepository.findById(id);
      if (!existing || (existing as any).identityId !== ctx.identityId) {
        throw new Error('Template not found');
      }
      const normalizedUpdates: Record<string, unknown> = { ...data };
      if (data.activeTime) {
        normalizedUpdates.activeTime = { activatedAt: data.activeTime.startDate };
      }
      if (data.activeHours) {
        normalizedUpdates.activeHours = {
          enabled: true,
          startHour: data.activeHours.startHour,
          endHour: data.activeHours.endHour,
        };
      }
      if (data.recurrence) {
        normalizedUpdates.recurrence = {
          ...data.recurrence,
          weekly: data.recurrence.weekly ?? null,
        };
      }
      if (data.notificationConfig) {
        normalizedUpdates.notificationConfig = {
          ...data.notificationConfig,
          actions: data.notificationConfig.actions ?? null,
        };
      }
      existing.update(normalizedUpdates as any);
      await reminderTemplateRepository.save(existing);
      return ok(existing.toClientDTO());
    },

    async deleteTemplate(id, ctx) {
      const existing = await reminderTemplateRepository.findById(id);
      if (!existing || (existing as any).identityId !== ctx.identityId) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      await reminderTemplateRepository.delete(id);
      return ok(undefined);
    },

    // ==================== Group CRUD / 分组 CRUD ====================

    async createGroup(data, ctx) {
      const group = ReminderGroup.create({
        ...data,
        identityId: ctx.identityId,
      } as Parameters<typeof ReminderGroup.create>[0]);
      await reminderGroupRepository.save(group);
      return ok(group.toClientDTO());
    },

    async listGroups(ctx) {
      const groups = await reminderGroupRepository.findByIdentityId(ctx.identityId);
      const data = groups.map((g) => g.toClientDTO());
      return ok({
        groups: data,
        total: data.length,
        page: 1,
        pageSize: data.length,
        hasMore: false,
      });
    },

    async getGroup(id, ctx) {
      const group = await reminderGroupRepository.findById(id);
      if (!group || (group as any).identityId !== ctx.identityId) {
        return fail({ code: 'NOT_FOUND', message: 'Group not found' });
      }
      return ok(group);
    },

    async updateGroup(id, data, ctx) {
      const existing = await reminderGroupRepository.findById(id);
      if (!existing || (existing as any).identityId !== ctx.identityId) {
        throw new Error('Group not found');
      }
      const updated = ReminderGroup.load({
        id: existing.id,
        identityId: existing.identityId as string,
        name: data.name ?? existing.name,
        description: 'description' in data ? (data.description ?? null) : existing.description,
        controlMode: data.controlMode ?? existing.controlMode,
        enabled: existing.enabled,
        status: existing.status,
        order: data.order ?? existing.order,
        color: 'color' in data ? (data.color ?? null) : existing.color,
        icon: 'icon' in data ? (data.icon ?? null) : existing.icon,
        stats: existing.stats as any,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
        deletedAt: existing.deletedAt?.getTime() ?? null,
        version: existing.version,
      });
      await reminderGroupRepository.save(updated);
      return ok(updated.toClientDTO());
    },

    async deleteGroup(id, ctx) {
      const existing = await reminderGroupRepository.findById(id);
      if (!existing || (existing as any).identityId !== ctx.identityId) {
        return fail({ code: 'NOT_FOUND', message: 'Group not found' });
      }
      await reminderGroupRepository.delete(id);
      return ok(undefined);
    },

    async switchGroupControlMode(id, data) {
      const existing = await reminderGroupRepository.findById(id);
      if (!existing) throw new Error('Group not found');
      if (data.mode === 'Group') {
        existing.switchToGroupControl();
      } else {
        existing.switchToIndividualControl();
      }
      await reminderGroupRepository.save(existing);
      return ok(existing.toClientDTO());
    },

    async batchGroupTemplates(groupId, data) {
      const templates = await reminderTemplateRepository.findByGroupId(groupId);
      let successCount = 0;
      for (const t of templates) {
        if (data.action === 'ENABLE') {
          t.enable();
        } else {
          t.pause();
        }
        await reminderTemplateRepository.save(t);
        successCount++;
      }
      return ok({ successCount, failedCount: 0 });
    },

    // ==================== Template Actions / 模板操作 ====================

    async enableTemplate(id) {
      const template = await reminderTemplateRepository.findById(id);
      if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      template.enable();
      await reminderTemplateRepository.save(template);
      return ok(template.toClientDTO());
    },

    async pauseTemplate(id) {
      const template = await reminderTemplateRepository.findById(id);
      if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      template.pause();
      await reminderTemplateRepository.save(template);
      return ok(template.toClientDTO());
    },

    async toggleTemplate(id, ctx) {
      const template = await reminderTemplateRepository.findById(id);
      if (!template || (template as any).identityId !== ctx.identityId) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      template.toggle();
      await reminderTemplateRepository.save(template);
      return ok(template.toClientDTO());
    },

    async moveTemplate(id, groupId) {
      const result = await reminderDomainService.assignTemplateToGroup(id, groupId);
      return ok(result);
    },

    async getTemplateHistory(id) {
      const template = await reminderTemplateRepository.findById(id, {
        includeHistory: true,
      } as any);
      if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      const history = template.getAllHistory ? template.getAllHistory() : [];
      return ok(history);
    },

    // ==================== Response Operations / 响应操作 ====================

    // Identity propagated from transport context.
    // 身份信息从传输层上下文传递。
    async recordResponse(templateId, data, ctx) {
      const result = await recordReminderResponse.execute({
        templateId,
        action: data.action as any,
        identityId: ctx.identityId,
      });
      return ok(result);
    },

    async getTemplateResponses(templateId) {
      const responses = await recordReminderResponse.getResponsesByTemplate(templateId);
      return ok(responses);
    },

    async getResponseStats(templateId) {
      const stats = await recordReminderResponse.getResponseStats(templateId);
      return ok(stats);
    },

    // ==================== Frequency Analysis / 频率分析 ====================

    async analyzeFrequency(templateId) {
      const result = await analyzeReminderFrequency.execute(templateId);
      return ok(result);
    },

    // Identity propagated from transport context.
    // 身份信息从传输层上下文传递。
    async adjustFrequency(templateId, data, ctx) {
      const result = await adjustReminderFrequency.execute({
        templateId,
        newInterval: data.customInterval ?? 0,
        reason: data.action,
        identityId: ctx.identityId,
      });
      return ok(result);
    },

    async rejectFrequencyAdjustment(templateId, ctx) {
      await adjustReminderFrequency.reject(templateId, ctx.identityId);
      return ok({ success: true });
    },

    // ==================== Group Actions / 分组操作 ====================

    async toggleGroup(id) {
      const result = await reminderDomainService.toggleGroupAndTemplates(id);
      return ok(result);
    },

    // ==================== Preferences / 偏好设置 ====================

    async getPreferences(ctx) {
      const prefs = await userReminderPreferenceRepository.findByIdentityId(ctx.identityId);
      return ok(prefs);
    },

    async updatePreferences(data, ctx) {
      const existing = await userReminderPreferenceRepository.findByIdentityId(ctx.identityId);
      if (!existing) {
        const prefs = UserReminderPreferences.create({ identityId: ctx.identityId });
        if (data.bestTimeSlots || data.worstTimeSlots) {
          prefs.updateTimeSlots(
            (data.bestTimeSlots as any) ?? [],
            (data.worstTimeSlots as any) ?? [],
          );
        }
        if (data.globalSmartFrequencyEnabled !== undefined) {
          prefs.toggleGlobalSmartFrequency(!!data.globalSmartFrequencyEnabled);
        }
        await userReminderPreferenceRepository.save(prefs);
        return ok(prefs.toClientDTO());
      }
      if (data.bestTimeSlots || data.worstTimeSlots) {
        existing.updateTimeSlots(
          (data.bestTimeSlots as any) ?? [],
          (data.worstTimeSlots as any) ?? [],
        );
      }
      if (data.globalSmartFrequencyEnabled !== undefined) {
        existing.toggleGlobalSmartFrequency(!!data.globalSmartFrequencyEnabled);
      }
      await userReminderPreferenceRepository.save(existing);
      return ok(existing.toClientDTO());
    },
  };

  // ---------------------------------------------------------------------------
  // Module instance with lifecycle management
  // 带生命周期管理的模块实例
  // ---------------------------------------------------------------------------

  return {
    reminderTemplateRepository,
    reminderGroupRepository,
    reminderResponseRepository,
    userReminderPreferenceRepository,
    api,

    async start() {
      if (started) return;
      for (const runtime of runtimeContributions) {
        await runtime.start();
      }
      started = true;
    },

    async dispose() {
      if (!started) return;
      for (const runtime of [...runtimeContributions].reverse()) {
        await runtime.stop();
      }
      started = false;
    },
  };
}
