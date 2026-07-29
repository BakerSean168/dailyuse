import { randomUUID } from 'node:crypto';
import type { ITaskDependencyRepository } from '../../../domain/repositories/i-task-dependency-repository';
import type { DependencyType, TaskDependencyServerDTO } from '@memoflow/contracts/task';
import type { TaskDependencyId, IdentityId, TaskTemplateId } from '@memoflow/contracts/primitives';
import {
  PowerSyncTaskDependencyMapper,
  type PowerSyncTaskDependencyRow,
} from './mappers/powersync-task-dependency.mapper';
import { TaskDependency } from '../../../domain/aggregates/task-dependency';
import { createEventBusAdapter, publishAggregateEvents } from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';

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

  async findByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncTaskDependencyRow>(
      'SELECT * FROM task_dependencies WHERE id = ? AND identity_id = ? LIMIT 1',
      [id, identityId],
    );
    return row ? PowerSyncTaskDependencyMapper.toDTO(row) : null;
  }

  async findBySuccessorId(
    taskId: string,
    identityId: string,
  ): Promise<TaskDependencyServerDTO[]> {
    return this.query(
      'SELECT * FROM task_dependencies WHERE successor_task_id = ? AND identity_id = ? ORDER BY created_at ASC',
      [taskId, identityId],
    );
  }

  async findByPredecessorId(
    taskId: string,
    identityId: string,
  ): Promise<TaskDependencyServerDTO[]> {
    return this.query(
      'SELECT * FROM task_dependencies WHERE predecessor_task_id = ? AND identity_id = ? ORDER BY created_at ASC',
      [taskId, identityId],
    );
  }

  async findByPredecessorAndSuccessorId(
    predecessorId: string,
    successorId: string,
    identityId: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncTaskDependencyRow>(
      'SELECT * FROM task_dependencies WHERE predecessor_task_id = ? AND successor_task_id = ? AND identity_id = ? LIMIT 1',
      [predecessorId, successorId, identityId],
    );
    return row ? PowerSyncTaskDependencyMapper.toDTO(row) : null;
  }

  async findAllPredecessorIds(taskId: string, identityId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.walkPredecessors(taskId, identityId, visited, result);
    return result;
  }

  async findAllSuccessorIds(taskId: string, identityId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.walkSuccessors(taskId, identityId, visited, result);
    return result;
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Task dependency not found for the current identity.');
    }
    await this.db.execute(
      'DELETE FROM task_dependencies WHERE id = ? AND identity_id = ?',
      [id, identityId],
    );
  }

  async deleteAggregate(dependency: TaskDependency): Promise<void> {
    await this.db.execute(
      'DELETE FROM task_dependencies WHERE id = ? AND identity_id = ?',
      [dependency.id, dependency.identityId],
    );
    await publishAggregateEvents(dependency, eventBusAdapter);
  }

  async findAggregateById(identityId: string, id: string): Promise<TaskDependency | null> {
    const row = await this.db.getOptional<PowerSyncTaskDependencyRow>(
      'SELECT * FROM task_dependencies WHERE id = ? AND identity_id = ? LIMIT 1',
      [id, identityId],
    );
    return row ? PowerSyncTaskDependencyMapper.toAggregate(row) : null;
  }

  async deleteByTaskId(identityId: string, taskId: string): Promise<void> {
    await this.db.execute(
      'DELETE FROM task_dependencies WHERE identity_id = ? AND (predecessor_task_id = ? OR successor_task_id = ?)',
      [identityId, taskId, taskId],
    );
  }

  async update(
    identityId: string,
    id: string,
    data: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<TaskDependencyServerDTO> {
    await this.db.execute(
      `UPDATE task_dependencies
       SET dependency_type = COALESCE(?, dependency_type),
           lag_days = COALESCE(?, lag_days),
           updated_at = ?
       WHERE id = ? AND identity_id = ?`,
      [
        data.dependencyType ?? null,
        data.lagDays ?? null,
        new Date().toISOString(),
        id,
        identityId,
      ],
    );

    const dependency = await this.findByIdForIdentity(identityId, id);
    if (!dependency) {
      throw new Error('Task dependency not found for the current identity.');
    }
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
    identityId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    const dependencies = await this.findBySuccessorId(taskId, identityId);
    for (const dependency of dependencies) {
      if (!result.includes(dependency.predecessorTaskId)) {
        result.push(dependency.predecessorTaskId);
      }
      await this.walkPredecessors(dependency.predecessorTaskId, identityId, visited, result);
    }
  }

  private async walkSuccessors(
    taskId: string,
    identityId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    const dependencies = await this.findByPredecessorId(taskId, identityId);
    for (const dependency of dependencies) {
      if (!result.includes(dependency.successorTaskId)) {
        result.push(dependency.successorTaskId);
      }
      await this.walkSuccessors(dependency.successorTaskId, identityId, visited, result);
    }
  }

  private async query(sql: string, params: unknown[]): Promise<TaskDependencyServerDTO[]> {
    const rows = await this.db.getAll<PowerSyncTaskDependencyRow>(sql, params);
    return rows.map((row) => PowerSyncTaskDependencyMapper.toDTO(row));
  }
}
