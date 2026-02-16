import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository, TaskFilters } from '../../domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplate } from '../../domain-server/aggregates/task-template';
import { TaskInstance } from '../../domain-server/aggregates/task-instance';
import { TaskInstanceGenerationService } from '../../domain-server/services/TaskInstanceGenerationService';
import { TaskTimeConfig, RecurrenceRule, TaskReminderConfig } from '../../domain-server/value-objects';

// Result pattern imports
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

// Cross-module imports
import type { IScheduleTaskRepository } from '@dailyuse/schedule/domain-server';
import { ScheduleTaskFactory } from '@dailyuse/schedule/application-server';
import { SourceModule } from '@dailyuse/contracts/schedule';

import { TaskType, TaskTemplateStatus } from '@dailyuse/contracts/task';
import type {
  TaskTimeConfigServerDTO,
  RecurrenceRuleServerDTO,
  TaskReminderConfigServerDTO,
  TaskTemplateServerDTO,
  TaskInstanceServerDTO,
  TaskTemplateClientDTO,
  TaskTemplateHistoryClientDTO,
  TaskInstanceClientDTO,
} from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils';


export class TaskTemplateApplicationService {
  private generationService: TaskInstanceGenerationService;
  private templateRepository: ITaskTemplateRepository;
  private instanceRepository: ITaskInstanceRepository;
  private scheduleRepository?: IScheduleTaskRepository;

  constructor(
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
    scheduleRepository?: IScheduleTaskRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
    this.templateRepository = templateRepository;
    this.instanceRepository = instanceRepository;
    this.scheduleRepository = scheduleRepository;
  }

  // ===== TaskTemplate 管理 =====



  /**
   * 检查并生成待生成的实例
   */
  async checkAndGenerateInstances(): Promise<void> {
    // 查找所有需要补充的模板
    // 注意：这里需要支持所有账户，可能需要调�?Repository 接口
    const templates = await this.templateRepository.findActiveTemplates('');

    console.log(
      `[TaskTemplateApplicationService] 开始检�?${templates.length} 个活跃模板的实例数量`,
    );

    for (const template of templates) {
      await this.checkAndRefillInstances(template);
    }
  }

  // ===== ONE_TIME 任务管理 =====

  /**
   * 创建一次性任�?
   */
  async createOneTimeTask(params: {
    identityId: string;
    title: string;
    description?: string;
    importance?: ImportanceLevel;
    startDate?: number;
    dueDate?: number;
    estimatedMinutes?: number;
    note?: string;
    goalId?: string;
    keyResultId?: string;
    parentTaskUuid?: string;
    folderId?: string;
    tags?: string[];
    color?: string;
  }): Promise<TaskTemplateClientDTO> {
    // 使用领域模型的工厂方法创建一次性任�?
    const task = TaskTemplate.createOneTimeTask({
      identityId: params.identityId,
      title: params.title,
      description: params.description,
      importance: params.importance,
      startDate: params.startDate,
      dueDate: params.dueDate,
      estimatedMinutes: params.estimatedMinutes,
      note: params.note,
      goalId: params.goalId,
      keyResultId: params.keyResultId,
      parentTaskUuid: params.parentTaskUuid,
      folderId: params.folderId,
      tags: params.tags,
      color: params.color,
    });

    // 保存到仓�?
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 阻塞任务模板
   */
  async blockTask(uuid: string, reason: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsBlocked(reason);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 解除阻塞任务模板
   */
  async unblockTask(uuid: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsReady();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新截止时间
   */
  async updateDueDate(
    uuid: string,
    newDueDate: number | null,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateDueDate(newDueDate);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新预估时间
   */
  async updateEstimatedTime(
    uuid: string,
    estimatedMinutes: number,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateEstimatedTime(estimatedMinutes);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新一次性任务（通用更新方法�?
   * 支持更新标题、描述、日期、优先级、标签等属�?
   */
  async updateOneTimeTask(
    uuid: string,
    updates: {
      title?: string;
      description?: string;
      startDate?: number;
      dueDate?: number;
      importance?: ImportanceLevel;
      estimatedMinutes?: number;
      tags?: string[];
      color?: string;
      note?: string;
    },
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    // 更新各个属�?
    if (updates.title !== undefined) {
      task.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      task.updateDescription(updates.description);
    }
    if (updates.startDate !== undefined) {
      task.updateStartDate(updates.startDate);
    }
    if (updates.dueDate !== undefined) {
      task.updateDueDate(updates.dueDate);
    }
    if (updates.importance !== undefined) {
      task.updatePriority(updates.importance);
    }
    if (updates.estimatedMinutes !== undefined) {
      task.updateEstimatedTime(updates.estimatedMinutes);
    }
    if (updates.tags !== undefined) {
      task.updateTags(updates.tags);
    }
    if (updates.color !== undefined) {
      task.updateColor(updates.color);
    }
    if (updates.note !== undefined) {
      task.updateNote(updates.note);
    }

    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 获取任务历史记录
   */
  async getTaskHistory(uuid: string): Promise<TaskTemplateHistoryClientDTO[]> {
    const task = await this.templateRepository.findByIdWithChildren(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    return task.history.map((h) => h.toClientDTO());
  }

  // ===== ONE_TIME 任务查询 =====

  /**
   * 查找一次性任�?
   */
  async findOneTimeTasks(
    identityId: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOneTimeTasks(identityId, filters);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找循环任务
   */
  async findRecurringTasks(
    identityId: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findRecurringTasks(identityId, filters);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找逾期任务
   */
  async getOverdueTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOverdueTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找今日任务
   */
  async getTodayTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTodayTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找即将到期的任�?
   */
  async getUpcomingTasks(
    identityId: string,
    daysAhead: number,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findUpcomingTasks(identityId, daysAhead);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 按优先级排序查找任务
   */
  async getTasksSortedByPriority(
    identityId: string,
    limit?: number,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findSortedByPriority(identityId, limit);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 根据 Goal 查找任务（新版本，支�?ONE_TIME�?
   */
  async getTasksByGoal(goalId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findByGoalId(goalId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 根据 KeyResult 查找任务
   */
  async getTasksByKeyResult(keyResultId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findByKeyResultId(keyResultId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找被阻塞的任务
   */
  async getBlockedTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findBlockedTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 统计任务数量
   */
  async countTasks(identityId: string, filters?: TaskFilters): Promise<number> {
    return await this.templateRepository.countTasks(identityId, filters);
  }

  // ===== 子任务管�?=====

  /**
   * 创建子任�?
   */
  async createSubtask(
    parentUuid: string,
    params: {
      identityId: string;
      title: string;
      description?: string;
      importance?: ImportanceLevel;
      dueDate?: number;
      estimatedMinutes?: number;
    },
  ): Promise<TaskTemplateClientDTO> {
    // 验证父任务存�?
    const parentTask = await this.templateRepository.findById(parentUuid);
    if (!parentTask) {
      throw new Error(`Parent task ${parentUuid} not found`);
    }

    // 创建子任�?
    const subtask = TaskTemplate.createOneTimeTask({
      identityId: params.identityId,
      title: params.title,
      description: params.description,
      importance: params.importance,
      dueDate: params.dueDate,
      estimatedMinutes: params.estimatedMinutes,
      parentTaskUuid: parentUuid,
    });

    await this.templateRepository.save(subtask);

    // 记录父任务添加子任务
    parentTask.addSubtask(subtask.id);
    await this.templateRepository.save(parentTask);

    return subtask.toClientDTO();
  }

  /**
   * 获取子任务列�?
   */
  async getSubtasks(parentUuid: string): Promise<TaskTemplateClientDTO[]> {
    const subtasks = await this.templateRepository.findSubtasks(parentUuid);
    return subtasks.map((t) => t.toClientDTO());
  }

  /**
   * 移除子任�?
   */
  async removeSubtask(parentUuid: string, subtaskUuid: string): Promise<void> {
    const parentTask = await this.templateRepository.findById(parentUuid);
    if (!parentTask) {
      throw new Error(`Parent task ${parentUuid} not found`);
    }

    parentTask.removeSubtask(subtaskUuid);
    await this.templateRepository.save(parentTask);
  }

  // ===== Goal/KR 关联管理 (ONE_TIME 任务新版�? =====

  /**
   * 链接到目�?
   */
  async linkToGoal(
    uuid: string,
    goalId: string,
    keyResultId?: string,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.linkToGoal(goalId, keyResultId);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 解除目标链接
   */
  async unlinkFromGoal(uuid: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.unlinkFromGoal();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  // ===== 依赖管理 =====

  /**
   * 标记为被阻塞
   */
  async markAsBlocked(
    uuid: string,
    reason: string,
    dependencyTaskUuid?: string,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsBlocked(reason, dependencyTaskUuid);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 标记为就�?
   */
  async markAsReady(uuid: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsReady();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新依赖状�?
   */
  async updateDependencyStatus(
    uuid: string,
    status: 'PENDING' | 'READY' | 'BLOCKED',
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateDependencyStatus(status);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  // ===== 批量操作 =====

  /**
   * 批量创建任务
   */
  async createTasksBatch(
    tasks: Array<{
      identityId: string;
      title: string;
      description?: string;
      importance?: ImportanceLevel;
      dueDate?: number;
      estimatedMinutes?: number;
      goalId?: string;
      keyResultId?: string;
    }>,
  ): Promise<TaskTemplateClientDTO[]> {
    const taskEntities = tasks.map((params) =>
      TaskTemplate.createOneTimeTask({
        identityId: params.identityId,
        title: params.title,
        description: params.description,
        importance: params.importance,
        dueDate: params.dueDate,
        estimatedMinutes: params.estimatedMinutes,
        goalId: params.goalId,
        keyResultId: params.keyResultId,
      }),
    );

    await this.templateRepository.saveBatch(taskEntities);

    return taskEntities.map((t) => t.toClientDTO());
  }

  /**
   * 批量删除任务
   */
  async deleteTasksBatch(uuids: string[]): Promise<void> {
    await this.templateRepository.deleteBatch(uuids);
  }

  // ===== 仪表�?统计查询 =====

  /**
   * 获取最近完成的任务
   */
  async getRecentCompletedTasks(
    identityId: string,
    limit: number = 10,
  ): Promise<TaskTemplateClientDTO[]> {
    // 获取最�?天完成的任务
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasks = await this.templateRepository.findOneTimeTasks(identityId, {
      taskType: TaskType.ONE_TIME,
      status: 'COMPLETED' as any,
    });

    // 筛选并排序：最近完成的任务（按更新时间倒序�?
    return tasks
      .filter((t) => t.updatedAt && t.updatedAt >= sevenDaysAgo)
      .sort((a, b) => {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return timeB - timeA;
      })
      .slice(0, limit)
      .map((t) => t.toClientDTO());
  }

  /**
   * 获取任务仪表板数�?
   */
  async getTaskDashboard(identityId: string): Promise<{
    todayTasks: TaskTemplateClientDTO[];
    overdueTasks: TaskTemplateClientDTO[];
    blockedTasks: TaskTemplateClientDTO[];
    upcomingTasks: TaskTemplateClientDTO[];
    highPriorityTasks: TaskTemplateClientDTO[];
    recentCompleted: TaskTemplateClientDTO[];
    statistics: {
      totalActive: number;
      totalCompleted: number;
      totalOverdue: number;
      totalBlocked: number;
      completionRate: number;
    };
  }> {
    // 并行查询所有数�?
    const [
      today,
      overdue,
      blocked,
      upcoming,
      highPriority,
      recentCompleted,
      totalActive,
      totalCompleted,
    ] = await Promise.all([
      this.getTodayTasks(identityId),
      this.getOverdueTasks(identityId),
      this.getBlockedTasks(identityId),
      this.getUpcomingTasks(identityId, 7), // 未来7�?
      this.getTasksSortedByPriority(identityId, 5), // �?个高优先级任�?
      this.getRecentCompletedTasks(identityId, 10), // 最�?0个完成的任务
      this.countTasks(identityId, {
        taskType: TaskType.ONE_TIME,
        status: 'TODO' as any,
      }),
      this.countTasks(identityId, {
        taskType: TaskType.ONE_TIME,
        status: 'COMPLETED' as any,
      }),
    ]);

    const completionRate =
      totalActive + totalCompleted > 0
        ? Math.round((totalCompleted / (totalActive + totalCompleted)) * 100)
        : 0;

    return {
      todayTasks: today,
      overdueTasks: overdue,
      blockedTasks: blocked,
      upcomingTasks: upcoming,
      highPriorityTasks: highPriority,
      recentCompleted,
      statistics: {
        totalActive,
        totalCompleted,
        totalOverdue: overdue.length,
        totalBlocked: blocked.length,
        completionRate,
      },
    };
  }

  /**
   * 根据日期范围获取模板实例
   * 用于前端按需加载任务实例
   */
  async getInstancesByDateRange(
    templateId: string,
    fromDate: number,
    toDate: number,
  ): Promise<TaskInstanceClientDTO[]> {
    // 验证模板是否存在
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Task template not found: ${templateId}`);
    }

    // 从仓储中获取该模板的所有实�?
    const allInstances = await this.instanceRepository.findByTemplateId(templateId);

    // 在内存中按日期范围过�?
    const filteredInstances = allInstances.filter((instance) => {
      const instanceDate = instance.instanceDate as any;
      const timestamp =
        typeof instanceDate === 'number' ? instanceDate : instanceDate.getTime?.() || instanceDate;
      return timestamp >= fromDate && timestamp <= toDate;
    });

    // 转换为客户端 DTO
    return filteredInstances.map((instance) => instance.toClientDTO());
  }
}

