/**
 * Task Template API Client Port
 *
 * 定义任务模板 API 客户端接口。
 * 使用依赖注入模式，适配器在运行时注入。
 */

import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  GenerateInstancesRequest,
  BindToGoalRequest,
} from '@dailyuse/contracts/task';

/**
 * ITaskTemplateApiClient
 *
 * 任务模板 API 客户端接口
 */
export interface ITaskTemplateApiClient {
  // ===== Task Template CRUD =====

  /**
   * 创建任务模板
   */
  createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO>;

  /**
   * 获取任务模板列表
   */
  getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderUuid?: string;
    goalUuid?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<{ templates: TaskTemplateClientDTO[]; total: number }>;

  /**
   * 获取任务模板详情
   */
  getTaskTemplateById(uuid: string, includeChildren?: boolean): Promise<TaskTemplateClientDTO>;

  /**
   * 更新任务模板
   */
  updateTaskTemplate(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateClientDTO>;

  /**
   * 删除任务模板
   */
  deleteTaskTemplate(uuid: string): Promise<void>;

  // ===== 方法别名（为了兼容 View 层调用）=====

  /**
   * 创建任务模板（别名）
   */
  create(request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO>;

  /**
   * 根据 UUID 获取任务模板（别名）
   */
  getByUuid(uuid: string): Promise<TaskTemplateClientDTO>;

  /**
   * 更新任务模板（别名）
   */
  update(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateClientDTO>;

  /**
   * 从后端获取已按优先级排序的任务列表，包含 priority 字段
   */
  getTasksWithPrioritySorting(params?: { limit?: number }): Promise<TaskTemplateClientDTO[]>;

  // ===== Task Template 状态管理 =====

  /**
   * 激活任务模板
   */
  activateTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO>;

  /**
   * 暂停任务模板
   */
  pauseTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO>;

  /**
   * 归档任务模板
   */
  archiveTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO>;

  // ===== 聚合根控制：任务实例管理 =====

  /**
   * 生成任务实例
   */
  generateInstances(
    templateUuid: string,
    request: GenerateInstancesRequest,
  ): Promise<TaskInstanceClientDTO[]>;

  /**
   * 根据日期范围获取模板实例
   */
  getInstancesByDateRange(
    templateUuid: string,
    from: number,
    to: number,
  ): Promise<TaskInstanceClientDTO[]>;

  // ===== 聚合根控制：目标关联管理 =====

  /**
   * 绑定到目标
   */
  bindToGoal(templateUuid: string, request: BindToGoalRequest): Promise<TaskTemplateClientDTO>;

  /**
   * 解除目标绑定
   */
  unbindFromGoal(templateUuid: string): Promise<TaskTemplateClientDTO>;
}
