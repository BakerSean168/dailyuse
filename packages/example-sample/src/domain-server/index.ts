/**
 * Domain Server Layer - 服务端领域层
 * 
 * 【层级职责】
 * 服务端专用的领域模型，是业务逻辑的核心。
 * 采用 "Rich Domain Model"（充血模型）设计。
 * 
 * 【设计原则】
 * 1. 封装状态：所有状态修改通过业务方法
 * 2. 强制不变量：确保对象始终处于合法状态
 * 3. 发出事件：重要变更时发出领域事件
 * 4. 无基础设施：不包含 SQL、HTTP 等
 */

import type {
  TodoId,
  UserId,
  TodoStatus,
  TodoPriority,
  TodoServerDTO,
  TodoPersistenceDTO,
  TodoEventMap,
  DomainDate,
  TransferDate,
} from '../contracts';
import { TodoStatus as TodoStatusConst, TodoPriority as TodoPriorityConst } from '../contracts';
import { TodoIdFactory, TodoStatusLogic } from '../domain-shared';

// ============================================================
// 1. 聚合根（Aggregate Root）
// ============================================================

/**
 * Todo 聚合根
 * 
 * 【规范：聚合根设计】
 * - 构造函数私有，通过工厂方法创建
 * - 状态通过 getter 暴露（只读）
 * - 状态修改通过业务方法（如 complete(), updateTitle()）
 * - 业务方法遵循 Check-Act-Event 模式
 */
export class Todo {
  // ================= 内部状态（Private）=================
  private _id: TodoId;
  private _userId: UserId;
  private _title: string;
  private _description: string | null;
  private _status: TodoStatus;
  private _priority: TodoPriority;
  private _dueDate: DomainDate | null;
  private _completedAt: DomainDate | null;
  private _createdAt: DomainDate;
  private _updatedAt: DomainDate;

  // 领域事件队列
  private _domainEvents: Array<{ type: string; payload: unknown }> = [];

  // ================= 构造函数（Private）=================
  /**
   * 【规范】构造函数必须私有
   * 禁止外部 new Todo(...)，只能通过工厂方法创建
   */
  private constructor(props: {
    id: TodoId;
    userId: UserId;
    title: string;
    description: string | null;
    status: TodoStatus;
    priority: TodoPriority;
    dueDate: DomainDate | null;
    completedAt: DomainDate | null;
    createdAt: DomainDate;
    updatedAt: DomainDate;
  }) {
    this._id = props.id;
    this._userId = props.userId;
    this._title = props.title;
    this._description = props.description;
    this._status = props.status;
    this._priority = props.priority;
    this._dueDate = props.dueDate;
    this._completedAt = props.completedAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ================= 只读属性（Getters）=================
  get id(): TodoId { return this._id; }
  get userId(): UserId { return this._userId; }
  get title(): string { return this._title; }
  get description(): string | null { return this._description; }
  get status(): TodoStatus { return this._status; }
  get priority(): TodoPriority { return this._priority; }
  get dueDate(): DomainDate | null { return this._dueDate; }
  get completedAt(): DomainDate | null { return this._completedAt; }
  get createdAt(): DomainDate { return this._createdAt; }
  get updatedAt(): DomainDate { return this._updatedAt; }

  // ================= 工厂方法（Factories）=================

  /**
   * 创建新的 Todo
   * 
   * 【规范：业务工厂方法】
   * - 用于创建新实体
   * - 包含业务校验
   * - 发出 Created 事件
   */
  public static create(params: {
    userId: UserId;
    title: string;
    description?: string | null;
    priority?: TodoPriority;
    dueDate?: Date | null;
  }): Todo {
    // 1. 校验
    if (!params.title?.trim()) {
      throw new Error('Todo 标题不能为空');
    }
    if (params.title.length > 200) {
      throw new Error('Todo 标题不能超过 200 字');
    }

    // 2. 创建实例
    const now = new Date();
    const todo = new Todo({
      id: TodoIdFactory.generate(),
      userId: params.userId,
      title: params.title.trim(),
      description: params.description ?? null,
      status: TodoStatusConst.Pending,
      priority: params.priority ?? TodoPriorityConst.Medium,
      dueDate: params.dueDate ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // 3. 发出事件
    todo.addDomainEvent('todo:created', {
      todoId: todo._id,
      userId: todo._userId,
      title: todo._title,
      createdAt: now.getTime(),
    } satisfies TodoEventMap['todo:created']);

    return todo;
  }

  /**
   * 从持久化数据恢复
   * 
   * 【规范：重建工厂方法】
   * - 用于从数据库恢复实体
   * - 不包含业务校验（数据已持久化，假定合法）
   * - 不发出事件
   */
  public static fromPersistence(dto: TodoPersistenceDTO): Todo {
    return new Todo({
      id: dto.id as TodoId,
      userId: dto.user_id as UserId,
      title: dto.title,
      description: dto.description,
      status: dto.status as TodoStatus,
      priority: dto.priority as TodoPriority,
      dueDate: dto.due_date,
      completedAt: dto.completed_at,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    });
  }

  // ================= 业务方法（遵循 Check-Act-Event）=================

  /**
   * 更新标题
   * 
   * 【规范：业务方法流程】
   * 1. Check：检查业务规则
   * 2. Act：修改内部状态
   * 3. Event：发出领域事件（可选）
   */
  public updateTitle(newTitle: string): void {
    // 1. Check
    if (!TodoStatusLogic.isEditable(this._status)) {
      throw new Error(`状态 ${this._status} 下不可编辑`);
    }
    if (!newTitle?.trim()) {
      throw new Error('标题不能为空');
    }
    if (newTitle.length > 200) {
      throw new Error('标题不能超过 200 字');
    }

    // 2. Act
    this._title = newTitle.trim();
    this._updatedAt = new Date();

    // 3. Event（标题更新通常不需要事件，这里省略）
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string | null): void {
    if (!TodoStatusLogic.isEditable(this._status)) {
      throw new Error(`状态 ${this._status} 下不可编辑`);
    }

    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * 开始处理
   */
  public start(): void {
    if (!TodoStatusLogic.canTransitionTo(this._status, TodoStatusConst.InProgress)) {
      throw new Error(`不能从 ${this._status} 转换到 in_progress`);
    }

    const oldStatus = this._status;
    this._status = TodoStatusConst.InProgress;
    this._updatedAt = new Date();

    this.addDomainEvent('todo:status-changed', {
      todoId: this._id,
      oldStatus,
      newStatus: this._status,
      changedAt: this._updatedAt.getTime(),
    } satisfies TodoEventMap['todo:status-changed']);
  }

  /**
   * 完成
   */
  public complete(): void {
    if (!TodoStatusLogic.canTransitionTo(this._status, TodoStatusConst.Completed)) {
      throw new Error(`不能从 ${this._status} 转换到 completed`);
    }

    const now = new Date();
    this._status = TodoStatusConst.Completed;
    this._completedAt = now;
    this._updatedAt = now;

    this.addDomainEvent('todo:completed', {
      todoId: this._id,
      completedAt: now.getTime(),
    } satisfies TodoEventMap['todo:completed']);
  }

  /**
   * 取消
   */
  public cancel(): void {
    if (!TodoStatusLogic.canTransitionTo(this._status, TodoStatusConst.Cancelled)) {
      throw new Error(`不能从 ${this._status} 转换到 cancelled`);
    }

    const oldStatus = this._status;
    this._status = TodoStatusConst.Cancelled;
    this._updatedAt = new Date();

    this.addDomainEvent('todo:status-changed', {
      todoId: this._id,
      oldStatus,
      newStatus: this._status,
      changedAt: this._updatedAt.getTime(),
    } satisfies TodoEventMap['todo:status-changed']);
  }

  /**
   * 重新开始（从已取消状态恢复）
   */
  public reopen(): void {
    if (!TodoStatusLogic.canTransitionTo(this._status, TodoStatusConst.Pending)) {
      throw new Error(`不能从 ${this._status} 重新开始`);
    }

    const oldStatus = this._status;
    this._status = TodoStatusConst.Pending;
    this._completedAt = null;
    this._updatedAt = new Date();

    this.addDomainEvent('todo:status-changed', {
      todoId: this._id,
      oldStatus,
      newStatus: this._status,
      changedAt: this._updatedAt.getTime(),
    } satisfies TodoEventMap['todo:status-changed']);
  }

  // ================= 序列化（Serialization）=================

  /**
   * 转换为持久化 DTO
   */
  public toPersistence(): TodoPersistenceDTO {
    return {
      id: this._id,
      user_id: this._userId,
      title: this._title,
      description: this._description,
      status: this._status,
      priority: this._priority,
      due_date: this._dueDate,
      completed_at: this._completedAt,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  /**
   * 转换为 ServerDTO（用于 API 响应）
   */
  public toServerDTO(): TodoServerDTO {
    return {
      id: this._id,
      userId: this._userId,
      title: this._title,
      description: this._description,
      status: this._status,
      priority: this._priority,
      dueDate: this._dueDate?.getTime() ?? null,
      completedAt: this._completedAt?.getTime() ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  // ================= 领域事件（Domain Events）=================

  private addDomainEvent<T>(type: string, payload: T): void {
    this._domainEvents.push({ type, payload });
  }

  /**
   * 获取并清空领域事件
   * 【规范】Repository 保存后调用此方法发布事件
   */
  public pullDomainEvents(): Array<{ type: string; payload: unknown }> {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}

// ============================================================
// 2. 仓储接口（Repository Interface）
// ============================================================

/**
 * Todo 仓储接口
 * 
 * 【规范：依赖倒置】
 * - 接口定义在 domain 层
 * - 实现在 infrastructure 层
 * - 使用值对象作为参数（TodoId 而非 string）
 * - 返回领域对象（Todo 而非 DTO）
 */
export interface ITodoRepository {
  /**
   * 保存（新增或更新）
   */
  save(todo: Todo): Promise<void>;

  /**
   * 根据 ID 查找
   */
  findById(id: TodoId): Promise<Todo | null>;

  /**
   * 根据用户 ID 查找列表
   */
  findByUserId(
    userId: UserId,
    options?: {
      status?: TodoStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Todo[]>;

  /**
   * 删除
   */
  delete(id: TodoId): Promise<void>;

  /**
   * 统计用户的 Todo 数量
   */
  countByUserId(userId: UserId): Promise<number>;
}

/**
 * DI 注入 Token
 */
export const TODO_REPOSITORY_TOKEN = Symbol('ITodoRepository');

// ============================================================
// 3. 领域服务（Domain Service）
// ============================================================

/**
 * Todo 领域服务
 * 
 * 【规范：何时使用 Domain Service】
 * - 跨聚合根的操作
 * - 需要调用 Repository
 * - 逻辑不属于任何单个聚合根
 */
export class TodoDomainService {
  constructor(private readonly todoRepository: ITodoRepository) {}

  /**
   * 批量完成
   * 
   * 【示例：跨实体操作】
   * 需要加载多个实体并分别处理
   */
  async batchComplete(
    ids: TodoId[],
    actorId: UserId
  ): Promise<{ success: TodoId[]; failed: Array<{ id: TodoId; reason: string }> }> {
    const success: TodoId[] = [];
    const failed: Array<{ id: TodoId; reason: string }> = [];

    for (const id of ids) {
      try {
        const todo = await this.todoRepository.findById(id);

        if (!todo) {
          failed.push({ id, reason: '不存在' });
          continue;
        }

        // 权限检查
        if (todo.userId !== actorId) {
          failed.push({ id, reason: '无权限' });
          continue;
        }

        // 执行业务操作
        todo.complete();
        await this.todoRepository.save(todo);

        success.push(id);
      } catch (error) {
        failed.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return { success, failed };
  }

  /**
   * 检查用户配额
   */
  async canCreateMore(userId: UserId, maxTodos = 100): Promise<boolean> {
    const count = await this.todoRepository.countByUserId(userId);
    return count < maxTodos;
  }
}
