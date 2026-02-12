/**
 * Unbind Task Template From Goal
 *
 * 解绑任务模板与目标用例
 */

import type { ITaskTemplateApiClient } from '../../infrastructure-client/adapters/types';
import { eventBus } from '@dailyuse/utils';
import { TaskTemplate } from '../../domain-client/aggregates/task-template';
import { TaskContainer } from '../../infrastructure-client/task.container';
import { TaskEvents } from './task-events';

/**
 * Unbind Task Template From Goal
 */
export class UnbindTaskFromGoal {
  private static instance: UnbindTaskFromGoal;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): UnbindTaskFromGoal {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    UnbindTaskFromGoal.instance = new UnbindTaskFromGoal(client);
    return UnbindTaskFromGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UnbindTaskFromGoal {
    if (!UnbindTaskFromGoal.instance) {
      UnbindTaskFromGoal.instance = UnbindTaskFromGoal.createInstance();
    }
    return UnbindTaskFromGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UnbindTaskFromGoal.instance = undefined as unknown as UnbindTaskFromGoal;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.unbindFromGoal(uuid);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    eventBus.emit(TaskEvents.UNBOUND_FROM_GOAL, {
      templateUuid: uuid,
      template
    });

    return template;
  }
}
