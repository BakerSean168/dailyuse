/**
 * createReminderModule — explicit composition root for the reminder server runtime.
 * createReminderModule —— 提醒模块服务端运行时的显式组合根。
 */

import type { IReminderTemplateRepository } from '../domain-server/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '../domain-server/repositories/i-reminder-group-repository';
import type { IReminderResponseRepository } from '../domain-server/repositories/i-reminder-response-repository';
import type { IUserReminderPreferenceRepository } from '../domain-server/repositories/i-user-reminder-preference-repository';
import type { Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { fail } from '@dailyuse/contracts/result';
import type {
  BatchGroupTemplatesReq,
  BatchGroupTemplatesRes,
  CreateReminderGroupReq,
  CreateReminderTemplateReq,
  GetReminderTodayScheduleReq,
  GetReminderTodayScheduleRes,
  GetUpcomingRemindersReq,
  GetUpcomingRemindersRes,
  ReminderGroupClientDTO,
  ReminderGroupListRes,
  ReminderHistoryClientDTO,
  ReminderTemplateClientDTO,
  ReminderTemplateListRes,
  SwitchGroupControlModeReq,
  UpdateReminderGroupReq,
  UpdateReminderPreferencesReq,
  UpdateReminderTemplateReq,
  UserReminderPreferencesClientDTO,
} from '@dailyuse/contracts/reminder';
import type { ReminderResponseAction } from '@dailyuse/contracts/reminder';
import type { ReminderTemplate } from '../domain-server/aggregates/reminder-template';
import { ReminderDomainService } from '../domain-server/services/reminder-domain-service';
import { ReminderTemplateClientMapper } from '../application-server/mappers/reminder-template-client.mapper';
import {
  ReminderGroupApplicationService,
  ReminderPreferencesApplicationService,
  ReminderScheduleQueryApplicationService,
  ReminderTemplateActionApplicationService,
} from '../application-server/services';
import { CreateReminderTemplateUseCase } from '../application-server/use-cases/commands/create-reminder-template.use-case';
import { UpdateReminderTemplateUseCase } from '../application-server/use-cases/commands/update-reminder-template.use-case';
import { DeleteReminderTemplateUseCase } from '../application-server/use-cases/commands/delete-reminder-template.use-case';
import { RecordReminderResponseUseCase } from '../application-server/use-cases/commands/record-reminder-response.use-case';
import { GetReminderTemplateUseCase } from '../application-server/use-cases/queries/get-reminder-template.use-case';
import { ListReminderTemplatesUseCase } from '../application-server/use-cases/queries/list-reminder-templates.use-case';
import { AnalyzeReminderFrequencyUseCase } from '../application-server/use-cases/queries/analyze-reminder-frequency.use-case';
import { AdjustReminderFrequencyUseCase } from '../application-server/use-cases/commands/adjust-reminder-frequency.use-case';

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

export interface ReminderModuleRuntimeContribution {
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
}

export interface ReminderApplicationPort {
  createTemplate(
    data: CreateReminderTemplateReq,
    ctx: ExecutionContext,
  ): Promise<Result<ReminderTemplateClientDTO>>;
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
  ): Promise<Result<ReminderTemplateClientDTO>>;
  deleteTemplate(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  enableTemplate(id: string, ctx: ExecutionContext): Promise<Result<ReminderTemplateClientDTO>>;
  pauseTemplate(id: string, ctx: ExecutionContext): Promise<Result<ReminderTemplateClientDTO>>;
  toggleTemplate(id: string, ctx: ExecutionContext): Promise<Result<ReminderTemplateClientDTO>>;
  moveTemplate(
    id: string,
    groupId: string | null,
    ctx: ExecutionContext,
  ): Promise<Result<ReminderTemplateClientDTO>>;
  getTemplateHistory(id: string, ctx: ExecutionContext): Promise<Result<ReminderHistoryClientDTO[]>>;
  recordResponse(
    templateId: string,
    data: { action: string; note?: string },
    ctx: ExecutionContext,
  ): Promise<Result<unknown>>;
  getTemplateResponses(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  getResponseStats(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  analyzeFrequency(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  adjustFrequency(
    templateId: string,
    data: { action: string; customInterval?: number },
    ctx: ExecutionContext,
  ): Promise<Result<unknown>>;
  rejectFrequencyAdjustment(templateId: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  createGroup(data: CreateReminderGroupReq, ctx: ExecutionContext): Promise<Result<ReminderGroupClientDTO>>;
  listGroups(ctx: ExecutionContext): Promise<Result<ReminderGroupListRes>>;
  getGroup(id: string, ctx: ExecutionContext): Promise<Result<ReminderGroupClientDTO>>;
  updateGroup(
    id: string,
    data: UpdateReminderGroupReq,
    ctx: ExecutionContext,
  ): Promise<Result<ReminderGroupClientDTO>>;
  deleteGroup(id: string, ctx: ExecutionContext): Promise<Result<unknown>>;
  switchGroupControlMode(
    id: string,
    data: SwitchGroupControlModeReq,
    ctx: ExecutionContext,
  ): Promise<Result<ReminderGroupClientDTO>>;
  batchGroupTemplates(
    groupId: string,
    data: BatchGroupTemplatesReq,
    ctx: ExecutionContext,
  ): Promise<Result<BatchGroupTemplatesRes>>;
  toggleGroup(id: string, ctx: ExecutionContext): Promise<Result<ReminderGroupClientDTO>>;
  getPreferences(ctx: ExecutionContext): Promise<Result<UserReminderPreferencesClientDTO>>;
  updatePreferences(
    data: UpdateReminderPreferencesReq,
    ctx: ExecutionContext,
  ): Promise<Result<UserReminderPreferencesClientDTO>>;
}

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
  const { reminderTemplateRepository, reminderGroupRepository, reminderResponseRepository } = dependencies;

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
  if (!template || String(template.identityId) !== ctx.identityId) {
    return null;
  }
  return template;
}

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
  const reminderGroupApplicationService = new ReminderGroupApplicationService({
    reminderGroupRepository,
    reminderTemplateRepository,
    reminderDomainService,
  });
  const reminderPreferencesApplicationService = new ReminderPreferencesApplicationService({
    userReminderPreferenceRepository,
    reminderDomainService,
  });
  const reminderScheduleQueryApplicationService = new ReminderScheduleQueryApplicationService({
    reminderTemplateRepository,
  });
  const reminderTemplateActionApplicationService = new ReminderTemplateActionApplicationService({
    reminderTemplateRepository,
    reminderGroupRepository,
    reminderDomainService,
    templateMapper,
  });

  const api: ReminderApplicationPort = {
    async createTemplate(data, ctx) {
      return useCases.createReminderTemplate.execute(data, ctx);
    },

    async listTemplates(ctx) {
      return useCases.listReminderTemplates.execute(undefined, ctx);
    },

    async getUpcomingReminders(params, ctx) {
      return reminderScheduleQueryApplicationService.getUpcomingReminders(params, ctx);
    },

    async getTodaySchedule(params, ctx) {
      return reminderScheduleQueryApplicationService.getTodaySchedule(params, ctx);
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

    async enableTemplate(id, ctx) {
      return reminderTemplateActionApplicationService.enableTemplate(id, ctx);
    },

    async pauseTemplate(id, ctx) {
      return reminderTemplateActionApplicationService.pauseTemplate(id, ctx);
    },

    async toggleTemplate(id, ctx) {
      return reminderTemplateActionApplicationService.toggleTemplate(id, ctx);
    },

    async moveTemplate(id, groupId, ctx) {
      return reminderTemplateActionApplicationService.moveTemplate(id, groupId, ctx);
    },

    async getTemplateHistory(id, ctx) {
      return reminderTemplateActionApplicationService.getTemplateHistory(id, ctx);
    },

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

    async analyzeFrequency(templateId, ctx) {
      const template = await getOwnedTemplateOrFail(reminderTemplateRepository, templateId, ctx);
      if (!template) {
        return fail({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      return useCases.analyzeReminderFrequency.execute(templateId);
    },

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

    async createGroup(data, ctx) {
      return reminderGroupApplicationService.createGroup(data, ctx);
    },

    async listGroups(ctx) {
      return reminderGroupApplicationService.listGroups(ctx);
    },

    async getGroup(id, ctx) {
      return reminderGroupApplicationService.getGroup(id, ctx);
    },

    async updateGroup(id, data, ctx) {
      return reminderGroupApplicationService.updateGroup(id, data, ctx);
    },

    async deleteGroup(id, ctx) {
      return reminderGroupApplicationService.deleteGroup(id, ctx);
    },

    async switchGroupControlMode(id, data, ctx) {
      return reminderGroupApplicationService.switchGroupControlMode(id, data, ctx);
    },

    async batchGroupTemplates(groupId, data, ctx) {
      return reminderGroupApplicationService.batchGroupTemplates(groupId, data, ctx);
    },

    async toggleGroup(id, ctx) {
      return reminderGroupApplicationService.toggleGroup(id, ctx);
    },

    async getPreferences(ctx) {
      return reminderPreferencesApplicationService.getPreferences(ctx);
    },

    async updatePreferences(data, ctx) {
      return reminderPreferencesApplicationService.updatePreferences(data, ctx);
    },
  };

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