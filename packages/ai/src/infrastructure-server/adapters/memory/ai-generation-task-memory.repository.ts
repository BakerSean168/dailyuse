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
    this.tasks.set(task.id, task);
  }

  async findById(id: string): Promise<AIGenerationTaskServerDTO | null> {
    return this.tasks.get(id) ?? null;
  }

  async findByAccountId(identityId: string): Promise<AIGenerationTaskServerDTO[]> {
    return Array.from(this.tasks.values()).filter((t) => t.identityId === identityId);
  }

  async findByTaskType(identityId: string, taskType: GenerationTaskType): Promise<AIGenerationTaskServerDTO[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.identityId === identityId && t.type === taskType,
    );
  }

  async findByStatus(identityId: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.identityId === identityId && t.status === status,
    );
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIGenerationTaskServerDTO[]> {
    const filtered = Array.from(this.tasks.values())
      .filter((t) => t.identityId === identityId)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return filtered.slice(offset ?? 0, (offset ?? 0) + limit);
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.tasks.has(id);
  }

  // Test helpers
  clear(): void {
    this.tasks.clear();
  }

  seed(tasks: AIGenerationTaskServerDTO[]): void {
    tasks.forEach((t) => this.tasks.set(t.id, t));
  }
}
