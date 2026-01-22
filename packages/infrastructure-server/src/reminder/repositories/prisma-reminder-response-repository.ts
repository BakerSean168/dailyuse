/**
 * ReminderResponse 实体 Prisma 仓储实现
 *
 * 职责�?
 * - 实现 IReminderResponseRepository 接口
 * - �?ReminderResponse 实体映射�?Prisma ORM
 * - 隐藏数据库具体细�?
 */

import type {  PrismaClient  } from "@prisma/client";
import type { IReminderResponseRepository, ResponseAction } from '@dailyuse/domain-server/reminder';
import { ReminderResponse } from '@dailyuse/domain-server/reminder';

/**
 * PrismaReminderResponseRepository
 */
export class PrismaReminderResponseRepository implements IReminderResponseRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 保存响应记录
   */
  async save(response: ReminderResponse): Promise<ReminderResponse> {
    // TODO: 需要运�?Prisma migration 后才能使�?reminderResponse �?
    // @ts-ignore - reminderResponse 表还未创�?
    const saved = await this.prisma.reminderResponse.create({
      data: {
        uuid: response.uuid,
        templateUuid: response.reminderTemplateUuid,
        action: response.action,
        responseTime: response.responseTime,
        timestamp: response.timestamp,
      },
    });

    return this.mapToEntity(saved);
  }

  /**
   * 通过 UUID 查找响应记录
   */
  async findById(uuid: string): Promise<ReminderResponse | null> {
    // TODO: 需要运�?Prisma migration 后才能使�?reminderResponse �?
    // @ts-ignore
    const record = await this.prisma.reminderResponse.findUnique({
      where: { uuid },
    });

    return record ? this.mapToEntity(record) : null;
  }

  /**
   * 通过模板 UUID 获取响应记录列表
   */
  async findByTemplateUuid(templateUuid: string, limit: number = 100): Promise<ReminderResponse[]> {
    // TODO: 需要运�?Prisma migration 后才能使�?reminderResponse �?
    // @ts-ignore
    const records = await this.prisma.reminderResponse.findMany({
      where: {
        templateUuid,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return records.map((r: any) => this.mapToEntity(r));
  }

  /**
   * 通过模板 UUID 获取响应统计
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
    const cutoffTime = BigInt(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    // TODO: 需要运�?Prisma migration 后才能使�?reminderResponse �?
    // @ts-ignore
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
  }

  /**
   * 删除模板的所有响应记�?
   */
  async deleteByTemplateUuid(templateUuid: string): Promise<number> {
    // TODO: 需要运�?Prisma migration 后才能使�?reminderResponse �?
    // @ts-ignore
    const result = await this.prisma.reminderResponse.deleteMany({
      where: {
        templateUuid,
      },
    });

    return result.count;
  }

  /**
   * 统计模板的响应分�?
   */
  async getResponseDistribution(
    templateUuid: string,
    lookbackDays: number = 30,
  ): Promise<Record<ResponseAction, number>> {
    const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;
    const cutoffTime = BigInt(Date.now() - lookbackMs);

    // TODO: 需要运�?Prisma migration 后才能使�?reminderResponse �?
    // @ts-ignore
    const records = await this.prisma.reminderResponse.findMany({
      where: {
        templateUuid,
        timestamp: { gte: cutoffTime },
      },
    });

    const distribution: Record<ResponseAction, number> = {
      clicked: 0,
      ignored: 0,
      snoozed: 0,
      dismissed: 0,
      completed: 0,
    };

    for (const record of records) {
      distribution[record.action as ResponseAction]++;
    }

    return distribution;
  }

  /**
   * �?Prisma 记录映射�?ReminderResponse 实体
   */
  private mapToEntity(data: any): ReminderResponse {
    return ReminderResponse.create({
      uuid: data.uuid,
      reminderTemplateUuid: data.templateUuid,
      action: data.action,
      responseTime: data.responseTime,
      timestamp: data.timestamp,
    });
  }
}
