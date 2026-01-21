import type { PrismaClient } from '@prisma/client';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderResponseService');

/**
 * 响应行为类型
 */
export type ResponseAction = 'clicked' | 'ignored' | 'snoozed' | 'dismissed' | 'completed';

/**
 * 响应记录接口
 */
export interface RecordResponseDTO {
  templateUuid: string;
  action: ResponseAction;
  responseTime?: number; // 响应时间(秒)
}

/**
 * Reminder Response Service
 *
 * 职责：
 * - 记录用户对提醒的响应行为
 * - 为智能频率分析提供数据基础
 */
export class ReminderResponseService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取服务单例
   */
  static getInstance(prisma: PrismaClient): ReminderResponseService {
    return new ReminderResponseService(prisma);
  }

  /**
   * 记录响应行为
   *
   * @param dto - 响应记录DTO
   * @returns 创建的记录UUID
   */
  async recordResponse(dto: RecordResponseDTO): Promise<string> {
    try {
      logger.info('Recording response', {
        templateUuid: dto.templateUuid,
        action: dto.action,
        responseTime: dto.responseTime,
      });

      // TODO: 需要运行 Prisma migration 后才能使用 reminderResponse
      // @ts-ignore - reminderResponse 表还未创建,需要运行 migration
      const record = await this.prisma.reminderResponse.create({
        data: {
          templateUuid: dto.templateUuid,
          action: dto.action,
          responseTime: dto.responseTime || null,
          timestamp: BigInt(Date.now()),
        },
      });

      logger.info('Response recorded', {
        uuid: record.uuid,
        templateUuid: dto.templateUuid,
        action: dto.action,
      });

      return record.uuid;
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
   * @param limit - 返回记录数量限制
   * @returns 响应记录列表
   */
  async getResponsesByTemplate(
    templateUuid: string,
    limit: number = 100,
  ): Promise<
    Array<{
      uuid: string;
      action: string;
      responseTime: number | null;
      timestamp: bigint;
      createdAt: Date;
    }>
  > {
    try {
      // TODO: 需要运行 Prisma migration 后才能使用 reminderResponse
      // @ts-ignore - reminderResponse 表还未创建,需要运行 migration
      const records = await this.prisma.reminderResponse.findMany({
        where: {
          templateUuid,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
      });

      return records;
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

      // TODO: 需要运行 Prisma migration 后才能使用 reminderResponse
      // @ts-ignore - reminderResponse 表还未创建,需要运行 migration
      const result = await this.prisma.reminderResponse.deleteMany({
        where: {
          templateUuid,
        },
      });

      logger.info('Responses deleted', {
        templateUuid,
        count: result.count,
      });

      return result.count;
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
  ): Promise<{
    total: number;
    clicked: number;
    ignored: number;
    snoozed: number;
    dismissed: number;
    completed: number;
    avgResponseTime: number;
  }> {
    try {
      const cutoffTime = BigInt(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

      // TODO: 需要运行 Prisma migration 后才能使用 reminderResponse
      // @ts-ignore - reminderResponse 表还未创建,需要运行 migration
      const records = await this.prisma.reminderResponse.findMany({
        where: {
          templateUuid,
          timestamp: {
            gte: cutoffTime,
          },
        },
      });

      const stats = {
        total: records.length,
        clicked: records.filter((r: any) => r.action === 'clicked').length,
        ignored: records.filter((r: any) => r.action === 'ignored').length,
        snoozed: records.filter((r: any) => r.action === 'snoozed').length,
        dismissed: records.filter((r: any) => r.action === 'dismissed').length,
        completed: records.filter((r: any) => r.action === 'completed').length,
        avgResponseTime: 0,
      };

      // 计算平均响应时间
      const responseTimes = records
        .filter((r: any) => r.responseTime !== null)
        .map((r: any) => r.responseTime);

      if (responseTimes.length > 0) {
        stats.avgResponseTime =
          responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get response stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateUuid,
      });
      throw error;
    }
  }
}
