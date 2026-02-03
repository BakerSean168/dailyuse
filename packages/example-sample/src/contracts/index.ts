/**
 * Contracts Layer - 契约层
 * 
 * 【业务场景：待办事项（Todo）】
 * 一个简单的待办事项管理，用于展示代码规范。
 * 
 * 【层级职责】
 * 定义跨层通信的数据结构，是各层之间的"合同"。
 * 这里只有纯类型定义（interface/type），没有运行时代码。
 * 
 * 【设计原则】
 * 1. 纯数据结构：只包含 interface 和 type
 * 2. 无副作用：不依赖外部库（除 zod 用于 API 验证）
 * 3. 版本稳定：作为契约，变更需谨慎
 */

// ============================================================
// 1. 原始类型（Primitives）- 基础类型别名
// ============================================================

/**
 * 【规范：Branded Type（品牌类型）】
 * 为原始类型添加"品牌"，防止混淆不同用途的 ID
 * 
 * @example
 * ```typescript
 * const todoId: TodoId = 'todo_123' as TodoId;
 * const userId: UserId = 'user_456' as UserId;
 * // todoId = userId; // ❌ 编译错误！类型不兼容
 * ```
 */
export type TodoId = string & { readonly __brand: 'TodoId' };
export type UserId = string & { readonly __brand: 'UserId' };

/**
 * 【规范：时间类型防腐层（ACL）】
 * 不同层使用不同的时间表示，通过类型别名明确语义：
 * - TransferDate: number（Unix 时间戳，用于 API 传输）
 * - DomainDate: Date（用于业务逻辑计算）
 * - PersistenceDate: Date（数据库存储）
 */
export type TransferDate = number;
export type DomainDate = Date;
export type PersistenceDate = Date;

// ============================================================
// 2. 值对象类型（Value Objects）- 枚举和复合值
// ============================================================

/**
 * 【规范：使用 const object 代替 enum】
 * 优点：
 * - 更好的 Tree-Shaking
 * - 运行时可访问值列表
 * - 类型推断更友好
 */
export const TodoStatus = {
  Pending: 'pending',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;

export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];

/**
 * 任务优先级
 */
export const TodoPriority = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;

export type TodoPriority = (typeof TodoPriority)[keyof typeof TodoPriority];

// ============================================================
// 3. DTO 定义（Data Transfer Objects）
// ============================================================

/**
 * 【规范：DTO 分层】
 * 
 * ClientDTO: 前端展示用，包含格式化后的数据
 * ServerDTO: 服务间通信，时间用 number（TransferDate）
 * PersistenceDTO: 数据库存储，对应 ORM 模型
 */

/**
 * 客户端 DTO - 用于前端展示
 * 时间已格式化为字符串，便于直接渲染
 */
export interface TodoClientDTO {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string | null;  // ISO 格式字符串
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 服务端 DTO - 用于 API 传输
 * 时间使用 number（Unix 时间戳）便于跨平台传输
 */
export interface TodoServerDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: TransferDate | null;
  completedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * 持久化 DTO - 用于数据库操作
 * 字段命名对应数据库列
 */
export interface TodoPersistenceDTO {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  due_date: PersistenceDate | null;
  completed_at: PersistenceDate | null;
  created_at: PersistenceDate;
  updated_at: PersistenceDate;
}

// ============================================================
// 4. 领域事件（Domain Events）
// ============================================================

/**
 * 【规范：领域事件】
 * 事件名使用 "模块:动作" 格式，如 "todo:created"
 * 事件负载包含该事件所需的最小信息
 */

export interface TodoCreatedEvent {
  todoId: TodoId;
  userId: UserId;
  title: string;
  createdAt: TransferDate;
}

export interface TodoCompletedEvent {
  todoId: TodoId;
  completedAt: TransferDate;
}

export interface TodoStatusChangedEvent {
  todoId: TodoId;
  oldStatus: TodoStatus;
  newStatus: TodoStatus;
  changedAt: TransferDate;
}

/**
 * 【规范：事件映射表】
 * 统一管理模块内所有事件的类型映射
 */
export interface TodoEventMap {
  'todo:created': TodoCreatedEvent;
  'todo:completed': TodoCompletedEvent;
  'todo:status-changed': TodoStatusChangedEvent;
}

// ============================================================
// 5. API Schema（使用 Zod）
// ============================================================

import { z } from 'zod';

/**
 * 【规范：Zod Schema 用于 API 验证】
 * - 定义请求/响应的验证规则
 * - 自动推导 TypeScript 类型
 * - 可生成 OpenAPI 文档
 */

export const CreateTodoSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200字'),
  description: z.string().max(2000).nullable().optional(),
  priority: z.nativeEnum(TodoPriority).optional().default(TodoPriority.Medium),
  dueDate: z.number().nullable().optional(),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.nativeEnum(TodoPriority).optional(),
  dueDate: z.number().nullable().optional(),
});

export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;

export const TodoQuerySchema = z.object({
  status: z.nativeEnum(TodoStatus).optional(),
  priority: z.nativeEnum(TodoPriority).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type TodoQueryInput = z.infer<typeof TodoQuerySchema>;
