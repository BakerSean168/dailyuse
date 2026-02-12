/**
 * Task Template Application Service
 *
 * Handles TaskTemplate CRUD operations and state management.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * 职责：
 * - TaskTemplate CRUD 操作
 * - TaskTemplate 状态管理（激活、暂停、归档）
 * - 生成任务实例
 * - 目标绑定管理
 */

import type { ITaskTemplateApiClient } from '../../infrastructure-client/adapters/types';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  GenerateInstancesRequest,
  BindToGoalRequest,
} from '@dailyuse/contracts/task';
import { TaskTemplate } from '../../domain-client/aggregates/task-template';
import { TaskInstance } from '../../domain-client/aggregates/task-instance';
import { eventBus } from '@dailyuse/utils';

// Task Events
export const TaskEvents = {
  TEMPLATE_CREATED: 'task:template:created',
  TEMPLATE_UPDATED: 'task:template:updated',
  TEMPLATE_DELETED: 'task:template:deleted',
  TEMPLATE_ACTIVATED: 'task:template:activated',
  TEMPLATE_PAUSED: 'task:template:paused',
  INSTANCES_GENERATED: 'task:instances:generated',
} as const;

export interface TaskTemplateRefreshEvent {
  templateUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task Template Application Service
 */
export class TaskTemplateApplicationService {
  constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  // ===== Task Template CRUD =====

  /**
   * 创建任务模板
   */
  async createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.createTaskTemplate(request);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(template.uuid, TaskEvents.TEMPLATE_CREATED);

    return template;
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }): Promise<TaskTemplate[]> {
    const response = await this.apiClient.getTaskTemplates(params);
    return response.templates.map((dto: TaskTemplateClientDTO) => TaskTemplate.fromClientDTO(dto));
  }

  /**
   * 获取任务模板详情
   */
  async getTaskTemplateById(uuid: string, includeChildren = false): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.getTaskTemplateById(uuid, includeChildren);
    return TaskTemplate.fromClientDTO(templateDTO);
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.updateTaskTemplate(uuid, request);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(uuid, TaskEvents.TEMPLATE_UPDATED);

    return template;
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    await this.apiClient.deleteTaskTemplate(uuid);

    this.publishEvent(uuid, TaskEvents.TEMPLATE_DELETED);
  }

  // ===== Task Template 状态管理 =====

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(uuid: string): Promise<{
    template: TaskTemplate;
    instances: TaskInstance[];
  }> {
    // 激活模板
    await this.apiClient.activateTaskTemplate(uuid);

    // 重新获取完整的模板数据（包含 instances）
    const fullTemplateDTO = await this.apiClient.getTaskTemplateById(uuid, true);
    const fullTemplate = TaskTemplate.fromClientDTO(fullTemplateDTO);

    // 提取 instances
    const instances = fullTemplate.instances || [];

    this.publishEvent(uuid, TaskEvents.TEMPLATE_ACTIVATED, {
      instanceCount: instances.length,
    });

    return {
      template: fullTemplate,
      instances,
    };
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.pauseTaskTemplate(uuid);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(uuid, TaskEvents.TEMPLATE_PAUSED);

    return template;
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.archiveTaskTemplate(uuid);
    return TaskTemplate.fromClientDTO(templateDTO);
  }

  // ===== 聚合根控制：任务实例管理 =====

  /**
   * 生成任务实例
   */
  async generateInstances(
    templateUuid: string,
    request: GenerateInstancesRequest,
  ): Promise<TaskInstance[]> {
    const instanceDTOs = await this.apiClient.generateInstances(templateUuid, request);
    const instances = instanceDTOs.map((dto: TaskInstanceClientDTO) =>
      TaskInstance.fromClientDTO(dto),
    );

    this.publishEvent(templateUuid, TaskEvents.INSTANCES_GENERATED, {
      instanceCount: instances.length,
    });

    return instances;
  }

  /**
   * 获取日期范围内的任务实例
   */
  async getInstancesByDateRange(
    templateUuid: string,
    from: number,
    to: number,
  ): Promise<TaskInstance[]> {
    const instanceDTOs = await this.apiClient.getInstancesByDateRange(templateUuid, from, to);
    return instanceDTOs.map((dto: TaskInstanceClientDTO) => TaskInstance.fromClientDTO(dto));
  }

  // ===== 聚合根控制：目标关联管理 =====

  /**
   * 绑定到目标
   */
  async bindToGoal(templateUuid: string, request: BindToGoalRequest): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.bindToGoal(templateUuid, request);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(templateUuid, TaskEvents.TEMPLATE_UPDATED, {
      goalUuid: request.goalUuid,
    });

    return template;
  }

  /**
   * 解除目标绑定
   */
  async unbindFromGoal(templateUuid: string): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.unbindFromGoal(templateUuid);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(templateUuid, TaskEvents.TEMPLATE_UPDATED, {
      goalUuid: null,
    });

    return template;
  }

  // ===== 辅助方法 =====

  private publishEvent(
    templateUuid: string,
    eventName: string,
    metadata?: Record<string, unknown>,
  ): void {
    const event: TaskTemplateRefreshEvent = {
      templateUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };

    eventBus.emit(eventName, event);
  }
}

/**
 * Factory function to create TaskTemplateApplicationService
 */
export function createTaskTemplateService(
  apiClient: ITaskTemplateApiClient,
): TaskTemplateApplicationService {
  return new TaskTemplateApplicationService(apiClient);
}
