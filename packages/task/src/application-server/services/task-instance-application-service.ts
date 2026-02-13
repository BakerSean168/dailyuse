import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { TaskInstance } from '../../domain-server/aggregates/task-instance';
import { TaskExpirationService } from '../../domain-server/services/TaskExpirationService';
import type {
  TaskInstanceClientDTO,
  TaskInstanceStatus,
  TaskInstanceCompletedEvent,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

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
  async getTaskInstance(uuid: string): Promise<Result<TaskInstanceClientDTO | null>> {
    const instance = await this.instanceRepository.findById(uuid);
    return ok(instance ? instance.toClientDTO() : null);
  }

  /**
   * Get Task Instances by Account
   */
  async getTaskInstancesByAccount(
    identityId: string,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByIdentityId(identityId);
    return ok(instances.map((i) => i.toClientDTO()));
  }

  /**
   * Get Task Instances by Template
   */
  async getTaskInstancesByTemplate(
    templateId: string,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByTemplateId(templateId);
    return ok(instances.map((i) => i.toClientDTO()));
  }

  /**
   * Get Task Instances by Date Range
   */
  async getTaskInstancesByDateRange(
    identityId: string,
    startDate: number,
    endDate: number,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByDateRange(
      identityId,
      startDate,
      endDate,
    );
    return ok(instances.map((i) => i.toClientDTO()));
  }

  /**
   * Get Task Instances by Status
   */
  async getTaskInstancesByStatus(
    identityId: string,
    status: TaskInstanceStatus,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByStatus(identityId, status);
    return ok(instances.map((i) => i.toClientDTO()));
  }

  /**
   * Start Task Instance
   */
  async startTaskInstance(uuid: string): Promise<Result<TaskInstanceClientDTO>> {
    const instance = await this.instanceRepository.findById(uuid);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${uuid} not found`);
    }

    if (!instance.canStart()) {
      return error('VALIDATION_ERROR', 'Cannot start this task instance');
    }

    instance.start();
    await this.instanceRepository.save(instance);

    return ok(instance.toClientDTO());
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
  ): Promise<Result<TaskInstanceClientDTO>> {
    const instance = await this.instanceRepository.findById(uuid);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${uuid} not found`);
    }

    if (!instance.canComplete()) {
      return error('VALIDATION_ERROR', 'Cannot complete this task instance');
    }

    // Mark as completed
    instance.complete(params.duration, params.note, params.rating);
    await this.instanceRepository.save(instance);

    // Publish event
    await this.publishTaskCompletedEvent(instance);

    return ok(instance.toClientDTO());
  }

  /**
   * Skip Task Instance
   */
  async skipTaskInstance(
    uuid: string,
    reason?: string,
  ): Promise<Result<TaskInstanceClientDTO>> {
    const instance = await this.instanceRepository.findById(uuid);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${uuid} not found`);
    }

    if (!instance.canSkip()) {
      return error('VALIDATION_ERROR', 'Cannot skip this task instance');
    }

    instance.skip(reason);
    await this.instanceRepository.save(instance);

    return ok(instance.toClientDTO());
  }

  /**
   * Check and mark expired instances
   */
  async checkExpiredInstances(identityId: string): Promise<Result<TaskInstanceClientDTO[]>> {
    // 1. Find all overdue instances
    const overdueInstances = await this.instanceRepository.findOverdueInstances(identityId);

    // 2. Delegate to DomainService to mark as expired
    const expiredInstances = this.expirationService.markExpiredInstances(overdueInstances);

    // 3. Save modified instances
    if (expiredInstances.length > 0) {
      await this.instanceRepository.saveMany(expiredInstances);
    }

    return ok(expiredInstances.map((i) => i.toClientDTO()));
  }

  /**
   * Delete Task Instance
   */
  async deleteTaskInstance(uuid: string): Promise<Result<void>> {
    await this.instanceRepository.delete(uuid);
    return ok(undefined);
  }

  /**
   * Publish Task Completed Event
   * @private
   */
  private async publishTaskCompletedEvent(instance: TaskInstance): Promise<void> {
    try {
      // Get template to fetch goalBinding and title
      const template = await this.templateRepository.findById(instance.templateId);
      if (!template) {
        console.warn(`[TaskInstance] Template not found: ${instance.templateId}`);
        return;
      }

      // Get completion time
      const completedAt = instance.completionRecord?.completedAt || Date.now();

      // Construct event
      const event: TaskInstanceCompletedEvent = {
        eventType: 'task.instance.completed',
        payload: {
          taskInstanceId: instance.id,
          taskTemplateId: instance.templateId,
          title: template.title,
          completedAt,
          identityId: instance.identityId,
          goalBinding: template.goalBinding
            ? {
                goalId: template.goalBinding.goalId,
                keyResultId: template.goalBinding.keyResultId,
                incrementValue: template.goalBinding.incrementValue,
              }
            : undefined,
        },
      };

      // Publish event
      await eventBus.publish(event);

      console.log('? [TaskInstance] Task completion event published', {
        taskInstanceId: instance.id,
        hasGoalBinding: !!template.goalBinding,
      });
    } catch (error) {
      console.error('? [TaskInstance] Failed to publish task completion event', {
        error: error instanceof Error ? error.message : String(error),
        taskInstanceId: instance.id,
      });
      // Do not throw error to avoid impacting task completion flow
    }
  }
}
