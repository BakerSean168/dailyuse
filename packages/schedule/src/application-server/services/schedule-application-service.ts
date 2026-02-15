import type { IScheduleTaskRepository } from '../../domain-server/repositories/IScheduleTaskRepository';
import type { IScheduleStatisticsRepository } from '../../domain-server/repositories/IScheduleStatisticsRepository';
import { ScheduleDomainService } from '../../domain-server/services/ScheduleDomainService';
import type {
  ScheduleTaskClientDTO,
  ScheduleConfigServerDTO,
  RetryPolicyServerDTO,
  SourceModule,
  ScheduleTaskStatus,
} from '@dailyuse/contracts/schedule';

/**
 * Schedule Application Service
 * Responsible for coordinating domain services and repositories to handle scheduling tasks.
 *
 * @deprecated 此服务已废弃，请使用独立的 Use Case 替代：
 * - CreateScheduleTaskUseCase
 * - UpdateScheduleTaskUseCase
 * - DeleteScheduleTaskUseCase
 * - PauseScheduleTaskUseCase
 * - ResumeScheduleTaskUseCase
 * - TriggerScheduleTaskUseCase
 * - GetScheduleTaskUseCase
 * - ListScheduleTasksByAccountUseCase
 * - ListScheduleTasksBySourceUseCase
 * - ListScheduleTasksByStatusUseCase
 * 
 * 【DDD 重构说明】
 * 原因：违反单一职责原则，包含过多业务场景。
 * 新架构：每个业务场景对应一个独立的 Use Case 类。
 * 
 * Responsibilities:
 * - Delegate business logic to DomainService
 * - Coordinate repositories
 * - Transaction management (if needed)
 * - DTO conversion (Domain <-> Contracts)
 */
export class ScheduleApplicationService {
  private domainService: ScheduleDomainService;

  constructor(
    private scheduleTaskRepository: IScheduleTaskRepository,
    private scheduleStatisticsRepository: IScheduleStatisticsRepository,
  ) {
    this.domainService = new ScheduleDomainService(
      scheduleTaskRepository,
      scheduleStatisticsRepository,
    );
  }

  // ===== Task Creation =====

  /**
   * Create a new schedule task
   */
  async createScheduleTask(params: {
    name: string;
    sourceModule: SourceModule;
    sourceId: string;
    scheduleConfig: ScheduleConfigServerDTO;
    handlerType: string;
    handlerPayload?: any;
    priority?: number;
    retryPolicy?: RetryPolicyServerDTO;
    enabled?: boolean;
    description?: string;
    accountUuid: string;
  }): Promise<ScheduleTaskClientDTO> {
    const task = await this.domainService.createScheduleTask({
      name: params.name,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceId,
      schedule: params.scheduleConfig,
      payload: params.handlerPayload,
      description: params.description,
      accountUuid: params.accountUuid,
      retryConfig: params.retryPolicy,
      tags: [],
    });

    return task.toClientDTO();
  }

  // ===== Task Management =====

  /**
   * Update task configuration
   */
  async updateScheduleTask(
    uuid: string,
    params: {
      scheduleConfig?: ScheduleConfigServerDTO;
      retryPolicy?: RetryPolicyServerDTO;
      enabled?: boolean;
      description?: string;
      handlerPayload?: any;
    },
  ): Promise<ScheduleTaskClientDTO> {
    const task = await this.scheduleTaskRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Schedule task ${uuid} not found`);
    }

    if (params.description !== undefined) {
      task.updateMetadata({ description: params.description });
    }
    if (params.enabled !== undefined) {
      if (params.enabled) {
        task.enable();
      } else {
        task.disable();
      }
    }
    if (params.scheduleConfig !== undefined) {
      task.updateSchedule(params.scheduleConfig);
    }
    if (params.retryPolicy !== undefined) {
      task.updateRetryPolicy(params.retryPolicy);
    }
    if (params.handlerPayload !== undefined) {
      task.updatePayload(params.handlerPayload);
    }

    await this.scheduleTaskRepository.save(task);
    return task.toClientDTO();
  }

  /**
   * Delete schedule task
   */
  async deleteScheduleTask(uuid: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Schedule task ${uuid} not found`);
    }
    // Hard delete or Soft delete depending on requirements
    await this.scheduleTaskRepository.deleteByUuid(uuid);
  }

  /**
   * Pause task
   */
  async pauseTask(uuid: string): Promise<ScheduleTaskClientDTO> {
    return this.toggleTaskStatus(uuid, false);
  }

  /**
   * Resume task
   */
  async resumeTask(uuid: string): Promise<ScheduleTaskClientDTO> {
    return this.toggleTaskStatus(uuid, true);
  }

  /**
   * Trigger task manually
   */
  async triggerTask(uuid: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(uuid);
    if (!task) {
        throw new Error(`Schedule task ${uuid} not found`);
    }
    // This connects to the execution engine usually.
    // For this refactor, we focus on the service structure.
    // The execution is managed by the execution engine/scheduler
    // For now, just recalculate the next run time
    task.calculateNextRun();
    await this.scheduleTaskRepository.save(task);
  }

  // ===== Queries =====

  async getScheduleTask(uuid: string): Promise<ScheduleTaskClientDTO | null> {
    const task = await this.scheduleTaskRepository.findByUuid(uuid);
    return task ? task.toClientDTO() : null;
  }

  async getScheduleTasksByAccount(accountUuid: string): Promise<ScheduleTaskClientDTO[]> {
    const tasks = await this.scheduleTaskRepository.findByAccountUuid(accountUuid);
    return tasks.map((t: any) => t.toClientDTO());
  }

  async getScheduleTasksBySource(sourceModule: SourceModule, sourceId: string): Promise<ScheduleTaskClientDTO[]> {
    const tasks = await this.scheduleTaskRepository.findBySourceEntity(sourceModule, sourceId);
    return tasks.map((t: any) => t.toClientDTO());
  }
  
  async getTasksByStatus(status: ScheduleTaskStatus): Promise<ScheduleTaskClientDTO[]> {
    const tasks = await this.scheduleTaskRepository.findByStatus(status);
    return tasks.map((t: any) => t.toClientDTO());
  }

  // Helper
  private async toggleTaskStatus(uuid: string, enable: boolean): Promise<ScheduleTaskClientDTO> {
    const task = await this.scheduleTaskRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Schedule task ${uuid} not found`);
    }
    
    if (enable) task.enable();
    else task.disable();
    
    await this.scheduleTaskRepository.save(task);
    return task.toClientDTO();
  }
}
