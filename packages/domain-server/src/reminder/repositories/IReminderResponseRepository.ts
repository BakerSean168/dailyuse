/**
 * ReminderResponse 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { ReminderResponse } from '../entities/ReminderResponse';

/**
 * 响应行为类型
 */
export type ResponseAction = 'clicked' | 'ignored' | 'snoozed' | 'dismissed' | 'completed';

/**
 * IReminderResponseRepository 仓储接口
 *
 * 职责：
 * - 定义 ReminderResponse 实体的持久化操作契约
 * - 隐藏具体的数据库实现（如 Prisma）
 * - 提供响应数据的查询和统计能力
 */
export interface IReminderResponseRepository {
  /**
   * 保存响应记录
   *
   * @param response - 响应实体
   * @returns 保存后的响应实体
   */
  save(response: ReminderResponse): Promise<ReminderResponse>;

  /**
   * 通过 UUID 查找响应记录
   *
   * @param uuid - 响应UUID
   * @returns 响应实体，不存在则返回 null
   */
  findById(uuid: string): Promise<ReminderResponse | null>;

  /**
   * 通过模板 UUID 获取响应记录列表
   *
   * @param templateUuid - 提醒模板UUID
   * @param limit - 返回记录数限制
   * @returns 响应记录列表
   */
  findByTemplateUuid(templateUuid: string, limit?: number): Promise<ReminderResponse[]>;

  /**
   * 通过模板 UUID 获取响应统计
   *
   * @param templateUuid - 提醒模板UUID
   * @param lookbackDays - 回溯天数
   * @returns 响应统计信息
   */
  getResponseStats(
    templateUuid: string,
    lookbackDays?: number,
  ): Promise<{
    total: number;
    clicked: number;
    ignored: number;
    snoozed: number;
    dismissed: number;
    completed: number;
    avgResponseTime: number;
  }>;

  /**
   * 删除模板的所有响应记录
   *
   * @param templateUuid - 提醒模板UUID
   * @returns 删除的记录数量
   */
  deleteByTemplateUuid(templateUuid: string): Promise<number>;

  /**
   * 统计模板的响应分布
   *
   * @param templateUuid - 提醒模板UUID
   * @param lookbackDays - 回溯天数
   * @returns 响应分布统计
   */
  getResponseDistribution(
    templateUuid: string,
    lookbackDays?: number,
  ): Promise<Record<ResponseAction, number>>;
}
