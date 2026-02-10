/**
 * AIGenerationTask Memory Repository
 *
 * In-memory implementation of IAIGenerationTaskRepository for testing.
 */

import type { IAIGenerationTaskRepository } from '../../ports/ai-generation-task-repository.port';
import type { AIGenerationTaskServerDTO, TaskStatus, GenerationTaskType } from '@dailyuse/contracts/ai';

/**
 * AIGenerationTask Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIGenerationTaskMemoryRepository implements IAIGenerationTaskRepository {
  private tasks = new Map<string, AIGenerationTaskServerDTO>();

  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    this.tasks.set(task.uuid, task);
  }

  async findByUuid(uuid: string): Promise<AIGenerationTaskServerDTO | null> {
    return this.tasks.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string): Promise<AIGenerationTaskServerDTO[]> {
    return Array.from(this.tasks.values()).filter((t) => t.accountUuid === accountUuid);
  }

  async findByTaskType(accountUuid: string, taskType: GenerationTaskType): Promise<AIGenerationTaskServerDTO[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.accountUuid === accountUuid && t.type === taskType,
    );
  }

  async findByStatus(accountUuid: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.accountUuid === accountUuid && t.status === status,
    );
  }

  async findRecent(accountUuid: string, limit: number, offset?: number): Promise<AIGenerationTaskServerDTO[]> {
    const filtered = Array.from(this.tasks.values())
      .filter((t) => t.accountUuid === accountUuid)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return filtered.slice(offset ?? 0, (offset ?? 0) + limit);
  }

  async delete(uuid: string): Promise<void> {
    this.tasks.delete(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    return this.tasks.has(uuid);
  }

  // Test helpers
  clear(): void {
    this.tasks.clear();
  }

  seed(tasks: AIGenerationTaskServerDTO[]): void {
    tasks.forEach((t) => this.tasks.set(t.uuid, t));
  }
}
