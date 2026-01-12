/**
 * Bind Task Template To Goal
 *
 * 绑定任务模板到目标用例
 */

import type { ITaskTemplateApiClient } from '@dailyuse/infrastructure-client';
import type { BindToGoalRequest } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskTemplate } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import { TaskEvents } from './task-events';

/**
 * Bind Task Template To Goal
 */
export class BindTaskToGoal {
  private static instance: BindTaskToGoal;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): BindTaskToGoal {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    BindTaskToGoal.instance = new BindTaskToGoal(client);
    return BindTaskToGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): BindTaskToGoal {
    if (!BindTaskToGoal.instance) {
      BindTaskToGoal.instance = BindTaskToGoal.createInstance();
    }
    return BindTaskToGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    BindTaskToGoal.instance = undefined as unknown as BindTaskToGoal;
  }

  /**
   * 执行用例
   */
  async execute(
    templateUuid: string,
    goalUuid: string,
    keyResultUuid?: string,
    incrementValue?: number,
  ): Promise<TaskTemplate> {
    const request: BindToGoalRequest = {
      goalUuid,
      keyResultUuid,
      incrementValue,
    };
    const templateDTO = await this.apiClient.bindToGoal(templateUuid, request);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    eventBus.emit(TaskEvents.BOUND_TO_GOAL, {
      templateUuid,
      goalUuid,
      keyResultUuid,
      template
    });

    return template;
  }
}
