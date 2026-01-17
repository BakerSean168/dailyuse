import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
  TaskInstance,
} from '@dailyuse/domain-server/task';
import { TaskExpirationService } from '@dailyuse/domain-server/task';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';
import type {
  TaskInstanceClientDTO,
  TaskInstanceStatus,
  TaskInstanceCompletedEvent,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';

/**
 * TaskInstance 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责�?
 * - 委托�?DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain �?Contracts�?
 */
export class TaskInstanceApplicationService {
  private static instance: TaskInstanceApplicationService;
  private expirationService: TaskExpirationService;
  private instanceRepository: ITaskInstanceRepository;
  private templateRepository: ITaskTemplateRepository;

  private constructor(
    instanceRepository: ITaskInstanceRepository,
    templateRepository: ITaskTemplateRepository,
  ) {
    this.expirationService = new TaskExpirationService();
    this.instanceRepository = instanceRepository;
    this.templateRepository = templateRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    instanceRepository?: ITaskInstanceRepository,
    templateRepository?: ITaskTemplateRepository,
  ): Promise<TaskInstanceApplicationService> {
    const container = TaskContainer.getInstance();
    const instanceRepo = instanceRepository || container.getTaskInstanceRepository();
    const templateRepo = templateRepository || container.getTaskTemplateRepository();

    TaskInstanceApplicationService.instance = new TaskInstanceApplicationService(
      instanceRepo,
      templateRepo,
    );
    return TaskInstanceApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<TaskInstanceApplicationService> {
    if (!TaskInstanceApplicationService.instance) {
      TaskInstanceApplicationService.instance =
        await TaskInstanceApplicationService.createInstance();
    }
    return TaskInstanceApplicationService.instance;
  }

  // ===== TaskInstance 管理 =====

  /**
   * 获取任务实例详情
   */
  async getTaskInstance(uuid: string): Promise<TaskInstanceClientDTO | null> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    return instance ? instance.toClientDTO() : null;
  }

  /**
   * 根据账户获取任务实例列表
   */
  async getTaskInstancesByAccount(
    accountUuid: string,
  ): Promise<TaskInstanceClientDTO[]> {
    const instances = await this.instanceRepository.findByAccount(accountUuid);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 根据模板获取任务实例列表
   */
  async getTaskInstancesByTemplate(
    templateUuid: string,
  ): Promise<TaskInstanceClientDTO[]> {
    const instances = await this.instanceRepository.findByTemplate(templateUuid);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 根据日期范围获取任务实例
   */
  async getTaskInstancesByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstanceClientDTO[]> {
    const instances = await this.instanceRepository.findByDateRange(
      accountUuid,
      startDate,
      endDate,
    );
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 根据状态获取任务实�?
   */
  async getTaskInstancesByStatus(
    accountUuid: string,
    status: TaskInstanceStatus,
  ): Promise<TaskInstanceClientDTO[]> {
    const instances = await this.instanceRepository.findByStatus(accountUuid, status);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 开始任务实�?
   */
  async startTaskInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canStart()) {
      throw new Error('Cannot start this task instance');
    }

    instance.start();
    await this.instanceRepository.save(instance);

    return instance.toClientDTO();
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    uuid: string,
    params: {
      duration?: number;
      note?: string;
      rating?: number;
    },
  ): Promise<TaskInstanceClientDTO> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canComplete()) {
      throw new Error('Cannot complete this task instance');
    }

    // 标记为完�?
    instance.complete(params.duration, params.note, params.rating);
    await this.instanceRepository.save(instance);

    // 🔥 发布事件：任务实例完�?
    await this.publishTaskCompletedEvent(instance);

    return instance.toClientDTO();
  }

  /**
   * 跳过任务实例
   */
  async skipTaskInstance(
    uuid: string,
    reason?: string,
  ): Promise<TaskInstanceClientDTO> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canSkip()) {
      throw new Error('Cannot skip this task instance');
    }

    instance.skip(reason);
    await this.instanceRepository.save(instance);

    return instance.toClientDTO();
  }

  /**
   * 检查并标记过期的任务实�?
   */
  async checkExpiredInstances(accountUuid: string): Promise<TaskInstanceClientDTO[]> {
    // 1. 查找所有过期的任务实例
    const overdueInstances = await this.instanceRepository.findOverdueInstances(accountUuid);

    // 2. 委托给领域服务标记过�?
    const expiredInstances = this.expirationService.markExpiredInstances(overdueInstances);

    // 3. 保存修改后的实例
    if (expiredInstances.length > 0) {
      await this.instanceRepository.saveMany(expiredInstances);
    }

    return expiredInstances.map((i) => i.toClientDTO());
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    await this.instanceRepository.delete(uuid);
  }

  /**
   * 发布任务完成事件
   * @private
   */
  private async publishTaskCompletedEvent(instance: TaskInstance): Promise<void> {
    try {
      // 获取任务模板以获�?goalBinding �?title 信息
      const template = await this.templateRepository.findByUuid(instance.templateUuid);
      if (!template) {
        console.warn(`[TaskInstance] Template not found: ${instance.templateUuid}`);
        return;
      }

      // 获取完成时间
      const completedAt = instance.completionRecord?.completedAt || Date.now();

      // 构造事�?
      const event: TaskInstanceCompletedEvent = {
        eventType: 'task.instance.completed',
        payload: {
          taskInstanceUuid: instance.uuid,
          taskTemplateUuid: instance.templateUuid,
          title: template.title,
          completedAt,
          accountUuid: instance.accountUuid,
          goalBinding: template.goalBinding
            ? {
                goalUuid: template.goalBinding.goalUuid,
                keyResultUuid: template.goalBinding.keyResultUuid,
                incrementValue: template.goalBinding.incrementValue,
              }
            : undefined,
        },
      };

      // 发布事件
      await eventBus.publish(event);

      console.log('�?[TaskInstance] Task completion event published', {
        taskInstanceUuid: instance.uuid,
        hasGoalBinding: !!template.goalBinding,
      });
    } catch (error) {
      console.error('�?[TaskInstance] Failed to publish task completion event', {
        error: error instanceof Error ? error.message : String(error),
        taskInstanceUuid: instance.uuid,
      });
      // 不抛出错误，避免影响任务完成流程
    }
  }
}
