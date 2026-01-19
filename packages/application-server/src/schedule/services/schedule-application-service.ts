import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleDomainService } from '@dailyuse/domain-server/schedule';
import type {
  ScheduleTaskClientDTO,
  ScheduleConfigServerDTO,
  RetryPolicyServerDTO,
  ExecutionStatus,
  SourceModule,
  ScheduleTaskStatus,
} from '@dailyuse/contracts/schedule';
import { ScheduleContainer, CronJobManager } from '@dailyuse/infrastructure-server';

/**
 * Schedule 应用服务
 * 负责协调领域服务和仓储，处理调度任务业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class ScheduleApplicationService {
  private static instance: ScheduleApplicationService;
  private domainService: ScheduleDomainService;

  private constructor(
    scheduleTaskRepository: IScheduleTaskRepository,
    scheduleStatisticsRepository: IScheduleStatisticsRepository,
  ) {
    this.domainService = new ScheduleDomainService(
      scheduleTaskRepository,
      scheduleStatisticsRepository,
    );
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    scheduleTaskRepository?: IScheduleTaskRepository,
    scheduleStatisticsRepository?: IScheduleStatisticsRepository,
  ): Promise<ScheduleApplicationService> {
    const container = ScheduleContainer.getInstance();
    const taskRepo = scheduleTaskRepository || container.getScheduleTaskRepository();
    const statsRepo = scheduleStatisticsRepository || container.getScheduleStatisticsRepository();

    ScheduleApplicationService.instance = new ScheduleApplicationService(taskRepo, statsRepo);
    return ScheduleApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<ScheduleApplicationService> {
    if (!ScheduleApplicationService.instance) {
      ScheduleApplicationService.instance = await ScheduleApplicationService.createInstance();
    }
    return ScheduleApplicationService.instance;
  }

  // ===== 任务创建 =====

  /**
   * 创建新的调度任务
   */
  async createScheduleTask(params: {
    accountUuid: string;
    name: string;
    description?: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    schedule: ScheduleConfigServerDTO;
    retryConfig?: RetryPolicyServerDTO;
    payload?: Record<string, unknown>;
    tags?: string[];
  }): Promise<ScheduleTaskClientDTO> {
    // 委托给领域服务处理业务逻辑
    const task = await this.domainService.createScheduleTask(params);

    // 转换为 ClientDTO（API 返回给客户端）
    return task.toClientDTO();
  }

  /**
   * 批量创建调度任务
   */
  async createScheduleTasksBatch(
    params: Array<{
      accountUuid: string;
      name: string;
      description?: string;
      sourceModule: SourceModule;
      sourceEntityId: string;
      schedule: ScheduleConfigServerDTO;
      retryConfig?: RetryPolicyServerDTO;
      payload?: Record<string, unknown>;
      tags?: string[];
    }>,
  ): Promise<ScheduleTaskClientDTO[]> {
    // 委托给领域服务处理
    const tasks = await this.domainService.createScheduleTasksBatch(params);

    // 转换为 ClientDTO 数组
    return tasks.map((task) => task.toClientDTO());
  }

  // ===== 任务查询 =====

  /**
   * 获取任务详情
   */
  async getScheduleTask(taskUuid: string): Promise<ScheduleTaskClientDTO | null> {
    // 通过仓储查询
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    const task = await repository.findByUuid(taskUuid);

    return task ? task.toClientDTO() : null;
  }

  /**
   * 获取账户的所有任务
   */
  async getScheduleTasksByAccount(accountUuid: string): Promise<ScheduleTaskClientDTO[]> {
    // 通过仓储查询
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    const tasks = await repository.findByAccountUuid(accountUuid);

    // 转换为 ClientDTO 数组
    return tasks.map((task) => task.toClientDTO());
  }

  /**
   * 根据来源模块和实体ID查找任务
   */
  async getScheduleTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleTaskClientDTO[]> {
    // 通过仓储查询
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    const tasks = await repository.findBySourceEntity(sourceModule, sourceEntityId);

    return tasks.map((task) => task.toClientDTO());
  }

  /**
   * 查找需要执行的任务
   */
  async findDueTasksForExecution(
    beforeTime: Date,
    limit?: number,
  ): Promise<ScheduleTaskClientDTO[]> {
    // 委托给领域服务处理
    const tasks = await this.domainService.findDueTasksForExecution(beforeTime, limit);

    // 转换为 ClientDTO 数组
    return tasks.map((task) => task.toClientDTO());
  }

  // ===== 任务执行 =====

  /**
   * 执行调度任务
   */
  async executeScheduleTask(
    params: {
      taskUuid: string;
      actualStartedAt?: Date;
    },
    executeFn: (task: ScheduleTaskClientDTO) => Promise<{
      executionUuid: string;
      status: ExecutionStatus;
      duration: number;
      errorMessage?: string;
    }>,
  ): Promise<{
    executionUuid: string;
    status: ExecutionStatus;
    duration: number;
    errorMessage?: string;
  }> {
    // 委托给领域服务处理，需要包装 executeFn
    return await this.domainService.executeScheduleTask(params, async (task) => {
      // 转换为 ClientDTO 后调用
      return await executeFn(task.toClientDTO());
    });
  }

  // ===== 任务生命周期管理 =====

  /**
   * 暂停任务
   */
  async pauseScheduleTask(taskUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.pauseScheduleTask(taskUuid);

    // 停止 Cron 任务
    CronJobManager.getInstance().stopTask(taskUuid);
  }

  /**
   * 恢复任务
   */
  async resumeScheduleTask(taskUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.resumeScheduleTask(taskUuid);

    // 启动 Cron 任务
    CronJobManager.getInstance().startTask(taskUuid);
  }

  /**
   * 完成任务
   */
  async completeScheduleTask(taskUuid: string, reason?: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.completeScheduleTask(taskUuid, reason);

    // 停止 Cron 任务
    CronJobManager.getInstance().stopTask(taskUuid);
  }

  /**
   * 取消任务
   */
  async cancelScheduleTask(taskUuid: string, reason?: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.cancelScheduleTask(taskUuid, reason);

    // 停止 Cron 任务
    CronJobManager.getInstance().stopTask(taskUuid);
  }

  /**
   * 任务失败
   */
  async failScheduleTask(taskUuid: string, reason: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.failScheduleTask(taskUuid, reason);

    // 停止 Cron 任务
    CronJobManager.getInstance().stopTask(taskUuid);
  }

  /**
   * 删除任务
   */
  async deleteScheduleTask(taskUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteScheduleTask(taskUuid);

    // 注销 Cron 任务
    CronJobManager.getInstance().unregisterTask(taskUuid);
  }

  // ===== 任务配置更新 =====

  /**
   * 更新任务调度配置
   */
  async updateScheduleConfig(
    taskUuid: string,
    newSchedule: ScheduleConfigServerDTO,
  ): Promise<void> {
    // 需要转换为值对象
    const { ScheduleConfig } = await import('@dailyuse/domain-server');
    const scheduleVO = ScheduleConfig.fromDTO({
      ...newSchedule,
      startDate: newSchedule.startDate ? new Date(newSchedule.startDate).getTime() : null,
      endDate: newSchedule.endDate ? new Date(newSchedule.endDate).getTime() : null,
    });

    // 委托给领域服务处理
    await this.domainService.updateScheduleConfig(taskUuid, scheduleVO);
  }

  /**
   * 更新任务元数据
   */
  async updateTaskMetadata(
    taskUuid: string,
    options: {
      payload?: Record<string, unknown>;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.updateTaskMetadata(
      taskUuid,
      options.payload,
      options.tagsToAdd,
      options.tagsToRemove,
    );
  }

  // ===== 批量操作 =====

  /**
   * 批量删除任务
   */
  async deleteScheduleTasksBatch(taskUuids: string[]): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteScheduleTasksBatch(taskUuids);

    // 批量注销 Cron 任务
    const manager = CronJobManager.getInstance();
    for (const uuid of taskUuids) {
      manager.unregisterTask(uuid);
    }
  }

  /**
   * 批量暂停任务
   */
  async pauseScheduleTasksBatch(taskUuids: string[]): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.pauseScheduleTasksBatch(taskUuids);

    // 批量停止 Cron 任务
    const manager = CronJobManager.getInstance();
    for (const uuid of taskUuids) {
      manager.stopTask(uuid);
    }
  }

  // ===== 跨模块集成 =====

  /**
   * 根据源模块和实体删除关联的调度任务
   * 用于当源实体（Goal/Task/Reminder）被删除时，清理对应的调度任务
   */
  async deleteScheduleTasksBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
    accountUuid: string,
  ): Promise<void> {
    console.log(
      `🗑️  [ScheduleApplicationService] Deleting schedule tasks for ${sourceModule}:${sourceEntityId}`,
    );

    // 查找所有关联的调度任务
    const tasks = await this.getScheduleTaskBySource(sourceModule, sourceEntityId);

    if (tasks.length === 0) {
      console.log(`ℹ️  [ScheduleApplicationService] No schedule tasks found to delete`);
      return;
    }

    // 验证账户匹配（安全检查）
    const mismatchedTasks = tasks.filter((task) => task.accountUuid !== accountUuid);
    if (mismatchedTasks.length > 0) {
      console.error(
        `❌ [ScheduleApplicationService] Account mismatch for tasks:`,
        mismatchedTasks.map((t) => t.uuid),
      );
      throw new Error('Account UUID mismatch when deleting schedule tasks');
    }

    // 批量删除
    const taskUuids = tasks.map((task) => task.uuid);
    await this.deleteScheduleTasksBatch(taskUuids);

    console.log(
      `✅ [ScheduleApplicationService] Deleted ${taskUuids.length} schedule task(s) for ${sourceModule}:${sourceEntityId}`,
    );
  }
}
