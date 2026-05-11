import { randomUUID } from 'node:crypto';
import type { ITaskDependencyRepository } from '../../../domain-server/repositories/ITaskDependencyRepository';
import type { DependencyType, TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { TaskDependencyId, IdentityId, TaskTemplateId } from '@dailyuse/contracts/primitives';
import {
  PowerSyncTaskDependencyMapper,
  type PowerSyncTaskDependencyRow,
} from './mappers/powersync-task-dependency.mapper';
import { TaskDependency } from '../../../domain-server/aggregates/task-dependency';
import { createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

const eventBusAdapter = createEventBusAdapter(eventBus);

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class PowerSyncTaskDependencyRepository implements ITaskDependencyRepository {
  constructor(private readonly db: Queryable) {}

  async create(data: {
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType?: DependencyType;
    lagDays?: number;
    identityId: string;
  }): Promise<TaskDependencyServerDTO> {
    const now = new Date().toISOString();
    const id = randomUUID();
    await this.db.execute(
      `INSERT INTO task_dependencies (
        id, identity_id, predecessor_task_id, successor_task_id, dependency_type, lag_days,
        version, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        id,
        data.identityId,
        data.predecessorTaskId,
        data.successorTaskId,
        data.dependencyType ?? 'FinishToStart',
        data.lagDays ?? null,
        1,
        now,
        now,
      ],
    );

    return {
      id: id as TaskDependencyId,
      identityId: data.identityId as IdentityId,
      predecessorTaskId: data.predecessorTaskId as TaskTemplateId,
      successorTaskId: data.successorTaskId as TaskTemplateId,
      dependencyType: (data.dependencyType ?? 'FinishToStart') as DependencyType,
      lagDays: data.lagDays,
      createdAt: new Date(now).getTime(),
      updatedAt: new Date(now).getTime(),
    };
  }

  async findById(id: string): Promise<TaskDependencyServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncTaskDependencyRow>(
      'SELECT * FROM task_dependencies WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? PowerSyncTaskDependencyMapper.toDTO(row) : null;
  }

  async findBySuccessorId(taskId: string): Promise<TaskDependencyServerDTO[]> {
    return this.query(
      'SELECT * FROM task_dependencies WHERE successor_task_id = ? ORDER BY created_at ASC',
      [taskId],
    );
  }

  async findByPredecessorId(taskId: string): Promise<TaskDependencyServerDTO[]> {
    return this.query(
      'SELECT * FROM task_dependencies WHERE predecessor_task_id = ? ORDER BY created_at ASC',
      [taskId],
    );
  }

  async findByPredecessorAndSuccessorId(
    predecessorId: string,
    successorId: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncTaskDependencyRow>(
      'SELECT * FROM task_dependencies WHERE predecessor_task_id = ? AND successor_task_id = ? LIMIT 1',
      [predecessorId, successorId],
    );
    return row ? PowerSyncTaskDependencyMapper.toDTO(row) : null;
  }

  async findAllPredecessorIds(taskId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.walkPredecessors(taskId, visited, result);
    return result;
  }

  async findAllSuccessorIds(taskId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.walkSuccessors(taskId, visited, result);
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM task_dependencies WHERE id = ?', [id]);
  }

  async deleteAggregate(dependency: TaskDependency): Promise<void> {
    await this.db.execute('DELETE FROM task_dependencies WHERE id = ?', [dependency.id]);
    await publishAggregateEvents(dependency, eventBusAdapter);
  }

  async findAggregateById(id: string): Promise<TaskDependency | null> {
    const row = await this.db.getOptional<PowerSyncTaskDependencyRow>(
      'SELECT * FROM task_dependencies WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? PowerSyncTaskDependencyMapper.toAggregate(row) : null;
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.db.execute(
      'DELETE FROM task_dependencies WHERE predecessor_task_id = ? OR successor_task_id = ?',
      [taskId, taskId],
    );
  }

  async update(
    id: string,
    data: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<TaskDependencyServerDTO> {
    await this.db.execute(
      `UPDATE task_dependencies
       SET dependency_type = COALESCE(?, dependency_type),
           lag_days = COALESCE(?, lag_days),
           updated_at = ?
       WHERE id = ?`,
      [data.dependencyType ?? null, data.lagDays ?? null, new Date().toISOString(), id],
    );

    const dependency = await this.findById(id);
    if (!dependency) throw new Error(`Dependency not found: ${id}`);
    return dependency;
  }

  async findAllByIdentityId(identityId: string): Promise<TaskDependencyServerDTO[]> {
    return this.query(
      'SELECT * FROM task_dependencies WHERE identity_id = ? ORDER BY created_at ASC',
      [identityId],
    );
  }

  private async walkPredecessors(
    taskId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    const dependencies = await this.findBySuccessorId(taskId);
    for (const dependency of dependencies) {
      if (!result.includes(dependency.predecessorTaskId)) {
        result.push(dependency.predecessorTaskId);
      }
      await this.walkPredecessors(dependency.predecessorTaskId, visited, result);
    }
  }

  private async walkSuccessors(
    taskId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    const dependencies = await this.findByPredecessorId(taskId);
    for (const dependency of dependencies) {
      if (!result.includes(dependency.successorTaskId)) {
        result.push(dependency.successorTaskId);
      }
      await this.walkSuccessors(dependency.successorTaskId, visited, result);
    }
  }

  private async query(sql: string, params: unknown[]): Promise<TaskDependencyServerDTO[]> {
    const rows = await this.db.getAll<PowerSyncTaskDependencyRow>(sql, params);
    return rows.map((row) => PowerSyncTaskDependencyMapper.toDTO(row));
  }
}
