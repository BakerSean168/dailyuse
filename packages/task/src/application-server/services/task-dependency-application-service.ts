/**
 * TaskDependency Application Service
 * 任务依赖关系应用服务
 *
 * 职责：
 * - 协调领域服务和仓储
 * - 处理依赖关系业务用例
 * - DTO 转换
 */

import type { ITaskDependencyRepository } from '../../domain-server/repositories/ITaskDependencyRepository';
import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import { TaskDependencyService } from '../../domain-server/services/TaskDependencyService';
import type {
  TaskDependencyServerDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainServerDTO,
} from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class TaskDependencyApplicationService {
  private dependencyService: TaskDependencyService;
  private dependencyRepository: ITaskDependencyRepository;
  private taskRepository: ITaskTemplateRepository;

  constructor(
    dependencyRepository: ITaskDependencyRepository,
    taskRepository: ITaskTemplateRepository,
  ) {
    this.dependencyRepository = dependencyRepository;
    this.taskRepository = taskRepository;
    this.dependencyService = new TaskDependencyService();
  }

  /**
   * 创建应用服务实例
   */
  static createInstance(
    dependencyRepository: ITaskDependencyRepository,
    taskRepository: ITaskTemplateRepository,
  ): TaskDependencyApplicationService {
    return new TaskDependencyApplicationService(dependencyRepository, taskRepository);
  }

  /**
   * 创建依赖关系
   */
  async createDependency(request: CreateTaskDependencyRequest): Promise<Result<TaskDependencyServerDTO>> {
    // 1. 验证任务存在
    const [predecessor, successor] = await Promise.all([
      this.taskRepository.findByUuid(request.predecessorTaskUuid),
      this.taskRepository.findByUuid(request.successorTaskUuid),
    ]);

    if (!predecessor) {
      return error('NOT_FOUND', `前置任务不存在: ${request.predecessorTaskUuid}`);
    }

    if (!successor) {
      return error('NOT_FOUND', `后续任务不存在: ${request.successorTaskUuid}`);
    }

    // 2. 检查是否已存在
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessor(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (existing) {
      return error('VALIDATION_ERROR', '依赖关系已存在');
    }

    // 3. 获取所有相关依赖，用于循环检测
    // 这里简化处理，只获取 successor 的所有后续依赖和 predecessor 的所有前置依赖
    // 更好的做法可能是获取整个账户的依赖图，或者在数据库层面做递归查询
    // 暂时使用全量查询（注意性能）
    const allDependencies = await this.dependencyRepository.findAllByAccount(request.accountUuid);

    // 4. 委托给领域服务进行循环依赖检测
    const validation = this.dependencyService.detectCircularDependency(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
      allDependencies,
    );

    if (!validation.isValid) {
      return error('VALIDATION_ERROR', validation.message!);
    }

    // 5. 委托给领域服务创建实体
    const dependency = this.dependencyService.createDependency(
      predecessor,
      successor,
      request.accountUuid,
    );

    // 6. 保存到仓储
    await this.dependencyRepository.create(request);

    // 7. 更新后续任务的依赖状态
    await this.updateTaskDependencyStatus(successor.uuid);

    return ok(dependency.toServerDTO());
  }

  /**
   * 获取任务的所有前置依赖
   */
  async getDependencies(taskUuid: string): Promise<Result<TaskDependencyServerDTO[]>> {
    const deps = await this.dependencyRepository.findBySuccessor(taskUuid);
    return ok(deps);
  }

  /**
   * 获取依赖此任务的所有任务
   */
  async getDependents(taskUuid: string): Promise<Result<TaskDependencyServerDTO[]>> {
    const deps = await this.dependencyRepository.findByPredecessor(taskUuid);
    return ok(deps);
  }

  /**
   * 删除依赖关系
   */
  async deleteDependency(uuid: string): Promise<Result<void>> {
    const dependency = await this.dependencyRepository.findByUuid(uuid);
    if (!dependency) {
      return error('NOT_FOUND', '依赖关系不存在');
    }

    await this.dependencyRepository.delete(uuid);

    // 更新后续任务的状态
    await this.updateTaskDependencyStatus(dependency.successorTaskUuid);
    
    return ok(undefined);
  }

  /**
   * 验证依赖关系（不实际创建）
   */
  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<Result<ValidateDependencyResponse>> {
    const errors: string[] = [];

    // 验证任务存在
    const [predecessor, successor] = await Promise.all([
      this.taskRepository.findByUuid(request.predecessorTaskUuid),
      this.taskRepository.findByUuid(request.successorTaskUuid),
    ]);

    if (!predecessor) {
      errors.push('前置任务不存在');
    }

    if (!successor) {
      errors.push('后续任务不存在');
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
      errors.push('依赖关系已存在');
    }

    // 循环依赖检测
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
      return ok({ isValid: false, errors });
    }

    return ok({
      isValid: true,
      message: '依赖关系有效，可以创建',
    });
  }

  /**
   * 获取依赖链信息
   */
  async getDependencyChain(taskUuid: string): Promise<Result<DependencyChainServerDTO>> {
    const [allPredecessors, allSuccessors] = await Promise.all([
      this.dependencyRepository.findAllPredecessors(taskUuid),
      this.dependencyRepository.findAllSuccessors(taskUuid),
    ]);

    // 获取所有相关依赖用于计算深度
    // 这里可以优化，只获取相关的
    const task = await this.taskRepository.findByUuid(taskUuid);
    if (!task) return error('NOT_FOUND', 'Task not found');

    const allDependencies = await this.dependencyRepository.findAllByAccount(task.accountUuid);

    // 计算深度
    const depth = this.dependencyService.calculateDepth(taskUuid, allDependencies);

    return ok({
      taskUuid,
      allPredecessors,
      allSuccessors,
      depth,
      isOnCriticalPath: false, // TODO: Implement critical path
    });
  }

  /**
   * 更新依赖关系
   */
  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyServerDTO>> {
    const updated = await this.dependencyRepository.update(uuid, request);
    return ok(updated);
  }

  /**
   * 更新任务的依赖状态（私有辅助方法）
   */
  private async updateTaskDependencyStatus(taskUuid: string): Promise<void> {
    // 1. 获取任务的前置依赖
    const dependencies = await this.dependencyRepository.findBySuccessor(taskUuid);

    // 2. 获取前置任务详情
    const predecessorTasks = await Promise.all(
      dependencies.map((dep) => this.taskRepository.findByUuid(dep.predecessorTaskUuid)),
    );

    // 3. 计算新状态
    const statusResult = this.dependencyService.calculateDependencyStatus(
      taskUuid,
      dependencies,
      predecessorTasks,
    );

    // 4. 更新任务状态 (映射 DependencyStatus 到 updateDependencyStatus 参数类型)
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
