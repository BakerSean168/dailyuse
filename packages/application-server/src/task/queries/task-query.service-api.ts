/**
 * Task Query Service
 * Story 2.5: 支持排序参数和过滤选项 - 后端扩展
 *
 * 负责�?
 * - 查询任务列表（支持排序和过滤�?
 * - 计算任务优先�?
 * - 应用多种排序策略
 * - 应用多种过滤条件
 *
 * 依赖�?
 * - Story 2.1: 优先级计算逻辑
 * - Story 2.2: API 集成
 */

import type {
  ITaskTemplateRepository,
  TaskTemplate,
} from '@dailyuse/domain-server/task';
import {
  TaskTemplateStatus,
  TaskSortBy,
  TaskFilterBy,
  type TaskTemplateServerDTO,
  type TaskTemplateClientDTO,
} from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';

/**
 * 任务查询服务
 *
 * 提供灵活的任务查询、排序和过滤功能
 */
export class TaskQueryService {
  private static instance: TaskQueryService;
  private templateRepository: ITaskTemplateRepository;

  private constructor(templateRepository: ITaskTemplateRepository) {
    this.templateRepository = templateRepository;
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static async createInstance(
    templateRepository?: ITaskTemplateRepository
  ): Promise<TaskQueryService> {
    const container = TaskContainer.getInstance();
    const templateRepo = templateRepository || container.getTaskTemplateRepository();

    TaskQueryService.instance = new TaskQueryService(templateRepo);
    return TaskQueryService.instance;
  }

  /**
   * 获取服务单例
   */
  static async getInstance(): Promise<TaskQueryService> {
    if (!TaskQueryService.instance) {
      TaskQueryService.instance = await TaskQueryService.createInstance();
    }
    return TaskQueryService.instance;
  }

  /**
   * 按指定字段和过滤条件查询任务
   *
   * 流程:
   * 1. 获取所有活跃任�?
   * 2. 转换�?DTO 并计算优先级
   * 3. 按过滤条件过�?
   * 4. 按排序字段排�?
   *
   * @param accountUuid 账户 UUID
   * @param sortBy 排序字段 (default: priority)
   * @param filterBy 过滤条件数组 (AND 关系)
   * @param currentTime 当前时间（用于优先级计算和相对日期过滤）
   * @returns 排序和过滤后的任�?DTO 数组（包�?priority 字段�?
   */
  async getTasksWithSortingAndFiltering(
    accountUuid: string,
    sortBy: TaskSortBy = TaskSortBy.PRIORITY,
    filterBy: TaskFilterBy[] = [],
    currentTime: Date = new Date()
  ): Promise<Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>> {
    // Step 1: 获取所有活跃任�?
    const templates = await this.getAllActiveTemplates(accountUuid);

    // Step 2: 转换�?DTO 并计算优先级
    const dtos = templates.map((t) => t.toServerDTO());
    const enriched = this.enrichWithPriority(dtos, currentTime);

    // Step 3: 按过滤条件过�?
    let filtered = enriched;
    if (filterBy.length > 0) {
      filtered = this.applyFilters(enriched, filterBy, currentTime);
    }

    // Step 4: 按排序字段排�?
    return this.applySort(filtered, sortBy, currentTime);
  }

  /**
   * 计算单个任务的优先级
   *
   * 公式: priority = (importance * 0.6) + (timeRemaining * 0.4)
   * 范围: 0-100
   *
   * @param importance 重要性等级（转换为数值）
   * @param dueDate 截止日期（毫秒时间戳，null 表示无期限）
   * @param currentTime 当前时间
   * @returns 优先级分�?(0-100)
   */
  private calculatePriority(
    importance: ImportanceLevel,
    dueDate: number | null,
    currentTime: Date
  ): number {
    // 重要性映射到数值（0-100�?
    const importanceMap: Record<ImportanceLevel, number> = {
      [ImportanceLevel.Trivial]: 20,
      [ImportanceLevel.Minor]: 40,
      [ImportanceLevel.Moderate]: 60,
      [ImportanceLevel.Important]: 80,
      [ImportanceLevel.Vital]: 100,
    };

    const importanceScore = importanceMap[importance] || 60;

    // 如果无期限，仅返回重要性分�?
    if (!dueDate) {
      return importanceScore * 0.6; // 加权 60% 的重要�?
    }

    // 计算时间紧迫度（dueDate - currentTime�?
    const dueDateObj = new Date(dueDate);
    const timeRemainingMs = dueDateObj.getTime() - currentTime.getTime();
    const timeRemainingDays = Math.max(0, timeRemainingMs / (1000 * 60 * 60 * 24));

    // 时间紧迫度评分：时间越少越紧�?
    let urgencyScore = 0;
    if (timeRemainingDays === 0) {
      urgencyScore = 100; // 今天到期
    } else if (timeRemainingDays <= 1) {
      urgencyScore = 90; // 1天内
    } else if (timeRemainingDays <= 3) {
      urgencyScore = 75; // 3天内
    } else if (timeRemainingDays <= 7) {
      urgencyScore = 50; // 1周内
    } else {
      urgencyScore = Math.max(10, 100 - timeRemainingDays * 5); // 递减
    }

    // 加权计算优先�?
    const priority = importanceScore * 0.6 + urgencyScore * 0.4;
    return Math.min(100, Math.max(0, priority)); // 限制�?0-100
  }

  /**
   * 为任�?DTO 列表添加优先级字�?
   */
  private enrichWithPriority(
    dtos: (TaskTemplateServerDTO | TaskTemplateClientDTO)[],
    currentTime: Date
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.map((dto) => ({
      ...dto,
      priority: this.calculatePriority(dto.importance, dto.dueDate || null, currentTime),
    }));
  }

  /**
   * 按过滤条件过滤任�?
   *
   * @param dtos 任务 DTO 数组
   * @param filters 过滤条件
   * @param currentTime 当前时间
   * @returns 过滤后的 DTO 数组
   */
  private applyFilters(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
    filters: TaskFilterBy[],
    currentTime: Date
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.filter((dto) => {
      // 所有过滤条件必须满�?(AND 关系)
      return filters.every((filter) => this.matchesFilter(dto, filter, currentTime));
    });
  }

  /**
   * 检查任务是否匹配单个过滤条�?
   *
   * @param dto 任务 DTO
   * @param filter 过滤条件
   * @param currentTime 当前时间
   * @returns true 如果匹配
   */
  private matchesFilter(
    dto: (TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number },
    filter: TaskFilterBy,
    currentTime: Date
  ): boolean {
    if (filter.startsWith('importance:')) {
      const level = filter.split(':')[1];
      return this.matchesImportanceFilter(dto.importance, level);
    }

    if (filter.startsWith('status:')) {
      const status = filter.split(':')[1];
      return this.matchesStatusFilter(dto.status, status);
    }

    if (filter.startsWith('dueDate:')) {
      const dateFilter = filter.split(':')[1];
      return this.matchesDueDateFilter(dto.dueDate ?? null, dateFilter, currentTime);
    }

    return true;
  }

  /**
   * 检查重要性是否匹配过滤条�?
   *
   * 过滤逻辑: filterBy=importance:important 返回 importance >= Important 的任�?
   */
  private matchesImportanceFilter(importance: ImportanceLevel, level: string): boolean {
    const importanceLevels = [
      ImportanceLevel.Trivial,    // 1
      ImportanceLevel.Minor,      // 2
      ImportanceLevel.Moderate,   // 3
      ImportanceLevel.Important,  // 4
      ImportanceLevel.Vital,      // 5
    ];

    const filterLevelIndex = importanceLevels.findIndex((l) => l === level);
    const taskLevelIndex = importanceLevels.findIndex((l) => l === importance);

    if (filterLevelIndex === -1) {
      return true; // 无效的过滤条件，不过�?
    }

    // importance >= filterLevel
    return taskLevelIndex >= filterLevelIndex;
  }

  /**
   * 检查状态是否匹配过滤条�?
   */
  private matchesStatusFilter(status: TaskTemplateStatus, statusFilter: string): boolean {
    // 状态过滤（精确匹配�?
    return status.toLowerCase() === statusFilter.toLowerCase();
  }

  /**
   * 检查截止日期是否匹配过滤条�?
   */
  private matchesDueDateFilter(
    dueDate: number | null,
    dateFilter: string,
    currentTime: Date
  ): boolean {
    if (!dueDate) {
      return dateFilter === 'noDueDate';
    }

    const dueDateObj = new Date(dueDate);
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const inSevenDays = new Date(today);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    switch (dateFilter) {
      case 'overdue':
        return dueDateObj < today;
      case 'today':
        return dueDateObj >= today && dueDateObj < tomorrow;
      case 'upcoming':
        return dueDateObj >= today && dueDateObj < inSevenDays;
      default:
        return true;
    }
  }

  /**
   * 按指定字段排序任�?
   *
   * @param dtos 任务 DTO 数组
   * @param sortBy 排序字段
   * @param currentTime 当前时间
   * @returns 排序后的 DTO 数组
   */
  private applySort(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
    sortBy: TaskSortBy,
    currentTime: Date
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    const sorted = [...dtos]; // 避免修改原数�?

    switch (sortBy) {
      case TaskSortBy.PRIORITY:
        return this.sortByPriority(sorted);

      case TaskSortBy.DUE_DATE:
        return this.sortByDueDate(sorted);

      case TaskSortBy.CREATED_AT:
        return this.sortByCreatedAt(sorted);

      case TaskSortBy.IMPORTANCE:
        return this.sortByImportance(sorted);

      default:
        return this.sortByPriority(sorted); // 默认按优先级排序
    }
  }

  /**
   * 按优先级降序排序
   */
  private sortByPriority(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 按截止日期升序排序，无期限任务排在最�?
   */
  private sortByDueDate(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.sort((a, b) => {
      const aHasDue = a.dueDate != null;
      const bHasDue = b.dueDate != null;

      // 无期限的任务排在最�?
      if (!aHasDue && bHasDue) return 1;
      if (aHasDue && !bHasDue) return -1;

      // 都没有期限，保持原顺�?
      if (!aHasDue && !bHasDue) return 0;

      // 都有期限，按升序排列
      return (a.dueDate as number) - (b.dueDate as number);
    });
  }

  /**
   * 按创建时间降序排序（最新创建的在前�?
   */
  private sortByCreatedAt(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // 降序
    });
  }

  /**
   * 按重要性降序排�?
   *
   * 顺序: Vital > Important > Moderate > Minor > Trivial
   */
  private sortByImportance(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    const importanceValues: Record<ImportanceLevel, number> = {
      [ImportanceLevel.Vital]: 5,
      [ImportanceLevel.Important]: 4,
      [ImportanceLevel.Moderate]: 3,
      [ImportanceLevel.Minor]: 2,
      [ImportanceLevel.Trivial]: 1,
    };

    return dtos.sort((a, b) => {
      const aValue = importanceValues[a.importance] || 0;
      const bValue = importanceValues[b.importance] || 0;
      return bValue - aValue; // 降序
    });
  }

  /**
   * 获取所有活跃任�?
   * 私有方法
   *
   * @param accountUuid 账户 UUID
   * @returns 活跃任务列表
   */
  private async getAllActiveTemplates(accountUuid: string): Promise<TaskTemplate[]> {
    const activeStatuses = [
      TaskTemplateStatus.ACTIVE,
      TaskTemplateStatus.PAUSED,
    ];

    const templates: TaskTemplate[] = [];
    for (const status of activeStatuses) {
      const byStatus = await this.templateRepository.findByStatus(accountUuid, status);
      templates.push(...byStatus);
    }

    return templates;
  }
}
