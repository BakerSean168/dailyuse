/**
 * Record Reminder Response Service
 *
 * 记录提醒响应
 */

import type { IReminderResponseRepository, ResponseAction } from '@/domain-server';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('RecordReminderResponse');

/**
 * 响应记录DTO
 */
export interface RecordResponseDTO {
  templateUuid: string;
  action: ResponseAction;
  responseTime?: number; // 响应时间(秒)
  accountUuid: string;
}

/**
 * 响应记录结果
 */
export interface ResponseRecordResult {
  uuid: string;
  templateUuid: string;
  action: ResponseAction;
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
export class RecordReminderResponse {
  constructor(private readonly responseRepository: IReminderResponseRepository) {}

  /**
   * 记录响应行为
   *
   * @param dto - 响应记录DTO
   * @returns 创建的记录
   */
  async execute(dto: RecordResponseDTO): Promise<ResponseRecordResult> {
    try {
      logger.info('Recording response', {
        templateUuid: dto.templateUuid,
        action: dto.action,
        responseTime: dto.responseTime,
        accountUuid: dto.accountUuid,
      });

      // Create response entity and save through repository
      // TODO: Create ReminderResponse entity in domain layer
      // For now, using placeholder object structure
      const response: any = {
        templateUuid: dto.templateUuid,
        action: dto.action,
        responseTime: dto.responseTime || null,
        timestamp: BigInt(Date.now()),
      };

      const savedRecord = await this.responseRepository.save(response);

      logger.info('Response recorded', {
        uuid: savedRecord.uuid,
        templateUuid: dto.templateUuid,
        action: dto.action,
      });

      // 发布响应记录事件
      await eventBus.publish({
        eventType: 'reminder.response.recorded',
        payload: {
          responseUuid: savedRecord.uuid,
          templateUuid: dto.templateUuid,
          action: dto.action,
          responseTime: dto.responseTime || null,
          accountUuid: dto.accountUuid,
          recordedAt: Date.now(),
        },
        timestamp: Date.now(),
      });

      return {
        uuid: savedRecord.uuid,
        templateUuid: savedRecord.reminderTemplateUuid,
        action: savedRecord.action as any,
        responseTime: savedRecord.responseTime,
        recordedAt: savedRecord.timestamp,
      };
    } catch (error) {
      logger.error('Failed to record response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dto,
      });
      throw error;
    }
  }

  /**
   * 获取模板的响应记录
   *
   * @param templateUuid - 模板UUID
   * @param limit - 返回记录数限制
   * @returns 响应记录列表
   */
  async getResponsesByTemplate(
    templateUuid: string,
    limit: number = 100,
  ): Promise<any[]> {
    try {
      const responses = await this.responseRepository.findByTemplateUuid(templateUuid, limit);
      return responses;
    } catch (error) {
      logger.error('Failed to get responses', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateUuid,
      });
      throw error;
    }
  }

  /**
   * 删除模板的所有响应记录
   *
   * @param templateUuid - 模板UUID
   * @returns 删除的记录数量
   */
  async deleteResponsesByTemplate(templateUuid: string): Promise<number> {
    try {
      logger.info('Deleting responses for template', { templateUuid });

      const count = await this.responseRepository.deleteByTemplateUuid(templateUuid);

      logger.info('Responses deleted', {
        templateUuid,
        count,
      });

      return count;
    } catch (error) {
      logger.error('Failed to delete responses', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateUuid,
      });
      throw error;
    }
  }

  /**
   * 获取响应统计
   *
   * @param templateUuid - 模板UUID
   * @param lookbackDays - 回溯天数
   * @returns 响应统计信息
   */
  async getResponseStats(
    templateUuid: string,
    lookbackDays: number = 30,
  ): Promise<ResponseStatsResult> {
    try {
      const stats = await this.responseRepository.getResponseStats(templateUuid, lookbackDays);
      return stats as ResponseStatsResult;
    } catch (error) {
      logger.error('Failed to get response stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateUuid,
      });
      throw error;
    }
  }
}
