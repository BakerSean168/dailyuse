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
        uuid, accountUuid, predecessor_uuid, successor_uuid,
        dependency_type, lag_days, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const uuid = data.uuid || this.generateUuid();
    const now = Date.now();

    stmt.run(
      uuid,
      data.accountUuid,
      data.predecessor_uuid,
      data.successor_uuid,
      data.dependency_type || 'FINISH_TO_START',
      data.lag_days || 0,
      now,
      now,
    );

    return {
      uuid,
      account_uuid: data.accountUuid,
      predecessor_uuid: data.predecessor_uuid,
      successor_uuid: data.successor_uuid,
      dependency_type: data.dependency_type || 'FINISH_TO_START',
      lag_days: data.lag_days || 0,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async findByUuid(uuid: string): Promise<TaskDependencyServerDTO | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_dependencies WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findBySuccessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE successor_uuid = ? ORDER BY createdAt ASC`
    );
    const rows = stmt.all(taskUuid) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByPredecessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE predecessor_uuid = ? ORDER BY createdAt ASC`
    );
    const rows = stmt.all(taskUuid) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByPredecessorAndSuccessor(
    predecessorUuid: string,
    successorUuid: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE predecessor_uuid = ? AND successor_uuid = ? LIMIT 1`
    );
    const row = stmt.get(predecessorUuid, successorUuid) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findAllPredecessors(taskUuid: string): Promise<string[]> {
    const result: Set<string> = new Set();
    const queue: string[] = [taskUuid];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const stmt = this.db.prepare(
        `SELECT predecessor_uuid FROM task_dependencies WHERE successor_uuid = ?`
      );
      const rows = stmt.all(current) as any[];

      for (const row of rows) {
        if (!visited.has(row.predecessor_uuid)) {
          result.add(row.predecessor_uuid);
          queue.push(row.predecessor_uuid);
        }
      }
    }

    return Array.from(result);
  }

  async findAllSuccessors(taskUuid: string): Promise<string[]> {
    const result: Set<string> = new Set();
    const queue: string[] = [taskUuid];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const stmt = this.db.prepare(
        `SELECT successor_uuid FROM task_dependencies WHERE predecessor_uuid = ?`
      );
      const rows = stmt.all(current) as any[];

      for (const row of rows) {
        if (!visited.has(row.successor_uuid)) {
          result.add(row.successor_uuid);
          queue.push(row.successor_uuid);
        }
      }
    }

    return Array.from(result);
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_dependencies WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByTask(taskUuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM task_dependencies WHERE predecessor_uuid = ? OR successor_uuid = ?`
    );
    stmt.run(taskUuid, taskUuid);
  }

  async update(
    uuid: string,
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
    values.push(uuid);

    if (updates.length === 1) {
      // Only updatedAt, just update it
      const stmt = this.db.prepare(
        `UPDATE task_dependencies SET updatedAt = ? WHERE uuid = ?`
      );
      stmt.run(Date.now(), uuid);
    } else {
      const stmt = this.db.prepare(
        `UPDATE task_dependencies SET ${updates.join(', ')} WHERE uuid = ?`
      );
      stmt.run(...values);
    }

    const dependency = await this.findByUuid(uuid);
    if (!dependency) {
      throw new Error(`Dependency not found: ${uuid}`);
    }

    return dependency;
  }

  async findAllByAccount(accountUuid: string): Promise<TaskDependencyServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_dependencies WHERE accountUuid = ? ORDER BY createdAt ASC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  private rowToDTO(row: any): TaskDependencyServerDTO {
    return {
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      predecessor_uuid: row.predecessor_uuid,
      successor_uuid: row.successor_uuid,
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

