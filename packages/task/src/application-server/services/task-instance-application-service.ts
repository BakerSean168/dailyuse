import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
  TaskInstance,
} from '@/domain-server';
import { TaskExpirationService } from '@/domain-server';
import type {
  TaskInstanceClientDTO,
  TaskInstanceStatus,
  TaskInstanceCompletedEvent,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';

/**
 * TaskInstance Application Service
 * Responsible for orchestrating TaskInstance domain logic and persistence.
 *
 * Responsibilities:
 * - Delegate business rules to DomainService
 * - Coordinate repositories
 * - Manage transactions (via injected TM if needed)
 * - DTO conversion
 */
export class TaskInstanceApplicationService {
  private expirationService: TaskExpirationService;
  private instanceRepository: ITaskInstanceRepository;
  private templateRepository: ITaskTemplateRepository;

  constructor(
    instanceRepository: ITaskInstanceRepository,
    templateRepository: ITaskTemplateRepository,
  ) {
    this.expirationService = new TaskExpirationService();
    this.instanceRepository = instanceRepository;
    this.templateRepository = templateRepository;
  }

  // ===== TaskInstance Management =====

  /**
   * Get Task Instance Details
   */
  async getTaskInstance(uuid: string): Promise<TaskInstanceClientDTO | null> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    return instance ? instance.toClientDTO() : null;
  }

  /**
   * Get Task Instances by Account
   */
  async getTaskInstancesByAccount(
    accountUuid: string,
  ): Promise<TaskInstanceClientDTO[]> {
    const instances = await this.instanceRepository.findByAccount(accountUuid);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * Get Task Instances by Template
   */
  async getTaskInstancesByTemplate(
    templateUuid: string,
  ): Promise<TaskInstanceClientDTO[]> {
    const instances = await this.instanceRepository.findByTemplate(templateUuid);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * Get Task Instances by Date Range
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
   * Get Task Instances by Status
   */
  async getTaskInstancesByStatus(
    accountUuid: string,
    status: TaskInstanceStatus,
  ): Promise<TaskInstanceClientDTO[]> {
    const instances = await this.instanceRepository.findByStatus(accountUuid, status);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * Start Task Instance
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
   * Complete Task Instance
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

    // Mark as completed
    instance.complete(params.duration, params.note, params.rating);
    await this.instanceRepository.save(instance);

    // Publish event
    await this.publishTaskCompletedEvent(instance);

    return instance.toClientDTO();
  }

  /**
   * Skip Task Instance
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
   * Check and mark expired instances
   */
  async checkExpiredInstances(accountUuid: string): Promise<TaskInstanceClientDTO[]> {
    // 1. Find all overdue instances
    const overdueInstances = await this.instanceRepository.findOverdueInstances(accountUuid);

    // 2. Delegate to DomainService to mark as expired
    const expiredInstances = this.expirationService.markExpiredInstances(overdueInstances);

    // 3. Save modified instances
    if (expiredInstances.length > 0) {
      await this.instanceRepository.saveMany(expiredInstances);
    }

    return expiredInstances.map((i) => i.toClientDTO());
  }

  /**
   * Delete Task Instance
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    await this.instanceRepository.delete(uuid);
  }

  /**
   * Publish Task Completed Event
   * @private
   */
  private async publishTaskCompletedEvent(instance: TaskInstance): Promise<void> {
    try {
      // Get template to fetch goalBinding and title
      const template = await this.templateRepository.findByUuid(instance.templateUuid);
      if (!template) {
        console.warn(`[TaskInstance] Template not found: ${instance.templateUuid}`);
        return;
      }

      // Get completion time
      const completedAt = instance.completionRecord?.completedAt || Date.now();

      // Construct event
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

      // Publish event
      await eventBus.publish(event);

      console.log('? [TaskInstance] Task completion event published', {
        taskInstanceUuid: instance.uuid,
        hasGoalBinding: !!template.goalBinding,
      });
    } catch (error) {
      console.error('? [TaskInstance] Failed to publish task completion event', {
        error: error instanceof Error ? error.message : String(error),
        taskInstanceUuid: instance.uuid,
      });
      // Do not throw error to avoid impacting task completion flow
    }
  }
}
