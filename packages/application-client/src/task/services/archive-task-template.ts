/**
 * Archive Task Template
 *
 * 归档任务模板用例
 */

import type { ITaskTemplateApiClient } from '@dailyuse/infrastructure-client';
import { TaskTemplate } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * Archive Task Template
 */
export class ArchiveTaskTemplate {
  private static instance: ArchiveTaskTemplate;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): ArchiveTaskTemplate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    ArchiveTaskTemplate.instance = new ArchiveTaskTemplate(client);
    return ArchiveTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ArchiveTaskTemplate {
    if (!ArchiveTaskTemplate.instance) {
      ArchiveTaskTemplate.instance = ArchiveTaskTemplate.createInstance();
    }
    return ArchiveTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ArchiveTaskTemplate.instance = undefined as unknown as ArchiveTaskTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.archiveTaskTemplate(uuid);
    return TaskTemplate.fromClientDTO(templateDTO);
  }
}
