/**
 * Task Query Service
 *
 * 任务查询服务 - 集成优先级计算
 * Story 1.5: 在应用层集成优先级计算
 *
 * 责任：
 * 1. 从仓储层查询任务（TaskTemplate/TaskInstance）
 * 2. 使用 PriorityCalculator 计算每个任务的优先级分数
 * 3. 将计算结果注入到 DTO 中返回
 * 4. 支持批量操作以提升性能
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@dailyuse/domain-server/task';
import { calculateTaskPriority } from '@dailyuse/domain-server/task';
import type {
  TaskTemplateServerDTO,
  TaskInstanceServerDTO,
} from '@dailyuse/contracts/task';
import { TaskTemplateStatus, TimeType } from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';

/**
 * 提取任务的 dueDate（用于优先级计算）
 *
 * TaskTemplate 有直接的 dueDate 属性
 * TaskInstance 有 instanceDate，但优先级计算使用模板的 dueDate
 */
function extractDueDate(dto: TaskTemplateServerDTO | TaskInstanceServerDTO): Date | null {
  // TaskTemplateServerDTO 有 dueDate 属性 (One-Time Task)
  if ('dueDate' in dto && dto.dueDate && typeof dto.dueDate === 'number') {
    return new Date(dto.dueDate);
  }

  // TaskInstanceServerDTO 通过 timeConfig 计算
  if ('timeConfig' in dto && dto.timeConfig) {
    const tc = dto.timeConfig;
    // 使用 import 的 TimeType 枚举值
    if (tc.timeType === TimeType.TIME_POINT && tc.timePoint) {
      return new Date(tc.timePoint);
    }
    if (tc.timeType === TimeType.TIME_RANGE && tc.timeRange?.end) {
      return new Date(tc.timeRange.end);
    }
    // 全天任务：截止到 instanceDate 当天结束
    // TaskInstanceServerDTO 必然包含 instanceDate
    if ('instanceDate' in dto && typeof dto.instanceDate === 'number') {
      // 假设 instanceDate 是当天 00:00:00，则截止时间为当天 23:59:59.999
      return new Date(dto.instanceDate + 86400000 - 1);
    }
  }

  return null;
}

/**
 * 为单个任务 DTO 添加优先级分数
 *
 * @param dto 任务 DTO
 * @param currentTime 当前时间（用于计算）
 * @returns 包含 priority 字段的 DTO
 */
export function enrichWithPriority<T extends TaskTemplateServerDTO | TaskInstanceServerDTO>(
  dto: T,
  currentTime: Date = new Date(),
): T & { priority: number } {
  const dueDate = extractDueDate(dto);
  const priority = calculateTaskPriority(dto.importance, dueDate, currentTime);

  return {
    ...dto,
    priority,
  };
}

/**
 * 为多个任务 DTO 批量添加优先级分数（优化性能）
 *
 * @param dtos 任务 DTO 数组
 * @param currentTime 当前时间（用于计算）
 * @returns 包含 priority 字段的 DTO 数组
 */
export function enrichMultipleWithPriority<T extends TaskTemplateServerDTO | TaskInstanceServerDTO>(
  dtos: T[],
  currentTime: Date = new Date(),
): Array<T & { priority: number }> {
  return dtos.map((dto) => enrichWithPriority(dto, currentTime));
}

/**
 * Task Query Service
 *
 * 集成优先级计算的任务查询服务
 */
export class TaskQueryService {
  private static instance: TaskQueryService;

  private constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    templateRepository?: ITaskTemplateRepository,
    instanceRepository?: ITaskInstanceRepository,
  ): TaskQueryService {
    const container = TaskContainer.getInstance();
    const templateRepo = templateRepository || container.getTemplateRepository();
    const instanceRepo = instanceRepository || container.getInstanceRepository();
    TaskQueryService.instance = new TaskQueryService(templateRepo, instanceRepo);
    return TaskQueryService.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): TaskQueryService {
    if (!TaskQueryService.instance) {
      TaskQueryService.instance = TaskQueryService.createInstance();
    }
    return TaskQueryService.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    TaskQueryService.instance = undefined as unknown as TaskQueryService;
  }

  /**
   * 获取单个任务模板并计算优先级
   *
   * @param uuid 任务模板 UUID
   * @param includeChildren 是否包含子实例
   * @param currentTime 当前时间（用于优先级计算）
   * @returns 包含优先级分数的任务模板 DTO
   */
  async getTaskTemplateWithPriority(
    uuid: string,
    includeChildren = false,
    currentTime: Date = new Date(),
  ): Promise<(TaskTemplateServerDTO & { priority: number }) | null> {
    const template = includeChildren
      ? await this.templateRepository.findByUuidWithChildren(uuid)
      : await this.templateRepository.findByUuid(uuid);

    if (!template) {
      return null;
    }

    const dto = template.toServerDTO(includeChildren);
    return enrichWithPriority(dto, currentTime);
  }

  /**
   * 获取任务模板列表并为每个计算优先级
   *
   * @param accountUuid 账户 UUID
   * @param currentTime 当前时间（用于优先级计算）
   * @returns 包含优先级分数的任务模板 DTO 数组
   */
  async listTaskTemplatesWithPriority(
    accountUuid: string,
    currentTime: Date = new Date(),
  ): Promise<Array<TaskTemplateServerDTO & { priority: number }>> {
    const templates = await this.templateRepository.findByAccount(accountUuid);
    const dtos = templates.map((t) => t.toServerDTO());
    return enrichMultipleWithPriority(dtos, currentTime);
  }

  /**
   * 按状态查询任务模板
   *
   * @param accountUuid 账户 UUID
   * @param status 任务状态
   * @param currentTime 当前时间
   * @returns 包含优先级分数的任务模板 DTO 数组
   */
  async listTaskTemplatesByStatusWithPriority(
    accountUuid: string,
    status: TaskTemplateStatus,
    currentTime: Date = new Date(),
  ): Promise<Array<TaskTemplateServerDTO & { priority: number }>> {
    const templates = await this.templateRepository.findByStatus(accountUuid, status);
    const dtos = templates.map((t) => t.toServerDTO());
    return enrichMultipleWithPriority(dtos, currentTime);
  }

  /**
   * 获取日期范围内的任务实例并计算优先级
   *
   * @param accountUuid 账户 UUID
   * @param startDate 起始日期（时间戳 ms）
   * @param endDate 结束日期（时间戳 ms）
   * @param currentTime 当前时间（用于优先级计算）
   * @returns 包含优先级分数的任务实例 DTO 数组
   */
  async getTaskInstancesByDateRangeWithPriority(
    accountUuid: string,
    startDate: number,
    endDate: number,
    currentTime: Date = new Date(),
  ): Promise<Array<TaskInstanceServerDTO & { priority: number }>> {
    const instances = await this.instanceRepository.findByDateRange(accountUuid, startDate, endDate);

    const dtos = instances.map((i) => i.toServerDTO());
    return enrichMultipleWithPriority(dtos, currentTime);
  }

  /**
   * 获取单个任务实例并计算优先级
   *
   * @param uuid 任务实例 UUID
   * @param currentTime 当前时间（用于优先级计算）
   * @returns 包含优先级分数的任务实例 DTO
   */
  async getTaskInstanceWithPriority(
    uuid: string,
    currentTime: Date = new Date(),
  ): Promise<(TaskInstanceServerDTO & { priority: number }) | null> {
    const instance = await this.instanceRepository.findByUuid(uuid);

    if (!instance) {
      return null;
    }

    const dto = instance.toServerDTO();
    return enrichWithPriority(dto, currentTime);
  }

  /**
   * 获取按优先级排序的活跃任务列表
   *
   * Story 2.1: 实现任务列表内存排序逻辑
   *
   * 逻辑：
   * 1. 查询所有活跃任务（status: ACTIVE | PAUSED）
   * 2. 为每个任务计算优先级分数
   * 3. 按选定字段排序
   * 4. Backlog 任务（无 dueDate）自动排在有截止期的任务下方
   *
   * 性能特性：
   * - O(n log n) 排序复杂度（JavaScript Array.sort()）
   * - 2000 个任务 < 100ms（在现代硬件上）
   *
   * @param accountUuid 账户 UUID
   * @param sortBy 排序字段（'priority' | 'completedAt'），默认 'priority'
   * @param currentTime 当前时间（用于优先级计算）
   * @returns 排序后的任务 DTO 数组，包含 priority 字段
   *
   * @example
   * const sortedTasks = await service.getTasksWithPrioritySorting(accountUuid);
   * // 返回按优先级降序的任务列表
   */
  async getTasksWithPrioritySorting(
    accountUuid: string,
    sortBy: 'priority' | 'completedAt' = 'priority',
    currentTime: Date = new Date(),
  ): Promise<Array<TaskTemplateServerDTO & { priority: number }>> {
    // 查询所有活跃任务（ACTIVE 和 PAUSED）
    const activeTemplates = await this.templateRepository.findByStatus(
      accountUuid,
      TaskTemplateStatus.ACTIVE,
    );
    const pausedTemplates = await this.templateRepository.findByStatus(
      accountUuid,
      TaskTemplateStatus.PAUSED,
    );

    // 合并所有活跃任务
    const allActiveTemplates = [...activeTemplates, ...pausedTemplates];

    // 转换为 DTO 并计算优先级
    const dtos = allActiveTemplates.map((t) => t.toServerDTO());
    const enriched = enrichMultipleWithPriority(dtos, currentTime);

    // 按选定字段排序
    if (sortBy === 'priority') {
      return this.sortByPriority(enriched);
    } else if (sortBy === 'completedAt') {
      return this.sortByCompletedAt(enriched);
    }

    return enriched;
  }

  /**
   * 按优先级分数降序排列，Backlog 任务排在最后
   *
   * 排序规则：
   * 1. 有 dueDate 的任务优先
   * 2. 按 priority 分数降序排列
   * 3. Backlog 任务（无 dueDate）排在最后
   * 4. Backlog 任务内部按 priority 分数排序
   *
   * @param dtos 包含 priority 字段的 DTO 数组
   * @returns 排序后的数组
   */
  private sortByPriority(
    dtos: Array<TaskTemplateServerDTO & { priority: number }>,
  ): Array<TaskTemplateServerDTO & { priority: number }> {
    return dtos.sort((a, b) => {
      const aHasDueDate = a.dueDate != null;
      const bHasDueDate = b.dueDate != null;

      // 优先级 1: 有 dueDate 的任务排在前
      if (aHasDueDate && !bHasDueDate) return -1;
      if (!aHasDueDate && bHasDueDate) return 1;

      // 优先级 2: 按 priority 分数降序排列（高优先级在前）
      return b.priority - a.priority;
    });
  }

  /**
   * 按完成时间排序
   *
   * 用于存档视图或其他特定需求
   *
   * @param dtos DTO 数组
   * @returns 按 completedAt 降序排列的数组
   */
  private sortByCompletedAt(
    dtos: Array<TaskTemplateServerDTO & { priority: number }>,
  ): Array<TaskTemplateServerDTO & { priority: number }> {
    return dtos.sort((a, b) => {
      const aTime = a.completedAt || 0;
      const bTime = b.completedAt || 0;
      return bTime - aTime;
    });
  }
}

/**
 * 导出辅助函数供测试和其他模块使用
 */
export { extractDueDate };
