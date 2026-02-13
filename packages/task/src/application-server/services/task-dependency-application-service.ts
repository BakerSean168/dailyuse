/**
 * TaskDependency Application Service
 * 浠诲姟渚濊禆鍏崇郴搴旂敤鏈嶅姟
 *
 * 鑱岃矗锛?
 * - 鍗忚皟棰嗗煙鏈嶅姟鍜屼粨鍌?
 * - 澶勭悊渚濊禆鍏崇郴涓氬姟鐢ㄤ緥
 * - DTO 杞崲
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
   * 鍒涘缓搴旂敤鏈嶅姟瀹炰緥
   */
  static createInstance(
    dependencyRepository: ITaskDependencyRepository,
    taskRepository: ITaskTemplateRepository,
  ): TaskDependencyApplicationService {
    return new TaskDependencyApplicationService(dependencyRepository, taskRepository);
  }

  /**
   * 鍒涘缓渚濊禆鍏崇郴
   */
  async createDependency(request: CreateTaskDependencyRequest): Promise<Result<TaskDependencyServerDTO>> {
    // 1. 楠岃瘉浠诲姟瀛樺湪
    const [predecessor, successor] = await Promise.all([
      this.taskRepository.findById(request.predecessorTaskId),
      this.taskRepository.findById(request.successorTaskId),
    ]);

    if (!predecessor) {
      return error('NOT_FOUND', `鍓嶇疆浠诲姟涓嶅瓨鍦? ${request.predecessorTaskId}`);
    }

    if (!successor) {
      return error('NOT_FOUND', `鍚庣画浠诲姟涓嶅瓨鍦? ${request.successorTaskId}`);
    }

    // 2. 妫€鏌ユ槸鍚﹀凡瀛樺湪
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessorId(
      request.predecessorTaskId,
      request.successorTaskId,
    );

    if (existing) {
      return error('VALIDATION_ERROR', '渚濊禆鍏崇郴宸插瓨鍦?);
    }

    // 3. 鑾峰彇鎵€鏈夌浉鍏充緷璧栵紝鐢ㄤ簬寰幆妫€娴?
    // 杩欓噷绠€鍖栧鐞嗭紝鍙幏鍙?successor 鐨勬墍鏈夊悗缁緷璧栧拰 predecessor 鐨勬墍鏈夊墠缃緷璧?
    // 鏇村ソ鐨勫仛娉曞彲鑳芥槸鑾峰彇鏁翠釜璐︽埛鐨勪緷璧栧浘锛屾垨鑰呭湪鏁版嵁搴撳眰闈㈠仛閫掑綊鏌ヨ
    // 鏆傛椂浣跨敤鍏ㄩ噺鏌ヨ锛堟敞鎰忔€ц兘锛?
    const allDependencies = await this.dependencyRepository.findAllByIdentityId(request.identityId);

    // 4. 濮旀墭缁欓鍩熸湇鍔¤繘琛屽惊鐜緷璧栨娴?
    const validation = this.dependencyService.detectCircularDependency(
      request.predecessorTaskId,
      request.successorTaskId,
      allDependencies,
    );

    if (!validation.isValid) {
      return error('VALIDATION_ERROR', validation.message!);
    }

    // 5. 濮旀墭缁欓鍩熸湇鍔″垱寤哄疄浣?
    const dependency = this.dependencyService.createDependency(
      predecessor,
      successor,
      request.identityId,
    );

    // 6. 淇濆瓨鍒颁粨鍌?
    await this.dependencyRepository.create(request);

    // 7. 鏇存柊鍚庣画浠诲姟鐨勪緷璧栫姸鎬?
    await this.updateTaskDependencyStatus(successor.id);

    return ok(dependency.toServerDTO());
  }

  /**
   * 鑾峰彇浠诲姟鐨勬墍鏈夊墠缃緷璧?
   */
  async getDependencies(taskUuid: string): Promise<Result<TaskDependencyServerDTO[]>> {
    const deps = await this.dependencyRepository.findBySuccessorId(taskUuid);
    return ok(deps);
  }

  /**
   * 鑾峰彇渚濊禆姝や换鍔＄殑鎵€鏈変换鍔?
   */
  async getDependents(taskUuid: string): Promise<Result<TaskDependencyServerDTO[]>> {
    const deps = await this.dependencyRepository.findByPredecessorId(taskUuid);
    return ok(deps);
  }

  /**
   * 鍒犻櫎渚濊禆鍏崇郴
   */
  async deleteDependency(uuid: string): Promise<Result<void>> {
    const dependency = await this.dependencyRepository.findById(uuid);
    if (!dependency) {
      return error('NOT_FOUND', '渚濊禆鍏崇郴涓嶅瓨鍦?);
    }

    await this.dependencyRepository.delete(uuid);

    // 鏇存柊鍚庣画浠诲姟鐨勭姸鎬?
    await this.updateTaskDependencyStatus(dependency.successorTaskId);
    
    return ok(undefined);
  }

  /**
   * 楠岃瘉渚濊禆鍏崇郴锛堜笉瀹為檯鍒涘缓锛?
   */
  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<Result<ValidateDependencyResponse>> {
    const errors: string[] = [];

    // 楠岃瘉浠诲姟瀛樺湪
    const [predecessor, successor] = await Promise.all([
      this.taskRepository.findById(request.predecessorTaskId),
      this.taskRepository.findById(request.successorTaskId),
    ]);

    if (!predecessor) {
      errors.push('鍓嶇疆浠诲姟涓嶅瓨鍦?);
    }

    if (!successor) {
      errors.push('鍚庣画浠诲姟涓嶅瓨鍦?);
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // 妫€鏌ユ槸鍚﹀凡瀛樺湪
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessorId(
      request.predecessorTaskId,
      request.successorTaskId,
    );

    if (existing) {
      errors.push('渚濊禆鍏崇郴宸插瓨鍦?);
    }

    // 寰幆渚濊禆妫€娴?
    const allDependencies = await this.dependencyRepository.findAllByIdentityId(
      predecessor!.identityId,
    );
    const validation = this.dependencyService.detectCircularDependency(
      request.predecessorTaskId,
      request.successorTaskId,
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
      message: '渚濊禆鍏崇郴鏈夋晥锛屽彲浠ュ垱寤?,
    });
  }

  /**
   * 鑾峰彇渚濊禆閾句俊鎭?
   */
  async getDependencyChain(taskUuid: string): Promise<Result<DependencyChainServerDTO>> {
    const [allPredecessors, allSuccessors] = await Promise.all([
      this.dependencyRepository.findAllPredecessorIds(taskUuid),
      this.dependencyRepository.findAllSuccessorIds(taskUuid),
    ]);

    // 鑾峰彇鎵€鏈夌浉鍏充緷璧栫敤浜庤绠楁繁搴?
    // 杩欓噷鍙互浼樺寲锛屽彧鑾峰彇鐩稿叧鐨?
    const task = await this.taskRepository.findById(taskUuid);
    if (!task) return error('NOT_FOUND', 'Task not found');

    const allDependencies = await this.dependencyRepository.findAllByIdentityId(task.identityId);

    // 璁＄畻娣卞害
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
   * 鏇存柊渚濊禆鍏崇郴
   */
  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyServerDTO>> {
    const updated = await this.dependencyRepository.update(uuid, request);
    return ok(updated);
  }

  /**
   * 鏇存柊浠诲姟鐨勪緷璧栫姸鎬侊紙绉佹湁杈呭姪鏂规硶锛?
   */
  private async updateTaskDependencyStatus(taskUuid: string): Promise<void> {
    // 1. 鑾峰彇浠诲姟鐨勫墠缃緷璧?
    const dependencies = await this.dependencyRepository.findBySuccessorId(taskUuid);

    // 2. 鑾峰彇鍓嶇疆浠诲姟璇︽儏
    const predecessorTasks = await Promise.all(
      dependencies.map((dep) => this.taskRepository.findById(dep.predecessorTaskId)),
    );

    // 3. 璁＄畻鏂扮姸鎬?
    const statusResult = this.dependencyService.calculateDependencyStatus(
      taskUuid,
      dependencies,
      predecessorTasks,
    );

    // 4. 鏇存柊浠诲姟鐘舵€?(鏄犲皠 DependencyStatus 鍒?updateDependencyStatus 鍙傛暟绫诲瀷)
    const statusMap: Record<string, 'PENDING' | 'READY' | 'BLOCKED'> = {
      NONE: 'READY',
      WAITING: 'PENDING',
      READY: 'READY',
      BLOCKED: 'BLOCKED',
    };
    const mappedStatus = statusMap[statusResult.status] ?? 'PENDING';

    const task = await this.taskRepository.findById(taskUuid);
    if (task) {
      task.updateDependencyStatus(mappedStatus);
      // 濡傛灉琚樆濉烇紝璁板綍鍘熷洜
      if (statusResult.isBlocked && statusResult.blockingReason) {
        task.markAsBlocked(statusResult.blockingReason);
      } else if (!statusResult.isBlocked && task.isBlocked) {
        task.markAsReady();
      }
      await this.taskRepository.save(task);
    }
  }
}
