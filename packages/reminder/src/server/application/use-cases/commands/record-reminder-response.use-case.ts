/**
 * Record Reminder Response Service
 *
 * 记录提醒响应
 */

import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { IReminderResponseRepository } from '../../../domain/repositories/i-reminder-response-repository';
import type { ReminderEventMap, ReminderResponseAction } from '@memoflow/contracts/reminder';
import { createTypedEventPublisher, eventBus } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import { ReminderResponse } from '../../../domain/entities/reminder-response';

const logger = createLogger('RecordReminderResponseUseCase');
const reminderAnalyticsEvents = createTypedEventPublisher<
  Pick<ReminderEventMap, 'reminder:response-recorded'>
>(eventBus);

/**
 * R3c：snooze 副作用端口——把提醒的下次触发推迟 duration 秒。
 * 由宿主/模块组合根注入实现（API：更新 schedule task nextRunAt；desktop 同理）。
 */
export interface ReminderSnoozeRescheduler {
  reschedule(templateId: string, identityId: string, durationSeconds: number): Promise<void>;
}

/**
 * 响应记录DTO
 */
export interface RecordResponseDTO {
  templateId: string;
  action: ReminderResponseAction;
  responseTime?: number; // 响应时间(秒)
  identityId: string;
}

/**
 * 响应记录结果
 */
export interface ResponseRecordResult {
  id: string;
  templateId: string;
  action: ReminderResponseAction;
  responseTime: number | null;
  recordedAt: number;
}

/**
 * 响应统计结果
 */
export interface ResponseStatsResult {
  total: number;
  clicked: number;
  ignored: number;
  snoozed: number;
  dismissed: number;
  completed: number;
  avgResponseTime: number;
}

/**
 * Record Reminder Response Service
 *
 * 职责：
 * - 记录用户对提醒的响应行为（主要职责）
 * - 为智能频率分析提供数据基础
 * - 触发相关业务事件
 */
export class RecordReminderResponseUseCase {
  constructor(
    private readonly responseRepository: IReminderResponseRepository,
    private readonly snoozeRescheduler?: ReminderSnoozeRescheduler,
  ) {}

  /**
   * 记录响应行为
   *
   * @param dto - 响应记录DTO
   * @returns 创建的记录
   */
  async execute(dto: RecordResponseDTO): Promise<Result<ResponseRecordResult>> {
    logger.info('Recording response', {
      templateId: dto.templateId,
      action: dto.action,
      responseTime: dto.responseTime,
      identityId: dto.identityId,
    });

    // R3c：snooze 必须带正的时长；其他 action 的时长可选非负。
    if (dto.action === 'SNOOZED') {
      if (dto.responseTime === undefined || dto.responseTime <= 0) {
        return error('VALIDATION_ERROR', 'Snooze requires a positive duration (responseTime seconds)');
      }
    }

    const response = ReminderResponse.create({
      reminderTemplateId: dto.templateId,
      identityId: dto.identityId,
      action: dto.action,
      responseTime: dto.responseTime ?? undefined,
      timestamp: Date.now(),
    });

    await this.responseRepository.save(response);
    const savedRecord = response.toServerDTO();

    logger.info('Response recorded', {
      id: savedRecord.id,
      templateId: dto.templateId,
      action: dto.action,
    });

    // R3c：snooze 是真正的 command——推迟该提醒的下次触发。
    if (dto.action === 'SNOOZED' && this.snoozeRescheduler) {
      try {
        await this.snoozeRescheduler.reschedule(
          dto.templateId,
          dto.identityId,
          dto.responseTime ?? 0,
        );
      } catch (error) {
        logger.error('Snooze reschedule failed (response still recorded)', {
          templateId: dto.templateId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 发布响应记录事件
    const recordedEvent: ReminderEventMap['reminder:response-recorded'] = {
      responseId: savedRecord.id,
      templateId: dto.templateId as ReminderEventMap['reminder:response-recorded']['templateId'],
      action: dto.action,
      responseTime: dto.responseTime || null,
      identityId: dto.identityId as ReminderEventMap['reminder:response-recorded']['identityId'],
      recordedAt: Date.now(),
    };
    reminderAnalyticsEvents.send('reminder:response-recorded', recordedEvent);

    return ok({
      id: savedRecord.id,
      templateId: savedRecord.reminderTemplateId,
      action: savedRecord.action as ResponseRecordResult['action'],
      responseTime: savedRecord.responseTime ?? null,
      recordedAt: savedRecord.timestamp,
    });
  }

  /**
   * 获取模板的响应记录
   *
   * @param templateId - 模板UUID
   * @param limit - 返回记录数限制
   * @returns 响应记录列表
   */
  async getResponsesByTemplate(
    templateId: string,
    identityId: string,
    limit: number = 100,
  ): Promise<Result<unknown[]>> {
    const responses = await this.responseRepository.findByTemplateId(
      templateId,
      identityId,
      limit,
    );
    return ok(responses);
  }

  /**
   * 删除模板的所有响应记录
   *
   * @param templateId - 模板UUID
   * @returns 删除的记录数量
   */
  async deleteResponsesByTemplate(
    templateId: string,
    identityId: string,
  ): Promise<Result<number>> {
    logger.info('Deleting responses for template', { templateId, identityId });

    const count = await this.responseRepository.deleteByTemplateId(templateId, identityId);

    logger.info('Responses deleted', {
      templateId,
      count,
    });

    return ok(count);
  }

  /**
   * 获取响应统计
   *
   * @param templateId - 模板UUID
   * @param lookbackDays - 回溯天数
   * @returns 响应统计信息
   */
  async getResponseStats(
    templateId: string,
    identityId: string,
    lookbackDays: number = 30,
  ): Promise<Result<ResponseStatsResult>> {
    const stats = await this.responseRepository.getResponseStats(
      templateId,
      identityId,
      lookbackDays,
    );
    return ok(stats as ResponseStatsResult);
  }
}
