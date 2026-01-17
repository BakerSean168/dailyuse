/**
 * TaskDependency Application Service
 * 任务依赖关系应用服务
 *
 * 职责�?
 * - 协调领域服务和仓�?
 * - 处理依赖关系业务用例
 * - DTO 转换
 */

import type {
  ITaskDependencyRepository,
  ITaskTemplateRepository,
} from '@dailyuse/domain-server/task';
import { TaskDependencyService } from '@dailyuse/domain-server/task';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';
import type {
  TaskDependencyServerDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainServerDTO,
} from '@dailyuse/contracts/task';

export class TaskDependencyApplicationService {
  private static instance: TaskDependencyApplicationService;
  private dependencyService: TaskDependencyService;
  private dependencyRepository: ITaskDependencyRepository;
  private taskRepository: ITaskTemplateRepository;

  private constructor(
    dependencyService: TaskDependencyService,
    dependencyRepository: ITaskDependencyRepository,
    taskRepository: ITaskTemplateRepository,
  ) {
    this.dependencyService = dependencyService;
    this.dependencyRepository = dependencyRepository;
    this.taskRepository = taskRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    dependencyService?: TaskDependencyService,
    dependencyRepository?: ITaskDependencyRepository,
    taskRepository?: ITaskTemplateRepository,
  ): Promise<TaskDependencyApplicationService> {
    const container = TaskContainer.getInstance();
    const depRepo = dependencyRepository || container.getTaskDependencyRepository();
    const taskRepo = taskRepository || container.getTaskTemplateRepository();

    // 创建领域服务实例
    const domainService = dependencyService || new TaskDependencyService();

    TaskDependencyApplicationService.instance = new TaskDependencyApplicationService(
      domainService,
      depRepo,
      taskRepo,
    );
    return TaskDependencyApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<TaskDependencyApplicationService> {
    if (!TaskDependencyApplicationService.instance) {
      TaskDependencyApplicationService.instance =
        await TaskDependencyApplicationService.createInstance();
    }
    return TaskDependencyApplicationService.instance;
  }

  /**
   * 创建依赖关系
   */
  async createDependency(request: CreateTaskDependencyRequest): Promise<TaskDependencyServerDTO> {
    // 1. 验证任务存在
    const [predecessor, successor] = await Promise.all([
      this.taskRepository.findByUuid(request.predecessorTaskUuid),
      this.taskRepository.findByUuid(request.successorTaskUuid),
    ]);

    if (!predecessor) {
      throw new Error(`前置任务不存�? ${request.predecessorTaskUuid}`);
    }

    if (!successor) {
      throw new Error(`后续任务不存�? ${request.successorTaskUuid}`);
    }

    // 2. 检查是否已存在
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessor(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (existing) {
      throw new Error('依赖关系已存�?);
    }

    // 3. 获取所有相关依赖，用于循环检�?
    // 这里简化处理，只获�?successor 的所有后续依赖和 predecessor 的所有前置依�?
    // 更好的做法可能是获取整个账户的依赖图，或者在数据库层面做递归查询
    // 暂时使用全量查询（注意性能�?
    const allDependencies = await this.dependencyRepository.findAllByAccount(request.accountUuid);

    // 4. 委托给领域服务进行循环依赖检�?
    const validation = this.dependencyService.detectCircularDependency(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
      allDependencies,
    );

    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // 5. 委托给领域服务创建实�?
    const dependency = this.dependencyService.createDependency(
      predecessor,
      successor,
      request.accountUuid,
    );

    // 6. 保存到仓�?
    await this.dependencyRepository.create(request);

    // 7. 更新后续任务的依赖状�?
    await this.updateTaskDependencyStatus(successor.uuid);

    return dependency.toServerDTO();
  }

  /**
   * 获取任务的所有前置依�?
   */
  async getDependencies(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return await this.dependencyRepository.findBySuccessor(taskUuid);
  }

  /**
   * 获取依赖此任务的所有任�?
   */
  async getDependents(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return await this.dependencyRepository.findByPredecessor(taskUuid);
  }

  /**
   * 删除依赖关系
   */
  async deleteDependency(uuid: string): Promise<void> {
    const dependency = await this.dependencyRepository.findByUuid(uuid);
    if (!dependency) {
      throw new Error('依赖关系不存�?);
    }

    await this.dependencyRepository.delete(uuid);

    // 更新后续任务的状�?
    await this.updateTaskDependencyStatus(dependency.successorTaskUuid);
  }

  /**
   * 验证依赖关系（不实际创建�?
   */
  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    const errors: string[] = [];

    // 验证任务存在
    const [predecessor, successor] = await Promise.all([
      this.taskRepository.findByUuid(request.predecessorTaskUuid),
      this.taskRepository.findByUuid(request.successorTaskUuid),
    ]);

    if (!predecessor) {
      errors.push('前置任务不存�?);
    }

    if (!successor) {
      errors.push('后续任务不存�?);
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // 检查是否已存在
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessor(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (existing) {
      errors.push('依赖关系已存�?);
    }

    // 循环依赖检�?
    const allDependencies = await this.dependencyRepository.findAllByAccount(
      predecessor!.accountUuid,
    );
    const validation = this.dependencyService.detectCircularDependency(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
      allDependencies,
    );

    if (!validation.isValid) {
      return {
        isValid: false,
        errors: [validation.message!],
        wouldCreateCycle: true,
        cyclePath: validation.cycle,
        message: validation.message,
      };
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      message: '依赖关系有效，可以创�?,
    };
  }

  /**
   * 获取依赖链信�?
   */
  async getDependencyChain(taskUuid: string): Promise<DependencyChainServerDTO> {
    const [allPredecessors, allSuccessors] = await Promise.all([
      this.dependencyRepository.findAllPredecessors(taskUuid),
      this.dependencyRepository.findAllSuccessors(taskUuid),
    ]);

    // 获取所有相关依赖用于计算深�?
    // 这里可以优化，只获取相关�?
    const task = await this.taskRepository.findByUuid(taskUuid);
    if (!task) throw new Error('Task not found');

    const allDependencies = await this.dependencyRepository.findAllByAccount(task.accountUuid);

    // 计算深度
    const depth = this.dependencyService.calculateDepth(taskUuid, allDependencies);

    return {
      taskUuid,
      allPredecessors,
      allSuccessors,
      depth,
      isOnCriticalPath: false, // TODO: Implement critical path
    };
  }

  /**
   * 更新依赖关系
   */
  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyServerDTO> {
    return await this.dependencyRepository.update(uuid, request);
  }

  /**
   * 更新任务的依赖状态（私有辅助方法�?
   */
  private async updateTaskDependencyStatus(taskUuid: string): Promise<void> {
    // 1. 获取任务的前置依�?
    const dependencies = await this.dependencyRepository.findBySuccessor(taskUuid);

    // 2. 获取前置任务详情
    const predecessorTasks = await Promise.all(
      dependencies.map((dep) => this.taskRepository.findByUuid(dep.predecessorTaskUuid)),
    );

    // 3. 计算新状�?
    const statusResult = this.dependencyService.calculateDependencyStatus(
      taskUuid,
      dependencies,
      predecessorTasks,
    );

    // 4. 更新任务状�?(映射 DependencyStatus �?updateDependencyStatus 参数类型)
    const statusMap: Record<string, 'PENDING' | 'READY' | 'BLOCKED'> = {
      NONE: 'READY',
      WAITING: 'PENDING',
      READY: 'READY',
      BLOCKED: 'BLOCKED',
    };
    const mappedStatus = statusMap[statusResult.status] ?? 'PENDING';

    const task = await this.taskRepository.findByUuid(taskUuid);
    if (task) {
      task.updateDependencyStatus(mappedStatus);
      // 如果被阻塞，记录原因
      if (statusResult.isBlocked && statusResult.blockingReason) {
        task.markAsBlocked(statusResult.blockingReason);
      } else if (!statusResult.isBlocked && task.isBlocked) {
        task.markAsReady();
      }
      await this.taskRepository.save(task);
    }
  }
}
