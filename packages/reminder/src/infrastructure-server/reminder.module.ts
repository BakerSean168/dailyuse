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

import type { IReminderTemplateRepository } from '../domain-server/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '../domain-server/repositories/i-reminder-group-repository';
import type { IReminderResponseRepository } from '../domain-server/repositories/i-reminder-response-repository';
import type { IUserReminderPreferenceRepository } from '../domain-server/repositories/i-user-reminder-preference-repository';
import type { Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { ok, fail } from '@dailyuse/contracts/result';
import { ReminderTemplate } from '../domain-server/aggregates/reminder-template';
import { ReminderGroup } from '../domain-server/aggregates/reminder-group';
import { GroupStats } from '../domain-shared/value-objects/group-stats';
import { ReminderDomainService } from '../domain-server/services/reminder-domain-service';
import { UpcomingReminderCalculationService } from '../domain-server/services/upcoming-reminder-calculation-service';
import { ReminderTemplateClientMapper } from '../application-server/mappers/reminder-template-client.mapper';
import { CreateReminderTemplateUseCase } from '../application-server/use-cases/commands/create-reminder-template.use-case';
import { UpdateReminderTemplateUseCase } from '../application-server/use-cases/commands/update-reminder-template.use-case';
import { DeleteReminderTemplateUseCase } from '../application-server/use-cases/commands/delete-reminder-template.use-case';
import { RecordReminderResponseUseCase } from '../application-server/use-cases/commands/record-reminder-response.use-case';
import { GetReminderTemplateUseCase } from '../application-server/use-cases/queries/get-reminder-template.use-case';
import { ListReminderTemplatesUseCase } from '../application-server/use-cases/queries/list-reminder-templates.use-case';
import { AnalyzeReminderFrequencyUseCase } from '../application-server/use-cases/queries/analyze-reminder-frequency.use-case';
import { AdjustReminderFrequencyUseCase } from '../application-server/use-cases/commands/adjust-reminder-frequency.use-case';
import { UserReminderPreferences } from '../domain-server/aggregates/user-reminder-preferences';
import type {
  ReminderTemplateClientDTO,
  ReminderTemplateListRes,
  ReminderGroupListRes,
  CreateReminderTemplateReq,
  CreateReminderTemplateRes,
  GetUpcomingRemindersReq,
  GetUpcomingRemindersRes,
  GetReminderTodayScheduleReq,
  GetReminderTodayScheduleRes,
  UpdateReminderTemplateReq,
  UpdateReminderTemplateRes,
  TimeSlotDTO,
  GroupStatsDTO,
  ControlMode,
} from '@dailyuse/contracts/reminder';
import type { ReminderResponseAction } from '@dailyuse/contracts/reminder';

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
  createTemplate(data: CreateReminderTemplateReq, ctx: ExecutionContext): Promise<Result<CreateReminderTemplateRes>>;
  listTemplates(ctx: ExecutionContext): Promise<Result<ReminderTemplateListRes>>;
  getUpcomingReminders(
    params: GetUpcomingRemindersReq,
    ctx: ExecutionContext,
  ): Promise<Result<GetUpcomingRemindersRes>>;
  getTodaySchedule(
    params: GetReminderTodayScheduleReq,
    ctx: ExecutionContext,
  ): Promise<Result<GetReminderTodayScheduleRes>>;
  getTemplate(id: string, ctx: ExecutionContext): Promise<Result<ReminderTemplateClientDTO>>;
  updateTemplate(
    id: string,
    data: UpdateReminderTemplateReq,
    ctx: ExecutionContext,
  ): Promise<Result<UpdateReminderTemplateRes>>;
  deleteTemplate(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;

  // Template Actions / 模板操作
  enableTemplate(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  pauseTemplate(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  toggleTemplate(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  moveTemplate(id: string, groupId: string | null, ctx: ExecutionContext): Promise<Result<unknown>>;
  getTemplateHistory(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;

  // Response Operations / 响应操作
  recordResponse(
    templateId: string,
    data: { action: string; note?: string },
    ctx: ExecutionContext,
  ): Promise<Result<unknown>>;
  getTemplateResponses(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  getResponseStats(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;

  // Frequency Analysis / 频率分析
  analyzeFrequency(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  adjustFrequency(
    templateId: string,
    data: { action: string; customInterval?: number },
    ctx: ExecutionContext,
  ): Promise<Result<unknown>>;
  rejectFrequencyAdjustment(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;

  // Group CRUD / 分组 CRUD
  createGroup(data: Record<string, unknown>, ctx: ExecutionContext): Promise<Result<unknown>>;
  listGroups(ctx: ExecutionContext): Promise<Result<ReminderGroupListRes>>;
  getGroup(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  updateGroup(id: string, data: Record<string, unknown>, ctx: ExecutionContext): Promise<Result<unknown>>;
  deleteGroup(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  switchGroupControlMode(
    id: string,
    data: { mode: string },
    ctx: ExecutionContext,
  ): Promise<Result<unknown>>;
  batchGroupTemplates(
    groupId: string,
    data: { action: string },
    ctx: ExecutionContext,
  ): Promise<Result<unknown>>;
  toggleGroup(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;

  // Preferences / 偏好设置
  getPreferences(ctx: ExecutionContext): Promise<Result<unknown>>;
  updatePreferences(data: Record<string, unknown>, ctx: ExecutionContext): Promise<Result<unknown>>;
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
  readonly useCases: ReminderModuleUseCases;
  readonly api: ReminderApplicationPort;
  start(): void | Promise<void>;
  dispose(): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

export interface ReminderModuleUseCases {
  readonly createReminderTemplate: CreateReminderTemplateUseCase;
  readonly listReminderTemplates: ListReminderTemplatesUseCase;
  readonly getReminderTemplate: GetReminderTemplateUseCase;
  readonly updateReminderTemplate: UpdateReminderTemplateUseCase;
  readonly deleteReminderTemplate: DeleteReminderTemplateUseCase;
  readonly recordReminderResponse: RecordReminderResponseUseCase;
  readonly analyzeReminderFrequency: AnalyzeReminderFrequencyUseCase;
  readonly adjustReminderFrequency: AdjustReminderFrequencyUseCase;
}

export function createReminderUseCases(
  dependencies: ReminderModuleDependencies,
  options?: {
    reminderDomainService?: ReminderDomainService;
    templateMapper?: ReminderTemplateClientMapper;
  },
): ReminderModuleUseCases {
  const {
    reminderTemplateRepository,
    reminderGroupRepository,
    reminderResponseRepository,
  } = dependencies;

  const reminderDomainService =
    options?.reminderDomainService ??
    new ReminderDomainService(
      reminderTemplateRepository,
      reminderGroupRepository,
      dependencies.userReminderPreferenceRepository,
    );
  const templateMapper =
    options?.templateMapper ??
    new ReminderTemplateClientMapper(reminderDomainService, reminderGroupRepository);

  return {
    createReminderTemplate: new CreateReminderTemplateUseCase(
      reminderTemplateRepository,
      reminderGroupRepository,
      reminderDomainService,
      templateMapper,
    ),
    listReminderTemplates: new ListReminderTemplatesUseCase(
      reminderTemplateRepository,
      reminderGroupRepository,
      templateMapper,
    ),
    getReminderTemplate: new GetReminderTemplateUseCase(
      reminderTemplateRepository,
      reminderGroupRepository,
      templateMapper,
    ),
    updateReminderTemplate: new UpdateReminderTemplateUseCase(
      reminderTemplateRepository,
      reminderGroupRepository,
      reminderDomainService,
      templateMapper,
    ),
    deleteReminderTemplate: new DeleteReminderTemplateUseCase(
      reminderTemplateRepository,
      reminderDomainService,
    ),
    recordReminderResponse: new RecordReminderResponseUseCase(reminderResponseRepository),
    analyzeReminderFrequency: new AnalyzeReminderFrequencyUseCase(
      reminderTemplateRepository,
      reminderResponseRepository,
    ),
    adjustReminderFrequency: new AdjustReminderFrequencyUseCase(reminderTemplateRepository),
  };
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

async function getOwnedTemplateOrFail(
  reminderTemplateRepository: IReminderTemplateRepository,
  templateId: string,
  ctx: ExecutionContext,
  options?: Parameters<IReminderTemplateRepository['findById']>[1],
): Promise<ReminderTemplate | null> {
  const template = await reminderTemplateRepository.findById(templateId, options);
  if (!template || String((template as { identityId?: unknown }).identityId) !== ctx.identityId) {
    return null;
  }

  return template;
}

async function getOwnedGroupOrFail(
  reminderGroupRepository: IReminderGroupRepository,
  groupId: string,
  ctx: ExecutionContext,
): Promise<ReminderGroup | null> {
  const group = await reminderGroupRepository.findById(groupId);
  if (!group || String((group as { identityId?: unknown }).identityId) !== ctx.identityId) {
    return null;
  }

  return group;
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
    userReminderPreferenceRepository,
  );
  const templateMapper = new ReminderTemplateClientMapper(
    reminderDomainService,
    reminderGroupRepository,
  );
  const useCases = createReminderUseCases(dependencies, {
    reminderDomainService,
    templateMapper,
  });

  // ---------------------------------------------------------------------------
  // ApplicationPort — extracted from the old api/module.ts inline handlers.
  // 应用端口 —— 从旧的 api/module.ts 内联处理器中提取。
  // ---------------------------------------------------------------------------

  const api: ReminderApplicationPort = {
    // ==================== Template CRUD / 模板 CRUD ====================

    async createTemplate(data, ctx) {
      return useCases.createReminderTemplate.execute(data, ctx);
    },

    async listTemplates(ctx) {
      return useCases.listReminderTemplates.execute(undefined, ctx);
    },

    async getUpcomingReminders(params, ctx) {
      const templates = await reminderTemplateRepository.findByIdentityId(ctx.identityId, {
        includeDeleted: false,
      });
      const filteredTemplates = templates
        .map((template) => template.toServerDTO())
        .filter((template) =>
          params.type ? template.type === params.type : true,
        )
        .filter((template) =>
          params.importanceLevel ? template.importanceLevel === params.importanceLevel : true,
        );

      const upcoming = UpcomingReminderCalculationService.calculateUpcomingReminders(
        filteredTemplates,
        {
          days: params.days,
          limit: Number.MAX_SAFE_INTEGER,
        },
      );
      const limited = typeof params.limit === 'number' ? upcoming.slice(0, params.limit) : upcoming;

      return ok({
        data: limited,
        total: upcoming.length,
      });
    },

    async getTodaySchedule(params, ctx) {
      const templates = await reminderTemplateRepository.findByIdentityId(ctx.identityId, {
        includeDeleted: false,
      });
      const schedule = UpcomingReminderCalculationService.calculateTodaySchedule(
        templates.map((template) => template.toServerDTO()),
        {
          includeExpired: Boolean(params.includeExpired),
        },
      );
      const limited = typeof params.limit === 'number' ? schedule.slice(0, params.limit) : schedule;

      return ok({
        data: limited,
        total: schedule.length,
      });
    },

    async getTemplate(id, ctx) {
      return useCases.getReminderTemplate.execute(id, ctx);
    },

    async updateTemplate(id, data, ctx) {
      return useCases.updateReminderTemplate.execute(id, data, ctx);
    },

    async deleteTemplate(id, ctx) {
      return useCases.deleteReminderTemplate.execute(id, ctx);
    },

    // ==================== Group CRUD / 分组 CRUD ====================

    async createGroup(data, ctx) {
      const group = await reminderDomainService.createReminderGroup({
        ...data,
        identityId: ctx.identityId,
      } as Parameters<typeof reminderDomainService.createReminderGroup>[0]);
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
      const group = await getOwnedGroupOrFail(reminderGroupRepository, id, ctx);
      if (!group) {
        return fail({ code: 'NOT_FOUND', message: 'Group not found' });
      }
      return ok(group);
    },

    async updateGroup(id, data, ctx) {
      const existing = await getOwnedGroupOrFail(reminderGroupRepository, id, ctx);
      if (!existing) {
        throw new Error('Group not found');
      }
      const updated = ReminderGroup.load({
        id: existing.id,
        identityId: existing.identityId,
        name: (data.name as string) ?? existing.name,
        description: 'description' in data ? ((data.description as string | null) ?? null) : existing.description,
        controlMode: (data.controlMode as ControlMode) ?? existing.controlMode,
        enabled: existing.enabled,
        status: existing.status,
        order: (data.order as number) ?? existing.order,
        color: 'color' in data ? ((data.color as string | null) ?? null) : existing.color,
        icon: 'icon' in data ? ((data.icon as string | null) ?? null) : existing.icon,
        stats: GroupStats.fromDTO(existing.stats as GroupStatsDTO),
        createdAt: existing.createdAt,
        updatedAt: new Date(),
        deletedAt: existing.deletedAt,
        version: existing.version,
      });
      await reminderGroupRepository.save(updated);
      await reminderDomainService.syncTemplatesEffectiveEnabledByGroup(id);
      return ok(updated.toClientDTO());
    },

    async deleteGroup(id, ctx) {
      const existing = await getOwnedGroupOrFail(reminderGroupRepository, id, ctx);
      if (!existing) {
        return fail({ code: 'NOT_FOUND', message: 'Group not found' });
      }
      await reminderDomainService.deleteGroup(id, false);
      return ok(undefined);
    },

    async switchGroupControlMode(id, data, ctx) {
      const existing = await getOwnedGroupOrFail(reminderGroupRepository, id, ctx);
      if (!existing) {
        return fail({ code: 'NOT_FOUND', message: 'Group not found' });
      }
      if (data.mode === 'Group') {
        existing.switchToGroupControl();
      } else {
        existing.switchToIndividualControl();
      }
      await reminderGroupRepository.save(existing);
      await reminderDomainService.syncTemplatesEffectiveEnabledByGroup(id);
      return ok(existing.toClientDTO());
    },

    async batchGroupTemplates(groupId, data, ctx) {
      const group = await getOwnedGroupOrFail(reminderGroupRepository, groupId, ctx);
      if (!group) {
        return fail({ code: 'NOT_FOUND', message: 'Group not found' });
      }

      const templates = await reminderTemplateRepository.findByGroupId(group.id);
      let successCount = 0;
      for (const t of templates) {
        if (String((t as { identityId?: unknown }).identityId) !== ctx.identityId) {
          continue;
        }
        if (data.action === 'ENABLE') {
          t.enable();
        } else {
          t.pause();
        }
        await reminderDomainService.syncTemplateEffectiveEnabled(t);
        await reminderTemplateRepository.save(t);
        successCount++;
      }
      await reminderDomainService.updateGroupStats(group.id);
      return ok({ successCount, failedCount: 0 });
    },

    // ==================== Template Actions / 模板操作 ====================

    async enableTemplate(id, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, id, ctx);
      if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      template.enable();
      await reminderDomainService.syncTemplateEffectiveEnabled(template);
      await reminderTemplateRepository.save(template);
      if (template.groupId) {
        await reminderDomainService.updateGroupStats(template.groupId);
      }
      return ok(await templateMapper.toDTO(template));
    },

    async pauseTemplate(id, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, id, ctx);
      if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      template.pause();
      await reminderDomainService.syncTemplateEffectiveEnabled(template);
      await reminderTemplateRepository.save(template);
      if (template.groupId) {
        await reminderDomainService.updateGroupStats(template.groupId);
      }
      return ok(await templateMapper.toDTO(template));
    },

    async toggleTemplate(id, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, id, ctx);
      if (!template) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      template.toggle();
      await reminderDomainService.syncTemplateEffectiveEnabled(template);
      await reminderTemplateRepository.save(template);
      if (template.groupId) {
        await reminderDomainService.updateGroupStats(template.groupId);
      }
      return ok(await templateMapper.toDTO(template));
    },

    async moveTemplate(id, groupId, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, id, ctx);
      if (!template) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      if (groupId !== null) {
        const group = await getOwnedGroupOrFail(reminderGroupRepository, groupId, ctx);
        if (!group) {
          return fail({ code: 'NOT_FOUND', message: 'Group not found' });
        }
      }
      const result = await reminderDomainService.assignTemplateToGroup(id, groupId);
      const previousGroupId = template.groupId;
      if (previousGroupId) {
        await reminderDomainService.updateGroupStats(previousGroupId);
      }
      if (groupId) {
        await reminderDomainService.updateGroupStats(groupId);
      }
      return ok(await templateMapper.toDTO(result));
    },

    async getTemplateHistory(id, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, id, ctx, {
        includeHistory: true,
      });
      if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      const history = template.getAllHistory ? template.getAllHistory() : [];
      return ok(history);
    },

    // ==================== Response Operations / 响应操作 ====================

    // Identity propagated from transport context.
    // 身份信息从传输层上下文传递。
    async recordResponse(templateId, data, ctx) {
      return useCases.recordReminderResponse.execute({
        templateId,
        action: data.action as ReminderResponseAction,
        identityId: ctx.identityId,
      });
    },

    async getTemplateResponses(templateId, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, templateId, ctx);
      if (!template) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      return useCases.recordReminderResponse.getResponsesByTemplate(templateId);
    },

    async getResponseStats(templateId, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, templateId, ctx);
      if (!template) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      return useCases.recordReminderResponse.getResponseStats(templateId);
    },

    // ==================== Frequency Analysis / 频率分析 ====================

    async analyzeFrequency(templateId, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, templateId, ctx);
      if (!template) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      return useCases.analyzeReminderFrequency.execute(templateId);
    },

    // Identity propagated from transport context.
    // 身份信息从传输层上下文传递。
    async adjustFrequency(templateId, data, ctx) {
      return useCases.adjustReminderFrequency.execute({
        templateId,
        newInterval: data.customInterval ?? 0,
        reason: data.action,
        identityId: ctx.identityId,
      });
    },

    async rejectFrequencyAdjustment(templateId, ctx) {
      return useCases.adjustReminderFrequency.reject(templateId, ctx.identityId);
    },

    // ==================== Group Actions / 分组操作 ====================

    async toggleGroup(id, ctx) {
      const group = await getOwnedGroupOrFail(reminderGroupRepository, id, ctx);
      if (!group) {
        return fail({ code: 'NOT_FOUND', message: 'Group not found' });
      }

      const result = await reminderDomainService.toggleGroupAndTemplates(group.id);
      return ok(result);
    },

    // ==================== Preferences / 偏好设置 ====================

    async getPreferences(ctx) {
      const prefs = await userReminderPreferenceRepository.findByIdentityId(ctx.identityId);
      return ok(
        prefs?.toClientDTO() ??
          UserReminderPreferences.create({ identityId: ctx.identityId }).toClientDTO(),
      );
    },

    async updatePreferences(data, ctx) {
      const existing = await userReminderPreferenceRepository.findByIdentityId(ctx.identityId);
      if (!existing) {
        const prefs = UserReminderPreferences.create({ identityId: ctx.identityId });
        if (data.bestTimeSlots || data.worstTimeSlots) {
          prefs.updateTimeSlots(
            (data.bestTimeSlots as TimeSlotDTO[] | undefined) ?? [],
            (data.worstTimeSlots as TimeSlotDTO[] | undefined) ?? [],
          );
        }
        if (data.globalReminderEnabled !== undefined) {
          prefs.toggleGlobalReminderEnabled(!!data.globalReminderEnabled);
        }
        if (data.globalSmartFrequencyEnabled !== undefined) {
          prefs.toggleGlobalSmartFrequency(!!data.globalSmartFrequencyEnabled);
        }
        await userReminderPreferenceRepository.save(prefs);
        await reminderDomainService.syncTemplatesEffectiveEnabledByIdentity(ctx.identityId);
        return ok(prefs.toClientDTO());
      }
      if (data.bestTimeSlots || data.worstTimeSlots) {
        existing.updateTimeSlots(
          (data.bestTimeSlots as TimeSlotDTO[] | undefined) ?? [],
          (data.worstTimeSlots as TimeSlotDTO[] | undefined) ?? [],
        );
      }
      if (data.globalReminderEnabled !== undefined) {
        existing.toggleGlobalReminderEnabled(!!data.globalReminderEnabled);
      }
      if (data.globalSmartFrequencyEnabled !== undefined) {
        existing.toggleGlobalSmartFrequency(!!data.globalSmartFrequencyEnabled);
      }
      await userReminderPreferenceRepository.save(existing);
      await reminderDomainService.syncTemplatesEffectiveEnabledByIdentity(ctx.identityId);
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
    useCases,
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
