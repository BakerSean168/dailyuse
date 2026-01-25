/**
 * TaskDependency 聚合根实现 (Server)
 * 任务依赖关系 - 聚合根
 */

import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import { DependencyType } from '@dailyuse/contracts/task';
import { AggregateRoot } from '@dailyuse/utils';

/**
 * TaskDependency 构造函数参数
 */
interface TaskDependencyProps {
  predecessorTaskUuid: string;
  successorTaskUuid: string;
  dependencyType: DependencyType;
  lagDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TaskDependency 聚合根
 *
 * DDD 聚合根职责：
 * - 管理任务之间的依赖关系
 * - 验证依赖关系的有效性
 * - 是事务边界
 * 
 * TODO: 在 contracts 中定义 TaskDependencyServer 接口后实现
 */
export class TaskDependency extends AggregateRoot {
  // ===== 私有字段 =====
  private _predecessorTaskUuid: string;
  private _successorTaskUuid: string;
  private _dependencyType: DependencyType;
  private _lagDays: number | undefined;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(props: TaskDependencyProps, uuid?: string) {
    super(uuid || AggregateRoot.generateUUID());
    this._predecessorTaskUuid = props.predecessorTaskUuid;
    this._successorTaskUuid = props.successorTaskUuid;
    this._dependencyType = props.dependencyType;
    this._lagDays = props.lagDays;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }

  public get predecessorTaskUuid(): string {
    return this._predecessorTaskUuid;
  }

  public get successorTaskUuid(): string {
    return this._successorTaskUuid;
  }

  public get dependencyType(): DependencyType {
    return this._dependencyType;
  }

  public get lagDays(): number | undefined {
    return this._lagDays;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的任务依赖关系
   */
  public static create(params: {
    predecessorTaskUuid: string;
    successorTaskUuid: string;
    dependencyType: DependencyType;
    lagDays?: number;
  }): TaskDependency {
    const now = new Date();

    // 验证：不能自己依赖自己
    if (params.predecessorTaskUuid === params.successorTaskUuid) {
      throw new Error('Task cannot depend on itself');
    }

    // 验证：延迟天数不能为负数
    if (params.lagDays !== undefined && params.lagDays < 0) {
      throw new Error('Lag days cannot be negative');
    }

    const dependency = new TaskDependency(
      {
        predecessorTaskUuid: params.predecessorTaskUuid,
        successorTaskUuid: params.successorTaskUuid,
        dependencyType: params.dependencyType,
        lagDays: params.lagDays,
        createdAt: now,
        updatedAt: now,
      },
      AggregateRoot.generateUUID(),
    );

    // 发布领域事件
    dependency.addDomainEvent({
      eventType: 'task.dependency.created',
      aggregateId: dependency.uuid,
      occurredOn: now,
      payload: {
        predecessorTaskUuid: params.predecessorTaskUuid,
        successorTaskUuid: params.successorTaskUuid,
        dependencyType: params.dependencyType,
      },
    });

    return dependency;
  }

  /**
   * 从 ServerDTO 创建实体
   */
  public static fromServerDTO(dto: TaskDependencyServerDTO): TaskDependency {
    return new TaskDependency(
      {
        predecessorTaskUuid: dto.predecessorTaskUuid,
        successorTaskUuid: dto.successorTaskUuid,
        dependencyType: dto.dependencyType,
        lagDays: dto.lagDays,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      dto.uuid,
    );
  }

  /**
   * 从 PersistenceDTO 恢复实体
   */
  public static fromPersistenceDTO(dto: {
    uuid: string;
    predecessorTaskUuid: string;
    successorTaskUuid: string;
    dependencyType: DependencyType;
    lagDays?: number;
    createdAt: number;
    updatedAt: number;
  }): TaskDependency {
    return new TaskDependency(
      {
        predecessorTaskUuid: dto.predecessorTaskUuid,
        successorTaskUuid: dto.successorTaskUuid,
        dependencyType: dto.dependencyType,
        lagDays: dto.lagDays,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      dto.uuid,
    );
  }

  // ===== 业务方法 =====

  /**
   * 更新依赖类型
   */
  public updateDependencyType(dependencyType: DependencyType): void {
    if (this._dependencyType === dependencyType) {
      return; // 没有变化
    }

    this._dependencyType = dependencyType;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'task.dependency.updated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        dependencyType,
      },
    });
  }

  /**
   * 更新延迟天数
   */
  public updateLagDays(lagDays: number | undefined): void {
    if (lagDays !== undefined && lagDays < 0) {
      throw new Error('Lag days cannot be negative');
    }

    if (this._lagDays === lagDays) {
      return; // 没有变化
    }

    this._lagDays = lagDays;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'task.dependency.updated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        lagDays,
      },
    });
  }

  /**
   * 检查是否涉及某个任务
   */
  public involvesTasks(taskUuid: string): boolean {
    return this._predecessorTaskUuid === taskUuid || this._successorTaskUuid === taskUuid;
  }

  /**
   * 检查是否是特定任务的前置依赖
   */
  public isPredecessorOf(taskUuid: string): boolean {
    return this._successorTaskUuid === taskUuid;
  }

  /**
   * 检查是否是特定任务的后续依赖
   */
  public isSuccessorOf(taskUuid: string): boolean {
    return this._predecessorTaskUuid === taskUuid;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): TaskDependencyServerDTO {
    return {
      uuid: this._uuid,
      predecessorTaskUuid: this._predecessorTaskUuid,
      successorTaskUuid: this._successorTaskUuid,
      dependencyType: this._dependencyType,
      lagDays: this._lagDays,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Persistence DTO (数据库)
   */
  public toPersistenceDTO(): {
    uuid: string;
    predecessorTaskUuid: string;
    successorTaskUuid: string;
    dependencyType: DependencyType;
    lagDays?: number;
    createdAt: number;
    updatedAt: number;
  } {
    return {
      uuid: this._uuid,
      predecessorTaskUuid: this._predecessorTaskUuid,
      successorTaskUuid: this._successorTaskUuid,
      dependencyType: this._dependencyType,
      lagDays: this._lagDays,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }
}
