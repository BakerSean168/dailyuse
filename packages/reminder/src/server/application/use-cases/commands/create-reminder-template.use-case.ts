/**
 * Create Reminder Template Service
 *
 * 创建提醒模板
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IReminderTemplateRepository } from '../../../domain/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '../../../domain/repositories/i-reminder-group-repository';
import { ReminderDomainService } from '../../../domain/services/reminder-domain-service';
import type {
  ReminderTemplateClientDTO,
  CreateReminderTemplateReq,
} from '@memoflow/contracts/reminder';
import { ReminderTemplateClientMapper } from '../../mappers/reminder-template-client.mapper';

/**
 * Create Reminder Template Service
 */
export class CreateReminderTemplateUseCase {
  private readonly reminderDomainService: ReminderDomainService;
  private readonly templateMapper: ReminderTemplateClientMapper;
  private readonly closureChecker: (identityId: string) => Promise<boolean>;

  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository: IReminderGroupRepository,
    reminderDomainService?: ReminderDomainService,
    templateMapper?: ReminderTemplateClientMapper,
    closureChecker?: (identityId: string) => Promise<boolean>,
  ) {
    if (!closureChecker) {
      throw new Error('[FAIL-CLOSED] CreateReminderTemplateUseCase requires closureChecker');
    }
    this.closureChecker = closureChecker;
    this.reminderDomainService =
      reminderDomainService ?? new ReminderDomainService(templateRepository, groupRepository);
    this.templateMapper =
      templateMapper ??
      new ReminderTemplateClientMapper(this.reminderDomainService, groupRepository);
  }

  async execute(
    input: CreateReminderTemplateReq,
    cx: ExecutionContext,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    if (input.id) {
      const existing = await this.templateRepository.findByIdForIdentity(cx.identityId, input.id);
      if (existing) return ok(await this.templateMapper.toDTO(existing));
    }

    if (await this.closureChecker(cx.identityId)) {
      return error('FORBIDDEN', 'Account is closed or closure in progress');
    }
    // Residual 835: request activeTime is already ActiveTimeConfigDTO (activatedAt).
    const normalizedInput = {
      ...input,
      activeTime: input.activeTime,
      activeHours: input.activeHours
        ? {
            enabled: true,
            startHour: input.activeHours.startHour,
            endHour: input.activeHours.endHour,
          }
        : undefined,
      notificationConfig: {
        ...input.notificationConfig,
        actions: input.notificationConfig.actions ?? null,
      },
      importanceLevel: input.importanceLevel,
    };

    try {
      const template = await this.reminderDomainService.createReminderTemplate({
        ...normalizedInput,
        id: input.id,
        identityId: cx.identityId,
      });

      return ok(await this.templateMapper.toDTO(template));
    } catch (cause) {
      // Close the concurrent deterministic-ID create window: if another
      // workflow attempt committed first, surface that durable entity as the
      // successful replay rather than creating a duplicate reminder.
      if (input.id) {
        const existing = await this.templateRepository.findByIdForIdentity(cx.identityId, input.id);
        if (existing) return ok(await this.templateMapper.toDTO(existing));
      }

      return error(
        'NOT_FOUND',
        cause instanceof Error ? cause.message : 'Failed to create reminder template',
      );
    }
  }
}
