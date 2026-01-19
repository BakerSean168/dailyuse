/**
 * Weight Snapshot Application Service
 * 权重快照应用服务
 *
 * 负责权重快照的创建、查询和权重总和校验。
 */

import type {
  IGoalRepository,
  IWeightSnapshotRepository,
  KeyResult,
} from '@dailyuse/domain-server/goal';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, SnapshotTrigger } from '@dailyuse/contracts/goal';
import { GoalNotFoundError, KeyResultNotFoundError } from '../errors/WeightSnapshotErrors';

/**
 * 创建快照 DTO
 */
export interface CreateSnapshotDTO {
  goalUuid: string;
  krUuid: string;
  oldWeight: number;
  newWeight: number;
  trigger: SnapshotTrigger;
  operatorUuid: string;
  reason?: string;
}

/**
 * 快照查询选项
 */
export interface SnapshotQueryOptions {
  page?: number;
  pageSize?: number;
}

/**
 * 权重快照应用服务
 *
 * **职责**:
 * - 创建权重快照记录
 * - 校验权重总和 = 100%
 * - 查询快照历史（按 Goal、KR、时间范围）
 *
 * **设计模式**: Singleton
 * **依赖注入**: GoalRepository, WeightSnapshotRepository
 */
export class WeightSnapshotApplicationService {
  private static instance: WeightSnapshotApplicationService;

  private constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly snapshotRepository: IWeightSnapshotRepository,
  ) {}

  /**
   * 获取单例实例
   */
  public static getInstance(
    goalRepository: IGoalRepository,
    snapshotRepository: IWeightSnapshotRepository,
  ): WeightSnapshotApplicationService {
    if (!WeightSnapshotApplicationService.instance) {
      WeightSnapshotApplicationService.instance = new WeightSnapshotApplicationService(
        goalRepository,
        snapshotRepository,
      );
    }
    return WeightSnapshotApplicationService.instance;
  }

  /**
   * 创建权重快照
   *
   * **流程**:
   * 1. 验证 Goal 存在
   * 2. 验证 KR 存在于该 Goal 中
   * 3. 创建 KeyResultWeightSnapshot 值对象
   * 4. 保存到仓储
   *
   * @param dto - 快照创建数据
   * @returns 创建的快照实例
   * @throws {GoalNotFoundError} Goal 不存在
   * @throws {KeyResultNotFoundError} KR 不存在于该 Goal
   *
   * @example
   * ```typescript
   * const snapshot = await service.createSnapshot({
   *   goalUuid: 'goal-123',
   *   krUuid: 'kr-456',
   *   oldWeight: 30,
   *   newWeight: 50,
   *   trigger: 'manual',
   *   operatorUuid: 'user-789',
   *   reason: 'Adjusted based on Q1 feedback'
   * });
   * ```
   */
  async createSnapshot(dto: CreateSnapshotDTO): Promise<KeyResultWeightSnapshot> {
    // 1. 验证 Goal 存在
    const goal = await this.goalRepository.findById(dto.goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(dto.goalUuid);
    }

    // 2. 验证 KR 存在于该 Goal
    const kr = goal.keyResults.find((k: KeyResult) => k.uuid === dto.krUuid);
    if (!kr) {
      throw new KeyResultNotFoundError(dto.krUuid, dto.goalUuid);
    }

    // 3. 创建快照值对象（使用 UUID 生成）
    const snapshot = new KeyResultWeightSnapshot(
      crypto.randomUUID(),
      dto.goalUuid,
      dto.krUuid,
      dto.oldWeight,
      dto.newWeight,
      Date.now(),
      dto.trigger,
      dto.operatorUuid,
      dto.reason, // 保持 undefined,Repository 会转为 null
      Date.now(), // createdAt
    );

    // 4. 保存快照
    await this.snapshotRepository.save(snapshot);

    return snapshot;
  }

  /**
   * 获取 Goal 的权重分布信息
   *
   * **业务规则**: KeyResult 权重范围为 1-10，按比例计算每个 KR 在 Goal 中的占比
   * **不再强制权重总和为 100%**
   *
   * **示例**:
   * - KR1 权重: 3, KR2 权重: 7
   * - 总权重: 10
   * - KR1 占比: 3/10 = 30%, KR2 占比: 7/10 = 70%
   *
   * @param goalUuid - Goal UUID
   * @returns 权重分布信息（包含每个 KR 的权重和占比）
   * @throws {GoalNotFoundError} Goal 不存在
   */
  async getWeightSumInfo(goalUuid: string): Promise<{
    totalWeight: number;
    keyResults: Array<{ uuid: string; title: string; weight: number; percentage: number }>;
  }> {
    // 验证 Goal 存在
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(goalUuid);
    }

    // 计算总权重
    const totalWeight = goal.keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);

    // 计算每个 KR 的权重和占比
    const keyResults = goal.keyResults.map((kr) => ({
      uuid: kr.uuid,
      title: kr.title,
      weight: kr.weight || 0,
      percentage: totalWeight > 0 ? ((kr.weight || 0) / totalWeight) * 100 : 0,
    }));

    return { totalWeight, keyResults };
  }

  /**
   * 获取 Goal 中所有 KR 的权重分布
   *
   * 从Goal的KeyResults中读取当前权重分布
   *
   * @param goalUuid - Goal UUID
   * @returns Record<KR_UUID, weight> 和总和
   * @throws {GoalNotFoundError} Goal 不存在
   */
  async getWeightDistribution(
    goalUuid: string,
  ): Promise<Array<{ keyResultUuid: string; keyResultName: string; weight: number }>> {
    // 验证 Goal 存在
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(goalUuid);
    }

    // 从KeyResults中读取权重分布
    return goal.keyResults.map((kr) => ({
      keyResultUuid: kr.uuid,
      keyResultName: kr.title,
      weight: kr.weight || 0,
    }));
  }

  /**
   * 查询 Goal 的所有权重快照
   *
   * **排序**: 按时间倒序（最新的在前）
   * **分页**: 支持 page 和 pageSize 参数
   *
   * @param goalUuid - Goal UUID
   * @param options - 查询选项 (分页)
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const { snapshots, total } = await service.getSnapshotsByGoal('goal-123', {
   *   page: 1,
   *   pageSize: 20
   * });
   * ```
   */
  async getSnapshotsByGoal(
    goalUuid: string,
    options: SnapshotQueryOptions = {},
  ): Promise<{
    snapshots: KeyResultWeightSnapshot[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const result = await this.snapshotRepository.findByGoal(goalUuid, page, pageSize);

    return {
      snapshots: result.snapshots,
      pagination: {
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  /**
   * 查询 KeyResult 的所有权重快照
   *
   * **排序**: 按时间倒序（最新的在前）
   * **分页**: 支持 page 和 pageSize 参数
   *
   * @param krUuid - KeyResult UUID
   * @param options - 查询选项 (分页)
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const { snapshots, total } = await service.getSnapshotsByKeyResult('kr-456', {
   *   page: 1,
   *   pageSize: 10
   * });
   * ```
   */
  async getSnapshotsByKeyResult(
    krUuid: string,
    options: SnapshotQueryOptions = {},
  ): Promise<{
    snapshots: KeyResultWeightSnapshot[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const result = await this.snapshotRepository.findByKeyResult(krUuid, page, pageSize);

    return {
      snapshots: result.snapshots,
      pagination: {
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  /**
   * 查询时间范围内的权重快照
   *
   * **排序**: 按时间排序
   * **分页**: 支持 page 和 pageSize 参数
   * **用途**: 用于分析特定时期的权重变更趋势
   *
   * @param startTime - 开始时间戳 (ms)
   * @param endTime - 结束时间戳 (ms)
   * @param options - 查询选项 (分页)
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const startOfMonth = Date.parse('2025-10-01');
   * const endOfMonth = Date.parse('2025-10-31');
   *
   * const { snapshots, total } = await service.getSnapshotsByTimeRange(
   *   startOfMonth,
   *   endOfMonth,
   *   { page: 1, pageSize: 50 }
   * );
   * ```
   */
  async getSnapshotsByTimeRange(
    startTime: number,
    endTime: number,
    options: SnapshotQueryOptions = {},
  ): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const result = await this.snapshotRepository.findByTimeRange(
      startTime,
      endTime,
      page,
      pageSize,
    );

    return result;
  }

  /**
   * 获取权重趋势数据 (ECharts格式)
   *
   * 返回指定时间范围内各KeyResult的权重变化趋势,格式化为ECharts所需的数据结构
   *
   * @param goalUuid - Goal UUID
   * @param timeRange - 时间范围 (例如: '7d', '30d', '90d')
   * @returns ECharts 格式的趋势数据
   * @throws {GoalNotFoundError} Goal 不存在
   *
   * @example
   * ```typescript
   * const trend = await service.getWeightTrend('goal-123', '7d');
   * // Returns:
   * // {
   * //   xAxis: ['2025-10-25', '2025-10-26', ...],
   * //   series: [
   * //     { name: 'User Growth', data: [40, 45, 50, ...] },
   * //     { name: 'Revenue', data: [30, 30, 25, ...] }
   * //   ]
   * // }
   * ```
   */
  async getWeightTrend(
    goalUuid: string,
    timeRange: string,
  ): Promise<{
    xAxis: string[];
    series: Array<{ name: string; data: number[] }>;
  }> {
    // 1. 验证 Goal 存在
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(goalUuid);
    }

    // 2. 解析时间范围
    const days = parseInt(timeRange.replace('d', ''));
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;

    // 3. 查询时间范围内的所有快照
    const { snapshots } = await this.snapshotRepository.findByTimeRange(
      startTime,
      endTime,
      1,
      1000, // 获取足够多的数据
    );

    // 4. 按时间点分组数据
    const timePoints = new Set<number>();
    const krWeightMap = new Map<string, Map<number, number>>();

    // 初始化每个KR的权重历史
    for (const kr of goal.keyResults) {
      krWeightMap.set(kr.uuid, new Map());
    }

    // 处理快照数据
    for (const snapshot of snapshots) {
      timePoints.add(snapshot.snapshotTime);
      const krMap = krWeightMap.get(snapshot.keyResultUuid);
      if (krMap) {
        krMap.set(snapshot.snapshotTime, snapshot.newWeight);
      }
    }

    // 5. 格式化为ECharts数据结构
    const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
    const xAxis = sortedTimes.map((time) => new Date(time).toISOString().split('T')[0]);

    const series: Array<{ name: string; data: number[] }> = [];
    for (const kr of goal.keyResults) {
      const krMap = krWeightMap.get(kr.uuid);
      if (krMap) {
        const data: number[] = [];
        let lastWeight = kr.weight || 0;

        for (const time of sortedTimes) {
          const weight = krMap.get(time);
          if (weight !== undefined) {
            lastWeight = weight;
          }
          data.push(lastWeight);
        }

        series.push({
          name: kr.title,
          data,
        });
      }
    }

    return { xAxis, series };
  }

  /**
   * 多时间点权重对比
   *
   * 比较指定多个时间点的权重分布状态
   *
   * @param goalUuid - Goal UUID
   * @param timePoints - 时间点数组 (最多5个)
   * @returns 权重对比数据
   * @throws {GoalNotFoundError} Goal 不存在
   * @throws {Error} 时间点超过5个
   *
   * @example
   * ```typescript
   * const comparison = await service.getWeightComparison('goal-123', [
   *   Date.now() - 7 * 86400000,  // 7天前
   *   Date.now() - 3 * 86400000,  // 3天前
   *   Date.now()                   // 现在
   * ]);
   * // Returns:
   * // {
   * //   timePoints: [{ time: 1730000000000, label: '2025-10-25' }, ...],
   * //   keyResults: [
   * //     { uuid: 'kr-1', name: 'User Growth', weights: [40, 45, 50] },
   * //     { uuid: 'kr-2', name: 'Revenue', weights: [30, 30, 25] }
   * //   ]
   * // }
   * ```
   */
  async getWeightComparison(
    goalUuid: string,
    timePoints: number[],
  ): Promise<{
    timePoints: Array<{ time: number; label: string }>;
    keyResults: Array<{ uuid: string; name: string; weights: number[] }>;
  }> {
    // 1. 验证时间点数量
    if (timePoints.length > 5) {
      throw new Error('Maximum 5 time points allowed');
    }

    // 2. 验证 Goal 存在
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new GoalNotFoundError(goalUuid);
    }

    // 3. 为每个时间点查找最接近的快照
    const timePointData: Array<{ time: number; label: string }> = timePoints.map((time) => ({
      time,
      label: new Date(time).toISOString().split('T')[0],
    }));

    // 4. 查询所有相关快照
    const minTime = Math.min(...timePoints);
    const maxTime = Math.max(...timePoints);
    const { snapshots } = await this.snapshotRepository.findByTimeRange(minTime, maxTime, 1, 1000);

    // 5. 为每个KR在每个时间点找到对应的权重
    const keyResults: Array<{ uuid: string; name: string; weights: number[] }> = [];

    for (const kr of goal.keyResults) {
      const weights: number[] = [];
      let currentWeight = kr.weight || 0;

      for (const targetTime of timePoints) {
        // 找到该KR在目标时间点之前最近的快照
        const relevantSnapshots = snapshots
          .filter((s) => s.keyResultUuid === kr.uuid && s.snapshotTime <= targetTime)
          .sort((a, b) => b.snapshotTime - a.snapshotTime);

        if (relevantSnapshots.length > 0) {
          currentWeight = relevantSnapshots[0].newWeight;
        }

        weights.push(currentWeight);
      }

      keyResults.push({
        uuid: kr.uuid,
        name: kr.title,
        weights,
      });
    }

    return {
      timePoints: timePointData,
      keyResults,
    };
  }
}

