/**
 * Goal Memory Repository
 *
 * In-memory implementation of IGoalRepository for testing.
 */

import type { IGoalRepository } from '../../ports/goal-repository.port';

/**
 * Goal Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class GoalMemoryRepository implements IGoalRepository {
  private goals = new Map<string, any>();

  async findById(id: string, options?: { includeChildren?: boolean }): Promise<any | null> {
    return this.goals.get(id) || null;
  }

  async findByAccountId(identityId: string, options?: any): Promise<any[]> {
    return Array.from(this.goals.values()).filter((g) => g.identityId === identityId);
  }

  async findByFolderId(folderId: string): Promise<any[]> {
    return Array.from(this.goals.values()).filter((g) => g.folderId === folderId);
  }

  async save(goal: any): Promise<void> {
    this.goals.set(goal.id, goal);
  }

  async delete(id: string): Promise<void> {
    this.goals.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    const goal = this.goals.get(id);
    if (goal) {
      goal.deletedAt = new Date();
      this.goals.set(id, goal);
    }
  }

  async exists(id: string): Promise<boolean> {
    return this.goals.has(id);
  }

  async batchUpdateStatus(ids: string[], status: string): Promise<void> {
    ids.forEach((id) => {
      const goal = this.goals.get(id);
      if (goal) {
        goal.status = status;
        this.goals.set(id, goal);
      }
    });
  }

  async batchMoveToFolder(ids: string[], folderId: string | null): Promise<void> {
    ids.forEach((id) => {
      const goal = this.goals.get(id);
      if (goal) {
        goal.folderId = folderId;
        this.goals.set(id, goal);
      }
    });
  }

  // Test helpers
  clear(): void {
    this.goals.clear();
  }

  seed(goals: any[]): void {
    goals.forEach((g) => this.goals.set(g.id, g));
  }
}
