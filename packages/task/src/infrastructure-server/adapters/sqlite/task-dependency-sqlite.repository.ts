/**
 * SQLite TaskDependency Repository Implementation
 * 浠诲姟渚濊禆鍏崇郴鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import type {
  ITaskDependencyRepository,
} from '@/domain-server/repositories/ITaskDependencyRepository';
import type {
  CreateTaskDependencyRequest,
  TaskDependencyServerDTO,
  DependencyType,
} from '@dailyuse/contracts/task';

export class SqliteTaskDependencyRepository implements ITaskDependencyRepository {
  constructor(private db: Database.Database) {}

  private rowToDTO(row: any): TaskDependencyServerDTO {
    return {
      id: row.id,
      predecessorTaskId: row.predecessor_id,
      successorTaskId: row.successor_id,
      dependencyType: row.dependency_type,
      lagDays: row.lag_days ?? undefined,
      createdAt: Number(row.created_at ?? row.createdAt),
      updatedAt: Number(row.updated_at ?? row.updatedAt),
    };
  }

  async create(data: {
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType?: DependencyType;
    lagDays?: number;
  }): Promise<TaskDependencyServerDTO> {
    const stmt = this.db.prepare(`
      INSERT INTO task_dependencies (
        id, identity_id, predecessor_id, successor_id,
        dependency_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const id = this.generateId();
    const now = Date.now();

    stmt.run(
      id,
      'system',
      data.predecessorTaskId,
      data.successorTaskId,
      data.dependencyType || 'FinishToStart',
      now,
      now,
    );

    return {
      id,
      predecessorTaskId: data.predecessorTaskId,
      successorTaskId: data.successorTaskId,
      dependencyType: data.dependencyType || 'FinishToStart',
      lagDays: data.lagDays,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: string): Promise<TaskDependencyServerDTO | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_dependencies WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findBySuccessorId(taskId: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE successor_id = ? ORDER BY created_at ASC`
    );
    const rows = stmt.all(taskId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByPredecessorId(taskId: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE predecessor_id = ? ORDER BY created_at ASC`
    );
    const rows = stmt.all(taskId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByPredecessorAndSuccessorId(
    predecessorId: string,
    successorId: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE predecessor_id = ? AND successor_id = ? LIMIT 1`
    );
    const row = stmt.get(predecessorId, successorId) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findAllPredecessorIds(taskId: string): Promise<string[]> {
    const result: Set<string> = new Set();
    const queue: string[] = [taskId];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const stmt = this.db.prepare(
        `SELECT predecessor_id FROM task_dependencies WHERE successor_id = ?`
      );
      const rows = stmt.all(current) as any[];

      for (const row of rows) {
        if (!visited.has(row.predecessor_id)) {
          result.add(row.predecessor_id);
          queue.push(row.predecessor_id);
        }
      }
    }

    return Array.from(result);
  }

  async findAllSuccessorIds(taskId: string): Promise<string[]> {
    const result: Set<string> = new Set();
    const queue: string[] = [taskId];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const stmt = this.db.prepare(
        `SELECT successor_id FROM task_dependencies WHERE predecessor_id = ?`
      );
      const rows = stmt.all(current) as any[];

      for (const row of rows) {
        if (!visited.has(row.successor_id)) {
          result.add(row.successor_id);
          queue.push(row.successor_id);
        }
      }
    }

    return Array.from(result);
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_dependencies WHERE id = ?`);
    stmt.run(id);
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM task_dependencies WHERE predecessor_id = ? OR successor_id = ?`
    );
    stmt.run(taskId, taskId);
  }

  async update(
    id: string,
    data: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<TaskDependencyServerDTO> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.dependencyType !== undefined) {
      updates.push('dependency_type = ?');
      values.push(data.dependencyType);
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    if (updates.length === 1) {
      // Only updatedAt, just update it
      const stmt = this.db.prepare(
        `UPDATE task_dependencies SET updated_at = ? WHERE id = ?`
      );
      stmt.run(Date.now(), id);
    } else {
      const stmt = this.db.prepare(
        `UPDATE task_dependencies SET ${updates.join(', ')} WHERE id = ?`
      );
      stmt.run(...values);
    }

    const dependency = await this.findById(id);
    if (!dependency) {
      throw new Error(`Dependency not found: ${id}`);
    }

    return dependency;
  }

  async findAllByIdentityId(identityId: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE identity_id = ? ORDER BY created_at ASC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

