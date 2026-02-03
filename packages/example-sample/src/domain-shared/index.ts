/**
 * Domain Shared Layer - 共享领域层
 * 
 * 【层级职责】
 * 包含可在前后端共享的领域概念的运行时实现。
 * 主要是值对象（Value Objects）的类实现。
 * 
 * 【值对象 vs 实体】
 * - 值对象：无唯一标识，通过属性值判等（如：金额、颜色、状态）
 * - 实体：有唯一标识，通过 ID 判等（如：用户、订单）
 * 
 * 【设计原则】
 * 1. 不可变性：值对象创建后不可修改
 * 2. 自验证：构造时校验，确保始终合法
 * 3. 无副作用：纯粹的数据和行为
 */

import type { TodoId, UserId, TodoStatus, TodoPriority } from '../contracts';
import { TodoStatus as TodoStatusConst, TodoPriority as TodoPriorityConst } from '../contracts';

// ============================================================
// 1. ID 值对象
// ============================================================

/**
 * 【规范：ID 工厂函数】
 * 提供类型安全的 ID 创建和验证
 */
export const TodoIdFactory = {
  /**
   * 生成新的 Todo ID
   */
  generate(): TodoId {
    return `todo_${crypto.randomUUID()}` as TodoId;
  },

  /**
   * 从字符串创建 TodoId（带验证）
   */
  from(value: string): TodoId {
    if (!value || !value.startsWith('todo_')) {
      throw new Error(`Invalid TodoId format: ${value}`);
    }
    return value as TodoId;
  },

  /**
   * 安全地尝试转换，失败返回 null
   */
  tryFrom(value: unknown): TodoId | null {
    if (typeof value !== 'string' || !value.startsWith('todo_')) {
      return null;
    }
    return value as TodoId;
  },
};

export const UserIdFactory = {
  generate(): UserId {
    return `user_${crypto.randomUUID()}` as UserId;
  },

  from(value: string): UserId {
    if (!value || !value.startsWith('user_')) {
      throw new Error(`Invalid UserId format: ${value}`);
    }
    return value as UserId;
  },
};

// ============================================================
// 2. 状态值对象（带业务规则）
// ============================================================

/**
 * 【规范：状态机逻辑】
 * 状态转换规则应该封装在值对象中，而不是散落在各处
 */
export const TodoStatusLogic = {
  /**
   * 状态转换规则表
   * 定义从每个状态可以转换到哪些状态
   */
  transitions: {
    [TodoStatusConst.Pending]: [TodoStatusConst.InProgress, TodoStatusConst.Cancelled],
    [TodoStatusConst.InProgress]: [TodoStatusConst.Pending, TodoStatusConst.Completed, TodoStatusConst.Cancelled],
    [TodoStatusConst.Completed]: [], // 已完成不可再转换
    [TodoStatusConst.Cancelled]: [TodoStatusConst.Pending], // 已取消可以重新开始
  } as Record<TodoStatus, TodoStatus[]>,

  /**
   * 检查是否可以从一个状态转换到另一个状态
   */
  canTransitionTo(from: TodoStatus, to: TodoStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  },

  /**
   * 获取当前状态可转换到的所有状态
   */
  getNextStates(current: TodoStatus): TodoStatus[] {
    return this.transitions[current] ?? [];
  },

  /**
   * 是否可编辑（只有进行中和待处理可以编辑）
   */
  isEditable(status: TodoStatus): boolean {
    return status === TodoStatusConst.Pending || status === TodoStatusConst.InProgress;
  },

  /**
   * 是否是终态
   */
  isFinal(status: TodoStatus): boolean {
    return status === TodoStatusConst.Completed || status === TodoStatusConst.Cancelled;
  },
};

// ============================================================
// 3. 优先级值对象
// ============================================================

export const TodoPriorityLogic = {
  /**
   * 获取优先级标签
   */
  getLabel(priority: TodoPriority): string {
    switch (priority) {
      case TodoPriorityConst.Low:
        return '低';
      case TodoPriorityConst.Medium:
        return '中';
      case TodoPriorityConst.High:
        return '高';
      default:
        return '未知';
    }
  },

  /**
   * 获取排序权重（高优先级排前面）
   */
  getSortWeight(priority: TodoPriority): number {
    return -priority; // 负数让高优先级排前面
  },

  /**
   * 比较两个优先级
   */
  compare(a: TodoPriority, b: TodoPriority): number {
    return b - a; // 降序，高优先级在前
  },
};

// ============================================================
// 4. 复合值对象示例
// ============================================================

/**
 * 【规范：复合值对象】
 * 当多个属性总是一起出现时，可以封装为值对象
 */
export interface TodoSummary {
  readonly totalCount: number;
  readonly completedCount: number;
  readonly pendingCount: number;
  readonly inProgressCount: number;
}

export const TodoSummaryFactory = {
  create(params: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  }): TodoSummary {
    return Object.freeze({
      totalCount: params.total,
      completedCount: params.completed,
      pendingCount: params.pending,
      inProgressCount: params.inProgress,
    });
  },

  /**
   * 计算完成率
   */
  getCompletionRate(summary: TodoSummary): number {
    if (summary.totalCount === 0) return 0;
    return Math.round((summary.completedCount / summary.totalCount) * 100);
  },
};
