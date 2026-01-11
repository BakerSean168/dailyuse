/**
 * Get Task Template Service
 *
 * 获取任务模板详情
 */

import type { ITaskTemplateRepository } from '@dailyuse/domain-server/task';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Task Template Service
 */
export class GetTaskTemplate {
  private static instance: GetTaskTemplate;

  private constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(templateRepository?: ITaskTemplateRepository): GetTaskTemplate {
    const container = TaskContainer.getInstance();
    const repo = templateRepository || container.getTemplateRepository();
    GetTaskTemplate.instance = new GetTaskTemplate(repo);
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

  async execute(uuid: string, includeChildren = false): Promise<TaskTemplateResponse> {
    const template = includeChildren
      ? await this.templateRepository.findByUuidWithChildren(uuid)
      : await this.templateRepository.findByUuid(uuid);

    return {
      template: template ? template.toClientDTO(includeChildren) : (null as unknown as TaskTemplateClientDTO),
    };
  }
}
