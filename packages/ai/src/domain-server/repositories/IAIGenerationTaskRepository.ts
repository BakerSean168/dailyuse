/**
 * AI Generation Task Repository Interface
 * AI 生成任务仓储接口
 *
 * DDD 仓储模式：
 * - 操作领域对象（ServerDTO），不直接操作数据库模型
 * - 由基础设施层实现（Prisma）
 * - 隐藏持久化细节
 */

import type { AIGenerationTaskServerDTO, TaskStatus } from '@dailyuse/contracts/ai';
import { GenerationTaskType } from '@dailyuse/contracts/ai';

/**
 * IAIGenerationTaskRepository 仓储接口
 *
 * 职责：
 * - AI 生成任务的持久化操作
 * - 按账户、类型、状态查询任务
 * - 任务历史记录
 */
export interface IAIGenerationTaskRepository {
  /**
   * 保存任务（创建或更新）
   */
  save(task: AIGenerationTaskServerDTO): Promise<void>;

  /**
   * 根据 UUID 查找任务
   */
  findByUuid(uuid: string): Promise<AIGenerationTaskServerDTO | null>;

  /**
   * 根据账户 UUID 查找所有任务
   */
  findByAccountUuid(accountUuid: string): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 根据任务类型查找任务
   */
  findByTaskType(
    accountUuid: string,
    taskType: GenerationTaskType,
  ): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 根据状态查找任务
   */
  findByStatus(accountUuid: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 查找最近的任务（分页）
   */
  findRecent(
    accountUuid: string,
    limit: number,
    offset?: number,
  ): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 删除任务
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查任务是否存在
   */
  exists(uuid: string): Promise<boolean>;
}
