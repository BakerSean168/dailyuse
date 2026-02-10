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

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<any | null> {
    return this.goals.get(uuid) || null;
  }

  async findByAccountUuid(accountUuid: string, options?: any): Promise<any[]> {
    return Array.from(this.goals.values()).filter((g) => g.accountUuid === accountUuid);
  }

  async findByFolderUuid(folderUuid: string): Promise<any[]> {
    return Array.from(this.goals.values()).filter((g) => g.folderUuid === folderUuid);
  }

  async save(goal: any): Promise<void> {
    this.goals.set(goal.uuid, goal);
  }

  async delete(uuid: string): Promise<void> {
    this.goals.delete(uuid);
  }

  async softDelete(uuid: string): Promise<void> {
    const goal = this.goals.get(uuid);
    if (goal) {
      goal.deletedAt = new Date();
      this.goals.set(uuid, goal);
    }
  }

  async exists(uuid: string): Promise<boolean> {
    return this.goals.has(uuid);
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    uuids.forEach((uuid) => {
      const goal = this.goals.get(uuid);
      if (goal) {
        goal.status = status;
        this.goals.set(uuid, goal);
      }
    });
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    uuids.forEach((uuid) => {
      const goal = this.goals.get(uuid);
      if (goal) {
        goal.folderUuid = folderUuid;
        this.goals.set(uuid, goal);
      }
    });
  }

  // Test helpers
  clear(): void {
    this.goals.clear();
  }

  seed(goals: any[]): void {
    goals.forEach((g) => this.goals.set(g.uuid, g));
  }
}
