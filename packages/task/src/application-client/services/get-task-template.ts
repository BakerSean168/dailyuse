/**
 * Get Task Template
 *
 * 获取任务模板详情用例
 */

import type { ITaskTemplateApiClient } from '../../infrastructure-client/adapters/types';
import { TaskTemplate } from '../../domain-client/aggregates/task-template';
import { TaskContainer } from '../../infrastructure-client/task.container';

/**
 * Get Task Template
 */
export class GetTaskTemplate {
  private static instance: GetTaskTemplate;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): GetTaskTemplate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    GetTaskTemplate.instance = new GetTaskTemplate(client);
    return GetTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskTemplate {
    if (!GetTaskTemplate.instance) {
      GetTaskTemplate.instance = GetTaskTemplate.createInstance();
    }
    return GetTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskTemplate.instance = undefined as unknown as GetTaskTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, includeChildren = false): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.getTaskTemplateById(uuid, includeChildren);
    return TaskTemplate.fromClientDTO(templateDTO);
  }
}
