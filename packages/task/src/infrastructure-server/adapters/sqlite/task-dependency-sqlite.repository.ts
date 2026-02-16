/**
 * SQLite TaskDependency Repository Implementation
 * 浠诲姟渚濊禆鍏崇郴鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import type {
  ITaskDependencyRepository,
} from '../../../domain-server/repositories/ITaskDependencyRepository';
import type {
  CreateTaskDependencyRequest,
  TaskDependencyServerDTO,
  CircularDependencyValidationResult,
} from '@dailyuse/contracts/task';

export class SqliteTaskDependencyRepository implements ITaskDependencyRepository {
  constructor(private db: Database.Database) {}

  async create(data: CreateTaskDependencyRequest): Promise<TaskDependencyServerDTO> {
    const stmt = this.db.prepare(`
      INSERT INTO task_dependencies (
        id, identityId, predecessor_id, successor_id,
        dependency_type, lag_days, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || this.generateUuid();
    const now = Date.now();

    stmt.run(
      id,
      data.identityId,
      data.predecessor_id,
      data.successor_id,
      data.dependency_type || 'FINISH_TO_START',
      data.lag_days || 0,
      now,
      now,
    );

    return {
      id,
      identity_id: data.identityId,
      predecessor_id: data.predecessor_id,
      successor_id: data.successor_id,
      dependency_type: data.dependency_type || 'FINISH_TO_START',
      lag_days: data.lag_days || 0,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async findById(id: string): Promise<TaskDependencyServerDTO | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_dependencies WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findBySuccessor(taskId: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE successor_id = ? ORDER BY createdAt ASC`
    );
    const rows = stmt.all(taskId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByPredecessor(taskId: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE predecessor_id = ? ORDER BY createdAt ASC`
    );
    const rows = stmt.all(taskId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByPredecessorAndSuccessor(
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

  async findAllPredecessors(taskId: string): Promise<string[]> {
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

  async findAllSuccessors(taskId: string): Promise<string[]> {
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

  async deleteByTask(taskId: string): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM task_dependencies WHERE predecessor_id = ? OR successor_id = ?`
    );
    stmt.run(taskId, taskId);
  }

  async update(
    id: string,
    data: { dependencyType?: string; lagDays?: number },
  ): Promise<TaskDependencyServerDTO> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.dependencyType !== undefined) {
      updates.push('dependency_type = ?');
      values.push(data.dependencyType);
    }

    if (data.lagDays !== undefined) {
      updates.push('lag_days = ?');
      values.push(data.lagDays);
    }

    updates.push('updatedAt = ?');
    values.push(Date.now());
    values.push(id);

    if (updates.length === 1) {
      // Only updatedAt, just update it
      const stmt = this.db.prepare(
        `UPDATE task_dependencies SET updatedAt = ? WHERE id = ?`
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

  async findAllByAccount(identityId: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE identityId = ? ORDER BY createdAt ASC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  private rowToDTO(row: any): TaskDependencyServerDTO {
    return {
      id: row.id,
      identity_id: row.identityId,
      predecessor_id: row.predecessor_id,
      successor_id: row.successor_id,
      dependency_type: row.dependency_type,
      lag_days: row.lag_days,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private generateUuid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

