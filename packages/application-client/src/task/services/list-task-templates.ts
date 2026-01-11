/**
 * List Task Templates
 *
 * 获取任务模板列表用例
 */

import type { ITaskTemplateApiClient } from '@dailyuse/infrastructure-client';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskTemplate } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * List Task Templates Input
 */
export interface ListTaskTemplatesInput {
  page?: number;
  limit?: number;
  status?: string;
  goalUuid?: string;
}

/**
 * List Task Templates
 */
export class ListTaskTemplates {
  private static instance: ListTaskTemplates;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): ListTaskTemplates {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    ListTaskTemplates.instance = new ListTaskTemplates(client);
    return ListTaskTemplates.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListTaskTemplates {
    if (!ListTaskTemplates.instance) {
      ListTaskTemplates.instance = ListTaskTemplates.createInstance();
    }
    return ListTaskTemplates.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListTaskTemplates.instance = undefined as unknown as ListTaskTemplates;
  }

  /**
   * 执行用例
   */
  async execute(input: ListTaskTemplatesInput = {}): Promise<TaskTemplate[]> {
    const response = await this.apiClient.getTaskTemplates(input);
    return response.templates.map((dto: TaskTemplateClientDTO) => TaskTemplate.fromClientDTO(dto));
  }
}

/**
 * 便捷函数
 */
export const listTaskTemplates = (input: ListTaskTemplatesInput = {}): Promise<TaskTemplate[]> =>
  ListTaskTemplates.getInstance().execute(input);
