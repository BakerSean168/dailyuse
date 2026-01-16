import { apiClient } from '@/shared/api/instances';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  GenerateInstancesRequest,
  BindToGoalRequest,
  TaskDependencyClientDTO,
  TaskStatisticsServerDTO,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  CreateTaskDependencyRequest,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
  DependencyChainClientDTO,
  UpdateTaskDependencyRequest,
} from '@dailyuse/contracts/task';

/**
 * Task Template API 客户端
 * 负责任务模板相关的API调用
 *
 * API路由基于 DDD 聚合根控制模式:
 * - POST   /tasks/templates              - 创建任务模板
 * - GET    /tasks/templates              - 获取任务模板列表
 * - GET    /tasks/templates/:id          - 获取任务模板详情
 * - DELETE /tasks/templates/:id          - 删除任务模板
 * - POST   /tasks/templates/:id/activate - 激活任务模板
 * - POST   /tasks/templates/:id/pause    - 暂停任务模板
 * - POST   /tasks/templates/:id/archive  - 归档任务模板
 * - POST   /tasks/templates/:id/generate-instances - 生成任务实例
 * - POST   /tasks/templates/:id/bind-goal   - 绑定到目标
 * - POST   /tasks/templates/:id/unbind-goal - 解除目标绑定
 */
export class TaskTemplateApiClient {
  private readonly baseUrl = '/tasks/templates';

  // ===== Task Template CRUD =====

  /**
   * 创建任务模板
   */
  async createTaskTemplate(
    request: CreateTaskTemplateRequest,
  ): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderUuid?: string;
    goalUuid?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<TaskTemplateClientDTO[]> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取任务模板详情
   */
  async getTaskTemplateById(
    uuid: string,
    includeChildren = false,
  ): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`, {
      params: { includeChildren },
    });
    return data;
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== 方法别名（为了兼容 View 层调用）=====

  /**
   * 创建任务模板（别名）
   */
  async create(
    request: CreateTaskTemplateRequest,
  ): Promise<TaskTemplateClientDTO> {
    return this.createTaskTemplate(request);
  }

  /**
   * 根据 UUID 获取任务模板（别名）
   */
  async getByUuid(uuid: string): Promise<TaskTemplateClientDTO> {
    return this.getTaskTemplateById(uuid);
  }

  /**
   * 更新任务模板（别名）
   */
  async update(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateClientDTO> {
    return this.updateTaskTemplate(uuid, request);
  }

  // ===== Task Template 状态管理（聚合根操作）=====

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/activate`);
    return data;
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/pause`);
    return data;
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/archive`);
    return data;
  }

  // ===== 聚合根控制：任务实例管理 =====

  /**
   * 生成任务实例
   * 根据模板和重复规则生成任务实例
   */
  async generateInstances(
    templateUuid: string,
    request: GenerateInstancesRequest,
  ): Promise<TaskInstanceClientDTO[]> {
    const data = await apiClient.post(`${this.baseUrl}/${templateUuid}/generate-instances`, request);
    return data;
  }

  // ===== 聚合根控制：目标关联管理 =====

  /**
   * 绑定到目标
   * 将任务模板绑定到OKR目标
   */
  async bindToGoal(
    templateUuid: string,
    request: BindToGoalRequest,
  ): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${templateUuid}/bind-goal`, request);
    return data;
  }

  /**
   * 解除目标绑定
   */
  async unbindFromGoal(templateUuid: string): Promise<TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${templateUuid}/unbind-goal`);
    return data;
  }

  /**
   * 根据日期范围获取模板实例
   * @param templateUuid 模板 UUID
   * @param from 起始日期（时间戳）
   * @param to 结束日期（时间戳）
   */
  async getInstancesByDateRange(
    templateUuid: string,
    from: number,
    to: number
  ): Promise<TaskInstanceClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/instances`, {
      params: { from, to },
    });
    return data;
  }

  /**
   * 获取按优先级排序的任务列表
   * Story 2.2: 前端 API 集成
   * 从后端获取已按优先级排序的任务列表，包含 priority 字段
   * @param limit 可选，限制返回的任务数量
   */
  async getTasksWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<TaskTemplateClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/by-priority`, { params });
    return data;
  }
}

/**
 * Task Instance API 客户端
 * 负责任务实例相关的API调用
 *
 * API路由基于 DDD 聚合根控制模式:
 * - GET    /tasks/templates/instances            - 获取任务实例列表
 * - GET    /tasks/templates/instances/:id        - 获取任务实例详情
 * - DELETE /tasks/templates/instances/:id        - 删除任务实例
 * - POST   /tasks/templates/instances/:id/start  - 开始任务实例
 * - POST   /tasks/templates/instances/:id/complete - 完成任务实例
 * - POST   /tasks/templates/instances/:id/skip   - 跳过任务实例
 * - POST   /tasks/templates/instances/check-expired - 检查过期任务
 */
export class TaskInstanceApiClient {
  private readonly baseUrl = '/tasks/templates/instances';

  // ===== Task Instance CRUD =====

  /**
   * 获取任务实例列表
   */
  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<TaskInstanceClientDTO[]> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取任务实例详情
   */
  async getTaskInstanceById(uuid: string): Promise<TaskInstanceClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Task Instance 状态管理（聚合根操作）=====

  /**
   * 开始任务实例
   * 将任务实例状态从 PENDING 转换为 IN_PROGRESS
   */
  async startTaskInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/start`);
    return data;
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    uuid: string,
    request?: CompleteTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/complete`, request);
    return data;
  }

  /**
   * 跳过任务实例
   */
  async skipTaskInstance(
    uuid: string,
    request?: SkipTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/skip`, request);
    return data;
  }

  // ===== 批量操作 =====

  /**
   * 检查并标记过期的任务实例
   */
  async checkExpiredInstances(): Promise<{ count: number; instances: TaskInstanceClientDTO[] }> {
    const data = await apiClient.post(`${this.baseUrl}/check-expired`);
    return data;
  }
}

/**
 * Task Dependency API 客户端
 * 负责任务依赖关系相关的API调用
 *
 * API路由基于 RESTful 设计:
 * - POST   /tasks/:taskUuid/dependencies           - 创建任务依赖关系
 * - GET    /tasks/:taskUuid/dependencies           - 获取任务的所有前置依赖
 * - GET    /tasks/:taskUuid/dependents             - 获取依赖此任务的所有任务
 * - GET    /tasks/:taskUuid/dependency-chain       - 获取任务的完整依赖链
 * - POST   /tasks/dependencies/validate            - 验证依赖关系
 * - DELETE /tasks/dependencies/:uuid               - 删除依赖关系
 * - PUT    /tasks/dependencies/:uuid               - 更新依赖关系
 */
export class TaskDependencyApiClient {
  private readonly baseUrl = '/tasks';

  /**
   * 创建任务依赖关系
   */
  async createDependency(
    taskUuid: string,
    request: CreateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${taskUuid}/dependencies`, request);
    return data;
  }

  /**
   * 获取任务的所有前置依赖
   */
  async getDependencies(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/${taskUuid}/dependencies`);
    return data;
  }

  /**
   * 获取依赖此任务的所有任务（后续任务）
   */
  async getDependents(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/${taskUuid}/dependents`);
    return data;
  }

  /**
   * 获取任务的完整依赖链信息
   */
  async getDependencyChain(taskUuid: string): Promise<DependencyChainClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${taskUuid}/dependency-chain`);
    return data;
  }

  /**
   * 验证依赖关系（不实际创建）
   */
  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    const data = await apiClient.post(`${this.baseUrl}/dependencies/validate`, request);
    return data;
  }

  /**
   * 删除依赖关系
   */
  async deleteDependency(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/dependencies/${uuid}`);
  }

  /**
   * 更新依赖关系
   */
  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/dependencies/${uuid}`, request);
    return data;
  }
}

/**
 * Task Statistics API 客户端
 * 负责任务统计相关的API调用
 *
 * API路由基于 DDD 聚合根控制模式:
 * - GET    /tasks/statistics/:accountUuid                     - 获取任务统计
 * - POST   /tasks/statistics/:accountUuid/recalculate         - 重新计算统计
 * - DELETE /tasks/statistics/:accountUuid                     - 删除统计数据
 * - POST   /tasks/statistics/:accountUuid/update-template-stats    - 更新模板统计
 * - POST   /tasks/statistics/:accountUuid/update-instance-stats    - 更新实例统计
 * - POST   /tasks/statistics/:accountUuid/update-completion-stats  - 更新完成统计
 * - GET    /tasks/statistics/:accountUuid/today-completion-rate    - 今日完成率
 * - GET    /tasks/statistics/:accountUuid/week-completion-rate     - 本周完成率
 * - GET    /tasks/statistics/:accountUuid/efficiency-trend         - 效率趋势
 */
export class TaskStatisticsApiClient {
  private readonly baseUrl = '/tasks/statistics';

  // ===== Task Statistics 查询 =====

  /**
   * 获取任务统计数据
   */
  async getTaskStatistics(
    accountUuid: string,
    forceRecalculate = false,
  ): Promise<TaskStatisticsServerDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}`, {
      params: { forceRecalculate },
    });
    return data;
  }

  /**
   * 重新计算任务统计
   */
  async recalculateTaskStatistics(
    accountUuid: string,
    force = true,
  ): Promise<TaskStatisticsServerDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountUuid}/recalculate`, { force });
    return data;
  }

  /**
   * 删除统计数据
   */
  async deleteTaskStatistics(accountUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${accountUuid}`);
  }

  // ===== 部分更新操作 =====

  /**
   * 更新模板统计信息
   */
  async updateTemplateStats(accountUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${accountUuid}/update-template-stats`);
  }

  /**
   * 更新实例统计信息
   */
  async updateInstanceStats(accountUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${accountUuid}/update-instance-stats`);
  }

  /**
   * 更新完成统计信息
   */
  async updateCompletionStats(accountUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${accountUuid}/update-completion-stats`);
  }

  // ===== 快速查询方法 =====

  /**
   * 获取今日完成率
   */
  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}/today-completion-rate`);
    return data.rate;
  }

  /**
   * 获取本周完成率
   */
  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}/week-completion-rate`);
    return data.rate;
  }

  /**
   * 获取效率趋势
   */
  async getEfficiencyTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}/efficiency-trend`);
    return data.trend;
  }
}

// 导出单例实例
export const taskTemplateApiClient = new TaskTemplateApiClient();
export const taskInstanceApiClient = new TaskInstanceApiClient();
export const taskDependencyApiClient = new TaskDependencyApiClient();
export const taskStatisticsApiClient = new TaskStatisticsApiClient();

