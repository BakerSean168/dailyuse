/**
 * ReminderResponse 仓储接口
 *
 * DDD 仓储模式：
 * - ReminderResponse 是 ReminderTemplate 聚合的关联实体
 * - 独立仓储是因为响应数据量大，需要独立的查询和统计能力
 * - 由基础设施层实现
 */

import type { ReminderResponse } from '../entities/reminder-response';
import type { ReminderResponseAction } from '@dailyuse/contracts/reminder';

/**
 * IReminderResponseRepository 仓储接口
 *
 * 职责：
 * - ReminderResponse 实体的持久化操作契约
 * - 提供响应数据的查询和统计能力
 */
export interface IReminderResponseRepository {
  /**
   * 保存响应记录
   *
   * @param response 响应实体
   */
  save(response: ReminderResponse): Promise<void>;

  /**
   * 通过 ID 查找响应记录（系统/内部路径；授权敏感路径请用 findByIdForIdentity）
   *
   * @param id 响应 ID
   * @returns 响应实体，不存在则返回 null
   */
  findById(id: string): Promise<ReminderResponse | null>;

  /**
   * 通过 ID + identity 查找响应记录（授权敏感读路径）
   */
  findByIdForIdentity(identityId: string, id: string): Promise<ReminderResponse | null>;

  /**
   * 通过模板 ID + identity 获取响应记录列表
   *
   * @param templateId 提醒模板 ID
   * @param identityId 身份 ID
   * @param limit 返回记录数限制
   * @returns 响应记录列表
   */
  findByTemplateId(
    templateId: string,
    identityId: string,
    limit?: number,
  ): Promise<ReminderResponse[]>;

  /**
   * 通过模板 ID + identity 获取响应统计
   *
   * @param templateId 提醒模板 ID
   * @param identityId 身份 ID
   * @param lookbackDays 回溯天数
   * @returns 响应统计信息
   */
  getResponseStats(
    templateId: string,
    identityId: string,
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
   * 删除模板的所有响应记录（identity-scoped）
   *
   * @param templateId 提醒模板 ID
   * @param identityId 身份 ID
   * @returns 删除的记录数量
   */
  deleteByTemplateId(templateId: string, identityId: string): Promise<number>;

  /**
   * 统计模板的响应分布（identity-scoped）
   *
   * @param templateId 提醒模板 ID
   * @param identityId 身份 ID
   * @param lookbackDays 回溯天数
   * @returns 响应分布统计
   */
  getResponseDistribution(
    templateId: string,
    identityId: string,
    lookbackDays?: number,
  ): Promise<Record<ReminderResponseAction, number>>;
}
