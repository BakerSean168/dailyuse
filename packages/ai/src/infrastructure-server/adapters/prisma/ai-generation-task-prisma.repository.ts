/**
 * AIGenerationTask Prisma Repository
 *
 * Prisma implementation of IAIGenerationTaskRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient, AiGenerationTask as PrismaAiGenerationTask } from '@dailyuse/database';
import type { IAIGenerationTaskRepository } from '../../../domain-server';
import type { AIGenerationTaskServerDTO } from '@dailyuse/contracts/ai';
import { TaskStatus, GenerationTaskType } from '@dailyuse/contracts/ai';
import { AIProvider, AIModel } from '@dailyuse/contracts/ai';

/**
 * AIGenerationTask Prisma Repository
 *
 * Prisma implementation of IAIGenerationTaskRepository.
 */
export class AIGenerationTaskPrismaRepository implements IAIGenerationTaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    const input = this.buildInputPayload(task);
    const completedAt = task.processingCompletedAt ? new Date(task.processingCompletedAt) : null;
    const processingMs =
      task.processingStartedAt && task.processingCompletedAt
        ? Math.max(0, task.processingCompletedAt - task.processingStartedAt)
        : null;

    await this.prisma.aiGenerationTask.upsert({
      where: { id: String(task.id) },
      create: {
        id: String(task.id),
        identityId: String(task.identityId),
        taskType: task.type,
        status: task.status,
        input: JSON.stringify(input),
        result: task.result ? JSON.stringify(task.result) : null,
        error: task.errorMessage,
        retryCount: task.retryCount,
        tokenUsage: task.tokenUsage ? JSON.stringify(task.tokenUsage) : null,
        processingMs,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt,
        deletedAt: null,
      },
      update: {
        taskType: task.type,
        status: task.status,
        input: JSON.stringify(input),
        result: task.result ? JSON.stringify(task.result) : null,
        error: task.errorMessage,
        retryCount: task.retryCount,
        tokenUsage: task.tokenUsage ? JSON.stringify(task.tokenUsage) : null,
        processingMs,
        updatedAt: new Date(task.updatedAt),
        completedAt,
      },
    });
  }

  async findById(id: string): Promise<AIGenerationTaskServerDTO | null> {
    const row = await this.prisma.aiGenerationTask.findFirst({
      where: { id, deletedAt: null },
    });

    return row ? this.toServerDTO(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<AIGenerationTaskServerDTO[]> {
    const rows = await this.prisma.aiGenerationTask.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row: PrismaAiGenerationTask) => this.toServerDTO(row));
  }

  async findByTaskType(identityId: string, taskType: GenerationTaskType): Promise<AIGenerationTaskServerDTO[]> {
    const rows = await this.prisma.aiGenerationTask.findMany({
      where: { identityId, taskType, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row: PrismaAiGenerationTask) => this.toServerDTO(row));
  }

  async findByStatus(identityId: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    const rows = await this.prisma.aiGenerationTask.findMany({
      where: { identityId, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row: PrismaAiGenerationTask) => this.toServerDTO(row));
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIGenerationTaskServerDTO[]> {
    const rows = await this.prisma.aiGenerationTask.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset ?? 0,
    });

    return rows.map((row: PrismaAiGenerationTask) => this.toServerDTO(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aiGenerationTask.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.aiGenerationTask.count({
      where: { id, deletedAt: null },
    });

    return count > 0;
  }

  private buildInputPayload(task: AIGenerationTaskServerDTO): Record<string, unknown> {
    return {
      data: task.input,
      meta: {
        conversationId: task.conversationId,
        provider: task.provider,
        model: task.model,
        maxRetries: task.maxRetries,
        processingStartedAt: task.processingStartedAt,
      },
    };
  }

  private toServerDTO(row: PrismaAiGenerationTask): AIGenerationTaskServerDTO {
    const parsedInput = this.parseJson<Record<string, any>>(row.input, {});
    const inputData = parsedInput?.data ?? parsedInput ?? {};
    const inputMeta = parsedInput?.meta ?? {};
    const processingCompletedAt = row.completedAt ? new Date(row.completedAt).getTime() : null;

    let processingStartedAt: number | null =
      typeof inputMeta.processingStartedAt === 'number' ? inputMeta.processingStartedAt : null;

    if (processingStartedAt == null && processingCompletedAt != null && typeof row.processingMs === 'number') {
      processingStartedAt = processingCompletedAt - row.processingMs;
    }

    return {
      id: row.id,
      identityId: row.identityId,
      conversationId: inputMeta.conversationId ?? null,
      type: row.taskType as GenerationTaskType,
      status: row.status as TaskStatus,
      provider: inputMeta.provider ?? AIProvider.OpenAI,
      model: inputMeta.model ?? AIModel.Gpt4Turbo,
      input: inputData,
      result: this.parseJson(row.result, null),
      tokenUsage: this.parseJson(row.tokenUsage, null),
      errorMessage: row.error,
      retryCount: row.retryCount,
      maxRetries: inputMeta.maxRetries ?? 3,
      processingStartedAt,
      processingCompletedAt,
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }

  private parseJson<T>(value: string | null, fallback: T): T {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
}
