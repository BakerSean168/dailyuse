import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  GetReminderTodayScheduleReq,
  GetReminderTodayScheduleRes,
  GetUpcomingRemindersReq,
  GetUpcomingRemindersRes,
} from '@dailyuse/contracts/reminder';
import type { IReminderTemplateRepository } from '../../domain/repositories/i-reminder-template-repository';
import { UpcomingReminderCalculationService } from '../../domain/services/upcoming-reminder-calculation-service';

export interface ReminderScheduleQueryApplicationServiceDependencies {
  readonly reminderTemplateRepository: IReminderTemplateRepository;
}

export class ReminderScheduleQueryApplicationService {
  private readonly reminderTemplateRepository: IReminderTemplateRepository;

  constructor(dependencies: ReminderScheduleQueryApplicationServiceDependencies) {
    this.reminderTemplateRepository = dependencies.reminderTemplateRepository;
  }

  async getUpcomingReminders(
    params: GetUpcomingRemindersReq,
    ctx: ExecutionContext,
  ): Promise<Result<GetUpcomingRemindersRes>> {
    const templates = await this.reminderTemplateRepository.findByIdentityId(ctx.identityId, {
      includeDeleted: false,
    });
    const filteredTemplates = templates
      .map((template) => template.toServerDTO())
      .filter((template) => (params.type ? template.type === params.type : true))
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
  }

  async getTodaySchedule(
    params: GetReminderTodayScheduleReq,
    ctx: ExecutionContext,
  ): Promise<Result<GetReminderTodayScheduleRes>> {
    const templates = await this.reminderTemplateRepository.findByIdentityId(ctx.identityId, {
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
  }
}