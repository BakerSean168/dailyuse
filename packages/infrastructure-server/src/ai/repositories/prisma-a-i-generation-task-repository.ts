// @ts-nocheck
/**
 * Prisma AI Generation Task Repository
 * Prisma AI 生成任务仓储实现
 *
 * 职责：
 * - 操作 ai_generation_tasks 表
 * - ServerDTO ↔ Prisma Model 映射
 * - 任务查询和历史记录
 *
 * TODO: 需要数据库 migration 应用后修复类型错误
 */

import { PrismaClient } from '@prisma/client';
import type { IAIGenerationTaskRepository } from '@dailyuse/domain-server/ai';
import type { AIGenerationTaskServerDTO } from '@dailyuse/contracts/ai';
import { GenerationTaskType, TaskStatus } from '@dailyuse/contracts/ai';

/**
 * PrismaAIGenerationTaskRepository 实现
 */
export class PrismaAIGenerationTaskRepository implements IAIGenerationTaskRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 保存任务（UPSERT 语义）
   */
  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    await this.prisma.aiGenerationTask.upsert({
      where: { uuid: task.uuid },
      create: {
        uuid: task.uuid,
        accountUuid: task.accountUuid,
        taskType: task.taskType,
        status: task.status,
        input: task.input,
        result: task.result || null,
        error: task.error || null,
        retryCount: task.retryCount,
        tokenUsage: task.tokenUsage ? JSON.stringify(task.tokenUsage) : null,
        processingMs: task.processingMs || null,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        deletedAt: task.deletedAt ? new Date(task.deletedAt) : null,
      },
      update: {
        status: task.status,
        result: task.result || null,
        error: task.error || null,
        retryCount: task.retryCount,
        tokenUsage: task.tokenUsage ? JSON.stringify(task.tokenUsage) : null,
        processingMs: task.processingMs || null,
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        deletedAt: task.deletedAt ? new Date(task.deletedAt) : null,
      },
    });
  }

  /**
   * 根据 UUID 查找任务
   */
  async findByUuid(uuid: string): Promise<AIGenerationTaskServerDTO | null> {
    const record = await this.prisma.aiGenerationTask.findUnique({
      where: { uuid },
    });

    return record ? this.toServerDTO(record) : null;
  }

  /**
   * 根据账户 UUID 查找所有任务
   */
  async findByAccountUuid(accountUuid: string): Promise<AIGenerationTaskServerDTO[]> {
    const records = await this.prisma.aiGenerationTask.findMany({
      where: { accountUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toServerDTO(r));
  }

  /**
   * 根据任务类型查找任务
   */
  async findByTaskType(
    accountUuid: string,
    taskType: GenerationTaskType,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const records = await this.prisma.aiGenerationTask.findMany({
      where: { accountUuid, taskType, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toServerDTO(r));
  }

  /**
   * 根据状态查找任务
   */
  async findByStatus(
    accountUuid: string,
    status: TaskStatus,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const records = await this.prisma.aiGenerationTask.findMany({
      where: { accountUuid, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toServerDTO(r));
  }

  /**
   * 查找最近的任务（分页）
   */
  async findRecent(
    accountUuid: string,
    limit: number,
    offset: number = 0,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const records = await this.prisma.aiGenerationTask.findMany({
      where: { accountUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return records.map((r) => this.toServerDTO(r));
  }

  /**
   * 删除任务（软删除）
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.aiGenerationTask.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 检查任务是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.aiGenerationTask.count({
      where: { uuid, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * 映射：Prisma Model → ServerDTO
   */
  private toServerDTO(record: any): AIGenerationTaskServerDTO {
    // 映射枚举
    let taskType: GenerationTaskType;
    switch (record.taskType) {
      case 'GENERATE_KEY_RESULTS':
        taskType = GenerationTaskType.GENERATE_KEY_RESULTS;
        break;
      case 'GENERATE_TASK_TEMPLATE':
        taskType = GenerationTaskType.GENERATE_TASK_TEMPLATE;
        break;
      case 'GENERATE_KNOWLEDGE_DOCUMENT':
        taskType = GenerationTaskType.GENERATE_KNOWLEDGE_DOCUMENT;
        break;
      default:
        taskType = GenerationTaskType.GENERATE_KEY_RESULTS;
    }

    let status: TaskStatus;
    switch (record.status) {
      case 'PENDING':
        status = TaskStatus.PENDING;
        break;
      case 'IN_PROGRESS':
        status = TaskStatus.IN_PROGRESS;
        break;
      case 'COMPLETED':
        status = TaskStatus.COMPLETED;
        break;
      case 'FAILED':
        status = TaskStatus.FAILED;
        break;
      default:
        status = TaskStatus.PENDING;
    }

    return {
      uuid: record.uuid,
      accountUuid: record.accountUuid,
      taskType,
      status,
      input: record.input,
      result: record.result || undefined,
      error: record.error || undefined,
      retryCount: record.retryCount,
      tokenUsage: record.tokenUsage ? JSON.parse(record.tokenUsage) : undefined,
      processingMs: record.processingMs || undefined,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
      completedAt: record.completedAt ? record.completedAt.getTime() : undefined,
      deletedAt: record.deletedAt ? record.deletedAt.getTime() : undefined,
    };
  }
}




