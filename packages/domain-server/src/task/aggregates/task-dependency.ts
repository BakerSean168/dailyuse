/**
 * TaskDependency Aggregate
 * 任务依赖关系聚合
 */

import { AggregateRoot, generateUUID } from '@dailyuse/utils';
import type {
  TaskDependencyServerDTO,
} from '@dailyuse/contracts/task';
import {
  TaskDependencyId,
  DependencyType,
  DependencyStatus,
} from '../value-objects';

/**
 * TaskDependency 聚合根 - 服务端
 * 表示两个任务之间的依赖关系
 */
export class TaskDependency extends AggregateRoot<string> {
  private constructor(
    id: string,
    private readonly _predecessorTaskId: string,
    private readonly _successorTaskId: string,
    private _dependencyType: DependencyType,
    private _lagDays: number | undefined,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super(id);
  }

  // ============ Getters ============

  get predecessorTaskId(): string {
    return this._predecessorTaskId;
  }

  get successorTaskId(): string {
    return this._successorTaskId;
  }

  get dependencyType(): DependencyType {
    return this._dependencyType;
  }

  get lagDays(): number | undefined {
    return this._lagDays;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
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
    const id = props.id ?? generateUUID();
    const now = new Date();

    return new TaskDependency(
      id,
      props.predecessorTaskId,
      props.successorTaskId,
      props.dependencyType ?? DependencyType.FinishToStart,
      props.lagDays,
      now,
      now
    );
  }

  /**
   * 从 DTO 还原
   */
  public static fromDTO(dto: TaskDependencyServerDTO): TaskDependency {
    return new TaskDependency(
      dto.id,
      dto.predecessorTaskId,
      dto.successorTaskId,
      dto.dependencyType,
      dto.lagDays,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  // ============ Business Methods ============

  /**
   * 更新依赖类型
   */
  public updateDependencyType(dependencyType: DependencyType): void {
    this._dependencyType = dependencyType;
    this._updatedAt = new Date();
  }

  /**
   * 更新延迟天数
   */
  public updateLagDays(lagDays: number | undefined): void {
    this._lagDays = lagDays;
    this._updatedAt = new Date();
  }

  /**
   * 检查是否为自依赖（无效的依赖）
   */
  public isSelfDependency(): boolean {
    return this._predecessorTaskId === this._successorTaskId;
  }

  // ============ Serialization ============

  /**
   * 转换为 DTO
   */
  public toDTO(): TaskDependencyServerDTO {
    return {
      id: this.id.toString(),
      predecessorTaskId: this._predecessorTaskId,
      successorTaskId: this._successorTaskId,
      dependencyType: this._dependencyType,
      lagDays: this._lagDays,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }
}
