/**
 * Task Query Parameter Validator
 * Story 2.5: 支持排序参数和过滤选项 - 后端扩展
 *
 * 用途：验证 sortBy 和 filterBy 参数的有效性
 * 负责确保 API 接收到的查询参数符合预期的枚举值
 */

/**
 * Task Sort By options
 */
export const TaskSortBy = {
  PRIORITY: 'priority',
  DUE_DATE: 'dueDate',
  CREATED_AT: 'createdAt',
  IMPORTANCE: 'importance',
} as const;
export type TaskSortBy = (typeof TaskSortBy)[keyof typeof TaskSortBy];

/**
 * Task Filter By options
 */
export const TaskFilterBy = {
  // Importance-based
  IMPORTANCE_VITAL: 'importance:vital',
  IMPORTANCE_IMPORTANT: 'importance:important',
  IMPORTANCE_MODERATE: 'importance:moderate',
  IMPORTANCE_MINOR: 'importance:minor',
  IMPORTANCE_TRIVIAL: 'importance:trivial',
  // Status-based
  STATUS_ACTIVE: 'status:active',
  STATUS_COMPLETED: 'status:completed',
  STATUS_BLOCKED: 'status:blocked',
  STATUS_CANCELLED: 'status:cancelled',
  // Time-based
  DUE_DATE_OVERDUE: 'dueDate:overdue',
  DUE_DATE_TODAY: 'dueDate:today',
  DUE_DATE_UPCOMING: 'dueDate:upcoming',
  DUE_DATE_NO_DUE_DATE: 'dueDate:noDueDate',
} as const;
export type TaskFilterBy = (typeof TaskFilterBy)[keyof typeof TaskFilterBy];

/**
 * 任务查询参数验证器
 *
 * 统一验证 API 查询参数中的 sortBy 和 filterBy 值
 * 抛出清晰的错误消息供前端使用
 */
export class TaskQueryValidator {
  /**
   * 有效的 sortBy 值列表
   */
  private static readonly VALID_SORT_BY = [
    TaskSortBy.PRIORITY,
    TaskSortBy.DUE_DATE,
    TaskSortBy.CREATED_AT,
    TaskSortBy.IMPORTANCE,
  ];

  /**
   * 有效的 filterBy 值列表
   */
  private static readonly VALID_FILTER_BY = [
    // Importance-based
    TaskFilterBy.IMPORTANCE_VITAL,
    TaskFilterBy.IMPORTANCE_IMPORTANT,
    TaskFilterBy.IMPORTANCE_MODERATE,
    TaskFilterBy.IMPORTANCE_MINOR,
    TaskFilterBy.IMPORTANCE_TRIVIAL,
    // Status-based
    TaskFilterBy.STATUS_ACTIVE,
    TaskFilterBy.STATUS_COMPLETED,
    TaskFilterBy.STATUS_BLOCKED,
    TaskFilterBy.STATUS_CANCELLED,
    // Time-based
    TaskFilterBy.DUE_DATE_OVERDUE,
    TaskFilterBy.DUE_DATE_TODAY,
    TaskFilterBy.DUE_DATE_UPCOMING,
    TaskFilterBy.DUE_DATE_NO_DUE_DATE,
  ];

  /**
   * 验证 sortBy 参数
   *
   * @param sortBy 排序字段（可选）
   * @returns 有效的 sortBy 值或 null（如果未提供）
   * @throws Error 如果提供的值无效
   */
  static validateSortBy(sortBy?: string): TaskSortBy | null {
    if (!sortBy) {
      return null;
    }

    if (!this.VALID_SORT_BY.includes(sortBy as TaskSortBy)) {
      throw new Error(
        `Invalid sortBy value: "${sortBy}". Allowed values: ${this.VALID_SORT_BY.join(', ')}`
      );
    }

    return sortBy as TaskSortBy;
  }

  /**
   * 验证 filterBy 参数（可能是单个字符串或数组）
   *
   * @param filterBy 单个过滤条件或数组（可选）
   * @returns 有效的 filterBy 值数组（如果未提供则返回空数组）
   * @throws Error 如果任何值无效
   */
  static validateFilterBy(filterBy?: string | string[]): TaskFilterBy[] {
    if (!filterBy) {
      return [];
    }

    const filters = Array.isArray(filterBy) ? filterBy : [filterBy];

    for (const filter of filters) {
      if (!this.VALID_FILTER_BY.includes(filter as TaskFilterBy)) {
        throw new Error(
          `Invalid filterBy value: "${filter}". Allowed values: ${this.VALID_FILTER_BY.join(', ')}`
        );
      }
    }

    return filters as TaskFilterBy[];
  }

  /**
   * 验证所有查询参数
   *
   * @param sortBy 排序字段（可选）
   * @param filterBy 过滤条件（可选）
   * @returns { sortBy?: TaskSortBy, filterBy: TaskFilterBy[] }
   * @throws Error 如果任何参数无效
   */
  static validate(sortBy?: string, filterBy?: string | string[]) {
    return {
      sortBy: this.validateSortBy(sortBy),
      filterBy: this.validateFilterBy(filterBy),
    };
  }

  /**
   * 获取 sortBy 的有效值列表
   */
  static getSortByOptions(): TaskSortBy[] {
    return [...this.VALID_SORT_BY];
  }

  /**
   * 获取 filterBy 的有效值列表
   */
  static getFilterByOptions(): TaskFilterBy[] {
    return [...this.VALID_FILTER_BY];
  }
}
