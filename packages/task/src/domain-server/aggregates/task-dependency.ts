/**
 * TaskDependency Aggregate
 * 任务依赖关系聚合
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  TaskDependencyServerDTO,
} from '@dailyuse/contracts/task';
import { TaskDependencyId } from '../../domain-shared/value-objects/task-dependency-id';
import {
  DependencyType,
  DependencyStatus,
} from '../value-objects';

/**
 * Internal props interface for TaskDependency
 */
interface TaskDependencyState {
  id: TaskDependencyId;
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
  lagDays: number | undefined;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TaskDependency 聚合根 - 服务端
 * 表示两个任务之间的依赖关系
 */
export class TaskDependency extends AggregateRoot<TaskDependencyId> {
  private _props: TaskDependencyState;

  private constructor(id: TaskDependencyId, props: TaskDependencyState) {
    super(id);
    this._props = props;
  }

  // ============ Getters ============

  get predecessorTaskId(): string {
    return this._props.predecessorTaskId;
  }

  get successorTaskId(): string {
    return this._props.successorTaskId;
  }

  get dependencyType(): DependencyType {
    return this._props.dependencyType;
  }

  get lagDays(): number | undefined {
    return this._props.lagDays;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ============ Factory Methods ============

  /**
   * 创建新的 TaskDependency
   */
  public static create(props: {
    id?: string;
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType?: DependencyType;
    lagDays?: number;
  }): TaskDependency {
    if (!props.predecessorTaskId || !props.successorTaskId) {
      throw new Error('Dependency must include predecessor and successor task IDs');
    }
    if (props.predecessorTaskId === props.successorTaskId) {
      throw new Error('Task cannot depend on itself');
    }
    const id = props.id ? TaskDependencyId.of(props.id) : TaskDependencyId.generate();
    const now = new Date();

    return new TaskDependency(id, {
      id,
      predecessorTaskId: props.predecessorTaskId,
      successorTaskId: props.successorTaskId,
      dependencyType: props.dependencyType ?? DependencyType.FinishToStart,
      lagDays: props.lagDays,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 DTO 还原
   */
  public static fromDTO(dto: TaskDependencyServerDTO): TaskDependency {
    const id = TaskDependencyId.of(dto.id);
    return new TaskDependency(id, {
      id,
      predecessorTaskId: dto.predecessorTaskId,
      successorTaskId: dto.successorTaskId,
      dependencyType: dto.dependencyType,
      lagDays: dto.lagDays,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ============ Business Methods ============

  /**
   * 更新依赖类型
   */
  public updateDependencyType(dependencyType: DependencyType): void {
    this._props.dependencyType = dependencyType;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新延迟天数
   */
  public updateLagDays(lagDays: number | undefined): void {
    this._props.lagDays = lagDays;
    this._props.updatedAt = new Date();
  }

  /**
   * 检查是否为自依赖（无效的依赖）
   */
  public isSelfDependency(): boolean {
    return this._props.predecessorTaskId === this._props.successorTaskId;
  }

  // ============ Serialization ============

  /**
   * 转换为 DTO
   */
  public toDTO(): TaskDependencyServerDTO {
    return {
      id: this.id.toString(),
      predecessorTaskId: this._props.predecessorTaskId,
      successorTaskId: this._props.successorTaskId,
      dependencyType: this._props.dependencyType,
      lagDays: this._props.lagDays,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
