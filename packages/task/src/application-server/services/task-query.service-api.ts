/**
 * Task Query Service
 *
 * Handles task list queries with sorting and filtering support,
 * priority calculation, and multiple sort/filter strategies.
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { TaskTemplate } from '@/domain-server/aggregates/task-template';
import {
  TaskTemplateStatus,
  type TaskTemplateServerDTO,
  type TaskTemplateClientDTO,
} from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskSortBy, TaskFilterBy } from './task-query.validator';

/**
 * Task query service providing flexible querying, sorting, and filtering.
 */
export class TaskQueryService {
  private templateRepository: ITaskTemplateRepository;

  constructor(templateRepository: ITaskTemplateRepository) {
    this.templateRepository = templateRepository;
  }

  /**
   * Queries tasks with specified sorting and filtering.
   *
   * Steps:
   * 1. Fetch all active tasks
   * 2. Convert to DTOs and calculate priority
   * 3. Apply filter conditions
   * 4. Sort by specified field
   *
   * @param identityId - Account ID
   * @param sortBy - Sort field (default: priority)
   * @param filterBy - Filter conditions (AND logic)
   * @param currentTime - Current time for priority calculation and relative date filtering
   * @returns Sorted and filtered task DTOs with priority field
   */
  async getTasksWithSortingAndFiltering(
    identityId: string,
    sortBy: TaskSortBy = TaskSortBy.PRIORITY,
    filterBy: TaskFilterBy[] = [],
    currentTime: Date = new Date(),
  ): Promise<Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>> {
    // Step 1: Fetch all active tasks
    const templates = await this.getAllActiveTemplates(identityId);

    // Step 2: Convert to DTOs and calculate priority
    const dtos = templates.map((t) => t.toServerDTO());
    const enriched = this.enrichWithPriority(dtos, currentTime);

    // Step 3: Apply filter conditions
    let filtered = enriched;
    if (filterBy.length > 0) {
      filtered = this.applyFilters(enriched, filterBy, currentTime);
    }

    // Step 4: Sort by specified field
    return this.applySort(filtered, sortBy, currentTime);
  }

  /**
   * Calculates priority for a single task.
   *
   * Formula: priority = (importance * 0.6) + (timeRemaining * 0.4)
   * Range: 0-100
   *
   * @param importance - Importance level (mapped to numeric value)
   * @param dueDate - Due date as timestamp in ms, null means no deadline
   * @param currentTime - Current time
   * @returns Priority score (0-100)
   */
  private calculatePriority(
    importance: ImportanceLevel,
    dueDate: number | null,
    currentTime: Date,
  ): number {
    // Map importance to numeric value (0-100)
    const importanceMap: {
      Vital: number;
      Important: number;
      Moderate: number;
      Minor: number;
      Trivial: number;
    } = {
      Vital: 100,
      Important: 80,
      Moderate: 60,
      Minor: 40,
      Trivial: 20,
    };

    const importanceScore = importanceMap[importance] || 60;

    // If no deadline, return only the importance score
    if (!dueDate) {
      return importanceScore * 0.6; // 60% importance weight
    }

    // Calculate time urgency (dueDate - currentTime)
    const dueDateObj = new Date(dueDate);
    const timeRemainingMs = dueDateObj.getTime() - currentTime.getTime();
    const timeRemainingDays = Math.max(0, timeRemainingMs / (1000 * 60 * 60 * 24));

    // Urgency score: less time remaining = more urgent
    let urgencyScore = 0;
    if (timeRemainingDays === 0) {
      urgencyScore = 100; // Due today
    } else if (timeRemainingDays <= 1) {
      urgencyScore = 90; // Within 1 day
    } else if (timeRemainingDays <= 3) {
      urgencyScore = 75; // Within 3 days
    } else if (timeRemainingDays <= 7) {
      urgencyScore = 50; // Within 1 week
    } else {
      urgencyScore = Math.max(10, 100 - timeRemainingDays * 5); // Decreasing
    }

    // Weighted priority calculation
    const priority = importanceScore * 0.6 + urgencyScore * 0.4;
    return Math.min(100, Math.max(0, priority)); // Clamp to 0-100
  }

  /** Enriches task DTOs with a calculated priority field. */
  private enrichWithPriority(
    dtos: (TaskTemplateServerDTO | TaskTemplateClientDTO)[],
    currentTime: Date,
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.map((dto) => {
      // Handle dueDate access: TaskTemplateClientDTO has dueDate directly, TaskTemplateServerDTO uses timeConfig.startDate
      const dueDate =
        'dueDate' in dto
          ? (dto.dueDate as number | null)
          : (dto.timeConfig?.startDate as number | null);
      return {
        ...dto,
        priority: this.calculatePriority(dto.importance, dueDate, currentTime),
      };
    });
  }

  /**
   * Filters tasks by the given conditions.
   *
   * @param dtos - Task DTOs
   * @param filters - Filter conditions
   * @param currentTime - Current time
   * @returns Filtered DTOs
   */
  private applyFilters(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
    filters: TaskFilterBy[],
    currentTime: Date,
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.filter((dto) => {
      // All filter conditions must be satisfied (AND logic)
      return filters.every((filter) => this.matchesFilter(dto, filter, currentTime));
    });
  }

  /**
   * Checks whether a task matches a single filter condition.
   *
   * @param dto - Task DTO
   * @param filter - Filter condition
   * @param currentTime - Current time
   * @returns True if the task matches
   */
  private matchesFilter(
    dto: (TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number },
    filter: TaskFilterBy,
    currentTime: Date,
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
      const dueDate =
        'dueDate' in dto
          ? (dto.dueDate as number | null)
          : (dto.timeConfig?.startDate as number | null);
      return this.matchesDueDateFilter(dueDate ?? null, dateFilter, currentTime);
    }

    return true;
  }

  /**
   * Checks whether importance matches the filter.
   * Filter logic: `filterBy=importance:important` returns tasks with importance >= Important.
   */
  private matchesImportanceFilter(importance: ImportanceLevel, level: string): boolean {
    const importanceLevels = [
      ImportanceLevel.Trivial, // 1
      ImportanceLevel.Minor, // 2
      ImportanceLevel.Moderate, // 3
      ImportanceLevel.Important, // 4
      ImportanceLevel.Vital, // 5
    ];

    const filterLevelIndex = importanceLevels.findIndex((l) => l === level);
    const taskLevelIndex = importanceLevels.findIndex((l) => l === importance);

    if (filterLevelIndex === -1) {
      return true; // Invalid filter condition, skip filtering
    }

    // importance >= filterLevel
    return taskLevelIndex >= filterLevelIndex;
  }

  /** Checks whether status matches the filter condition. */
  private matchesStatusFilter(status: TaskTemplateStatus, statusFilter: string): boolean {
    // Exact match on status
    return status.toLowerCase() === statusFilter.toLowerCase();
  }

  /** Checks whether due date matches the filter condition. */
  private matchesDueDateFilter(
    dueDate: number | null,
    dateFilter: string,
    currentTime: Date,
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
   * Sorts tasks by the specified field.
   *
   * @param dtos - Task DTOs
   * @param sortBy - Sort field
   * @param currentTime - Current time
   * @returns Sorted DTOs
   */
  private applySort(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
    sortBy: TaskSortBy,
    currentTime: Date,
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    const sorted = [...dtos]; // Avoid mutating original array

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
        return this.sortByPriority(sorted); // Default: sort by priority
    }
  }

  /** Sorts by priority descending. */
  private sortByPriority(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.sort((a, b) => b.priority - a.priority);
  }

  /** Sorts by due date ascending; tasks with no due date are placed last. */
  private sortByDueDate(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.sort((a, b) => {
      const aDueDate =
        'dueDate' in a ? (a.dueDate as number | null) : (a.timeConfig?.startDate as number | null);
      const bDueDate =
        'dueDate' in b ? (b.dueDate as number | null) : (b.timeConfig?.startDate as number | null);
      const aHasDue = aDueDate != null;
      const bHasDue = bDueDate != null;

      // Tasks without a due date go last
      if (!aHasDue && bHasDue) return 1;
      if (aHasDue && !bHasDue) return -1;

      // Both have no due date, preserve original order
      if (!aHasDue && !bHasDue) return 0;

      // Both have due dates, sort ascending
      return (aDueDate as number) - (bDueDate as number);
    });
  }

  /** Sorts by creation time descending (newest first). */
  private sortByCreatedAt(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    return dtos.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // Descending
    });
  }

  /**
   * Sorts by importance descending.
   *
   * Order: Vital > Important > Moderate > Minor > Trivial
   */
  private sortByImportance(
    dtos: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>,
  ): Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }> {
    const importanceValues: {
      Vital: number;
      Important: number;
      Moderate: number;
      Minor: number;
      Trivial: number;
    } = {
      Vital: 5,
      Important: 4,
      Moderate: 3,
      Minor: 2,
      Trivial: 1,
    };

    return dtos.sort((a, b) => {
      const aValue = importanceValues[a.importance] || 0;
      const bValue = importanceValues[b.importance] || 0;
      return bValue - aValue; // Descending
    });
  }

  /**
   * Fetches all active task templates for a given account.
   *
   * @param identityId - Account ID
   * @returns List of active task templates
   */
  private async getAllActiveTemplates(identityId: string): Promise<TaskTemplate[]> {
    const activeStatuses = [TaskTemplateStatus.Active, TaskTemplateStatus.Paused];

    const templates: TaskTemplate[] = [];
    for (const status of activeStatuses) {
      const byStatus = await this.templateRepository.findByStatus(identityId, status);
      templates.push(...byStatus);
    }

    return templates;
  }
}
