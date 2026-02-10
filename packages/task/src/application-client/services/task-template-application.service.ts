/**
 * Task Template Application Service
 * 任务模板应用服务 - 负责任务模板的 CRUD 操作
 * 
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 * 
 * 📝 错误处理说明：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Service 直接抛出错误，由 Composable 层统一处理
 */

import { TaskTemplate, TaskInstance } from '@/domain-client';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
} from '@dailyuse/contracts/task';
import { taskTemplateApiClient } from '@/infrastructure-client';

export class TaskTemplateApplicationService {
  private static instance: TaskTemplateApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): TaskTemplateApplicationService {
    TaskTemplateApplicationService.instance = new TaskTemplateApplicationService();
    return TaskTemplateApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): TaskTemplateApplicationService {
    if (!TaskTemplateApplicationService.instance) {
      TaskTemplateApplicationService.instance = TaskTemplateApplicationService.createInstance();
    }
    return TaskTemplateApplicationService.instance;
  }

  /**
   * 创建任务模板
   * @returns 返回创建的实体对象，调用方负责存储
   */
  async createTaskTemplate(request: any): Promise<TaskTemplate> {
    const templateDTO = await taskTemplateApiClient.createTaskTemplate(request);
    return TaskTemplate.fromClientDTO(templateDTO);
  }

  /**
   * 获取任务模板列表
   * @returns 返回实体对象数组，调用方负责存储
   */
  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }): Promise<TaskTemplate[]> {
    const templates = await taskTemplateApiClient.getTaskTemplates(params);
    return templates.map((dto: TaskTemplateClientDTO) => TaskTemplate.fromClientDTO(dto));
  }

  /**
   * 获取任务模板详情
   * @returns 返回实体对象，调用方负责存储
   */
  async getTaskTemplateById(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await taskTemplateApiClient.getTaskTemplateById(uuid);
    return TaskTemplate.fromClientDTO(templateDTO);
  }

  /**
   * 更新任务模板
   * @deprecated 后端 API 不支持部分更新，请使用具体的更新方法
   */
  async updateTaskTemplate(_uuid: string, _request: any): Promise<never> {
    throw new Error('updateTaskTemplate is not supported - use specific update methods instead');
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    await taskTemplateApiClient.deleteTaskTemplate(uuid);
  }

  /**
   * 激活任务模板
   * @returns 返回激活后的模板（包含生成的 instances）
   */
  async activateTaskTemplate(uuid: string): Promise<{
    template: TaskTemplate;
    instances: TaskInstance[];
  }> {
    // 先激活模板
    await taskTemplateApiClient.activateTaskTemplate(uuid);

    // 重新获取完整的模板数据（包含 instances）
    const fullTemplateDTO = await taskTemplateApiClient.getTaskTemplateById(uuid);
    const fullTemplate = TaskTemplate.fromClientDTO(fullTemplateDTO);

    // 提取 instances
    const instances = fullTemplate.instances || [];

    return {
      template: fullTemplate,
      instances,
    };
  }

  /**
   * 暂停任务模板
   * @returns 返回暂停后的模板实体
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await taskTemplateApiClient.pauseTaskTemplate(uuid);
    return TaskTemplate.fromClientDTO(templateDTO);
  }

  /**
   * 搜索任务模板
   * @deprecated 后端 API 不支持搜索功能，请使用 getTaskTemplates 过滤
   */
  async searchTaskTemplates(_params: {
    query: string;
    page?: number;
    limit?: number;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<never> {
    throw new Error('searchTaskTemplates is not supported - use getTaskTemplates with filters instead');
  }
}

/**
 * 导出单例实例
 */
export const taskTemplateApplicationService = TaskTemplateApplicationService.getInstance();

