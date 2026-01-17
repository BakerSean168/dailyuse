/**
 * List Task Templates Service
 *
 * 获取任务模板列表（按账户�?
 * 获取时自动检查并补充实例
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
  TaskTemplate,
} from '@dailyuse/domain-server/task';
import { TaskInstanceGenerationService } from '@dailyuse/domain-server/task';
import type {
  TaskTemplateClientDTO,
  QueryTaskTemplatesRequest,
  TaskTemplatesResponse,
} from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';

/**
 * List Task Templates Service
 */
export class ListTaskTemplates {
  private static instance: ListTaskTemplates;
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
  ): ListTaskTemplates {
    const container = TaskContainer.getInstance();
    const templateRepo = templateRepository || container.getTemplateRepository();
    const instanceRepo = instanceRepository || container.getInstanceRepository();
    ListTaskTemplates.instance = new ListTaskTemplates(templateRepo, instanceRepo);
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

  async execute(request: QueryTaskTemplatesRequest): Promise<TaskTemplatesResponse> {
    let templates: TaskTemplate[];

    // 根据不同条件查询
    if (request.status && request.status.length > 0) {
      templates = await this.templateRepository.findByStatus(request.accountUuid, request.status[0]);
    } else if (request.folderUuid) {
      templates = await this.templateRepository.findByFolder(request.folderUuid);
    } else if (request.goalUuid) {
      templates = await this.templateRepository.findByGoal(request.goalUuid);
    } else if (request.tags && request.tags.length > 0) {
      templates = await this.templateRepository.findByTags(request.accountUuid, request.tags);
    } else {
      templates = await this.templateRepository.findByAccount(request.accountUuid);
    }

    // 自动检查并补充每个 ACTIVE 模板的实例（异步执行，不阻塞�?
    for (const template of templates) {
      if (template.status === TaskTemplateStatus.ACTIVE) {
        this.checkAndRefillInstances(template).catch((error) => {
          console.error(`�?补充模板 "${template.title}" 实例失败:`, error);
        });
      }
    }

    return {
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    };
  }

  /**
   * 检查并补充模板实例
   */
  private async checkAndRefillInstances(template: TaskTemplate): Promise<void> {
    try {
      if (this.generationService.shouldRefillInstances(template)) {
        const instances = this.generationService.generateInstances(template);

        if (instances.length > 0) {
          await this.instanceRepository.saveMany(instances);
          await this.templateRepository.save(template);

          eventBus.emit('task.instances.generated', {
            eventType: 'task_template.instances_generated',
            aggregateId: template.uuid,
            accountUuid: template.accountUuid,
            payload: {
              templateUuid: template.uuid,
              templateTitle: template.title,
              instanceCount: instances.length,
            },
          });
        }
      }
    } catch (error) {
      console.error(`�?[ListTaskTemplates] 补充实例失败:`, error);
    }
  }
}

