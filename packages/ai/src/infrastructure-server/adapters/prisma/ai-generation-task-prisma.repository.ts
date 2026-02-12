/**
 * AIGenerationTask Prisma Repository
 *
 * Prisma implementation of IAIGenerationTaskRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAIGenerationTaskRepository } from '../../ports/ai-generation-task-repository.port';
import type { AIGenerationTaskServerDTO, TaskStatus, GenerationTaskType } from '@dailyuse/contracts/ai';

/**
 * AIGenerationTask Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AIGenerationTaskPrismaRepository implements IAIGenerationTaskRepository {
  constructor(private readonly prisma: any) {}

  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByUuid(uuid: string): Promise<AIGenerationTaskServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(accountUuid: string): Promise<AIGenerationTaskServerDTO[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByTaskType(accountUuid: string, taskType: GenerationTaskType): Promise<AIGenerationTaskServerDTO[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByStatus(accountUuid: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findRecent(accountUuid: string, limit: number, offset?: number): Promise<AIGenerationTaskServerDTO[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
