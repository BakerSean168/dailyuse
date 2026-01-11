/**
 * Activate Task Template Service
 *
 * 激活任务模板
 * 业务逻辑：
 * 1. 修改模板状态为 ACTIVE
 * 2. 立即生成实例
 * 3. 发布恢复事件，触发提醒调度恢复
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@dailyuse/domain-server/task';
import { TaskInstanceGenerationService } from '@dailyuse/domain-server/task';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Activate Task Template Service
 */
export class ActivateTaskTemplate {
  private static instance: ActivateTaskTemplate;
  private readonly generationService: TaskInstanceGenerationService;

  private constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    templateRepository?: ITaskTemplateRepository,
    instanceRepository?: ITaskInstanceRepository,
  ): ActivateTaskTemplate {
    const container = TaskContainer.getInstance();
    const templateRepo = templateRepository || container.getTemplateRepository();
    const instanceRepo = instanceRepository || container.getInstanceRepository();
    ActivateTaskTemplate.instance = new ActivateTaskTemplate(templateRepo, instanceRepo);
    return ActivateTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ActivateTaskTemplate {
    if (!ActivateTaskTemplate.instance) {
      ActivateTaskTemplate.instance = ActivateTaskTemplate.createInstance();
    }
    return ActivateTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ActivateTaskTemplate.instance = undefined as unknown as ActivateTaskTemplate;
  }

  async execute(uuid: string): Promise<{ template: TaskTemplateClientDTO; instancesGenerated: number }> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    // 1. 激活模板状态
    template.activate();
    await this.templateRepository.save(template);

    // 2. 生成实例
    const instances = this.generationService.generateInstances(template);
    let instancesGenerated = 0;

    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
      instancesGenerated = instances.length;
    }

    // 3. 发布恢复事件
    try {
      await eventBus.publish({
        eventType: 'task.template.resumed',
        payload: {
          taskTemplateUuid: template.uuid,
          taskTemplateTitle: template.title,
          accountUuid: template.accountUuid,
          resumedAt: Date.now(),
          taskTemplateData: template.toServerDTO(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`❌ [ActivateTaskTemplate] 发布恢复事件失败:`, error);
    }

    return {
      template: template.toClientDTO(),
      instancesGenerated,
    };
  }
}
