import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import { GoalDomainService } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO } from '@dailyuse/contracts/goal';
import { KeyResultValueType, AggregationMethod } from '@dailyuse/contracts/goal';
import { GoalEventPublisher } from './GoalEventPublisher';

/**
 * GoalKeyResult 应用服务
 * 负责关键结果的管理
 * 
 * 职责：
 * - 添加关键结果
 * - 更新关键结果配置（标题、权重、目标值等）
 * - 更新关键结果进度
 * - 删除关键结果
 */
export class GoalKeyResultApplicationService {
  private static instance: GoalKeyResultApplicationService;
  private domainService: GoalDomainService;
  private goalRepository: IGoalRepository;

  private constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
    this.goalRepository = goalRepository;
  }

  /**
   * 创建应用服务实例
   */
  static async createInstance(goalRepository?: IGoalRepository): Promise<GoalKeyResultApplicationService> {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();

    GoalKeyResultApplicationService.instance = new GoalKeyResultApplicationService(repo);
    return GoalKeyResultApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<GoalKeyResultApplicationService> {
    if (!GoalKeyResultApplicationService.instance) {
      GoalKeyResultApplicationService.instance = await GoalKeyResultApplicationService.createInstance();
    }
    return GoalKeyResultApplicationService.instance;
  }

  /**
   * 添加关键结果
   */
  async addKeyResult(
    goalUuid: string,
    keyResult: {
      title: string;
      valueType: KeyResultValueType;
      aggregationMethod?: AggregationMethod;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): Promise<GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 委托领域服务添加关键结果
    this.domainService.addKeyResultToGoal(goal, keyResult);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }

  /**
   * 更新关键结果配置（标题、权重等）
   */
  async updateKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    updates: {
      title?: string;
      description?: string;
      weight?: number;
      targetValue?: number;
      unit?: string;
    },
  ): Promise<GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 更新关键结果属性
    if (updates.title !== undefined) {
      keyResult.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      keyResult.updateDescription(updates.description);
    }
    if (updates.weight !== undefined) {
      keyResult.updateWeight(updates.weight);
    }

    // 4. 持久化
    await this.goalRepository.save(goal);

    // 5. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 6. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }

  /**
   * 更新关键结果进度
   */
  async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    currentValue: number,
    note?: string,
  ): Promise<GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 委托领域服务更新进度
    this.domainService.updateKeyResultProgress(goal, keyResultUuid, currentValue, note);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResult(
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 调用聚合根方法删除关键结果
    goal.removeKeyResult(keyResultUuid);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }
}

