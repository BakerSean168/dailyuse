/**
 * Delete Task Template Service
 *
 * 删除任务模板
 */

import type { ITaskTemplateRepository } from '@dailyuse/domain-server/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';

/**
 * Delete Task Template Service
 */
export class DeleteTaskTemplate {
  private static instance: DeleteTaskTemplate;

  private constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(templateRepository?: ITaskTemplateRepository): DeleteTaskTemplate {
    const container = TaskContainer.getInstance();
    const repo = templateRepository || container.getTemplateRepository();
    DeleteTaskTemplate.instance = new DeleteTaskTemplate(repo);
    return DeleteTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteTaskTemplate {
    if (!DeleteTaskTemplate.instance) {
      DeleteTaskTemplate.instance = DeleteTaskTemplate.createInstance();
    }
    return DeleteTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteTaskTemplate.instance = undefined as unknown as DeleteTaskTemplate;
  }

  async execute(uuid: string, soft = false): Promise<{ success: boolean }> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      // 幂等性：如果模板不存在，直接返回成功
      return { success: true };
    }

    if (soft) {
      await this.templateRepository.softDelete(uuid);
    } else {
      await this.templateRepository.delete(uuid);
    }

    // 发布删除事件
    try {
      await eventBus.publish({
        eventType: 'task.template.deleted',
        payload: {
          taskTemplateUuid: uuid,
          accountUuid: template.accountUuid,
          deletedAt: Date.now(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`�?[DeleteTaskTemplate] 发布删除事件失败:`, error);
    }

    return { success: true };
  }
}

