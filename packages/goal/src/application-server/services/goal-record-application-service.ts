/**
 * @file GoalRecordApplicationService.ts
 * @description 目标记录应用服务，处理目标进度记录的创建和查询�?
 * @date 2025-01-22
 */

import type { IGoalRepository } from '@/domain-server';

import { GoalRecord } from '@/domain-server';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, GoalRecordClientDTO, GoalRecordsResponse, ProgressBreakdown } from '@dailyuse/contracts/goal';
import { GoalEventPublisher } from './goal-event-publisher';

/**
 * 目标记录应用服务�?
 * 
 * @remarks
 * 负责目标记录（GoalRecord）的增删查改，用于追踪关键结果（KeyResult）的进度变化�?
 * 包含创建记录、查询历史记录、计算进度分解等功能�?
 */
export class GoalRecordApplicationService {
  private goalRepository: IGoalRepository;

  constructor(goalRepository: IGoalRepository) {
    this.goalRepository = goalRepository;
  }



  /**
   * 创建目标记录�?
   *
   * @remarks
   * 添加一条新的进度记录到指定的关键结果，并自动更新目标进度�?
   *
   * @param goalUuid - 目标 UUID
   * @param keyResultUuid - 关键结果 UUID
   * @param params - 记录参数（值、备注、时间）
   * @returns {Promise<GoalRecordClientDTO>} 创建的记�?DTO
   * @throws {Error} 当目标或关键结果不存在时抛出
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    params: {
      value: number;  // 本次记录的�?
      note?: string;
      recordedAt?: number;
    },
  ): Promise<GoalRecordClientDTO> {
    // 1. 查询目标（包含子实体�?
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 创建记录实体
    const record = GoalRecord.create({
      keyResultUuid,
      goalUuid,
      value: params.value,  // 本次记录的�?
      note: params.note || undefined,
      recordedAt: params.recordedAt || Date.now(),
    });

    // 4. 添加到关键结果（会自动重新计�?currentValue�?
    keyResult.addRecord(record.toServerDTO());

    // 5. 持久�?
    await this.goalRepository.save(goal);

    // 6. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 7. 返回 ClientDTO（包含计算后�?currentValue�?
    return record.toClientDTO(keyResult.progress.currentValue);
  }

  /**
   * 获取关键结果的所有记录（分页）�?
   *
   * @param goalUuid - 目标 UUID
   * @param keyResultUuid - 关键结果 UUID
   * @param options - 分页和筛选选项
   * @returns {Promise<GoalRecordsResponse>} 记录列表响应
   * @throws {Error} 当目标或关键结果不存在时抛出
   */
  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    options?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    // 1. 查询目标（包含子实体�?
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 获取记录并过�?
    let records = keyResult.records ? [...keyResult.records.map(dto => GoalRecord.fromServerDTO(dto))] : [];

    // 日期范围过滤
    if (options?.dateRange) {
      const { start, end } = options.dateRange;
      if (start) {
        const startTime = new Date(start).getTime();
        records = records.filter((r) => r.recordedAt >= startTime);
      }
      if (end) {
        const endTime = new Date(end).getTime();
        records = records.filter((r) => r.recordedAt <= endTime);
      }
    }

    // 排序（最新的在前�?
    records.sort((a, b) => b.recordedAt - a.recordedAt);

    // 4. 分页
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const total = records.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = records.slice(startIndex, endIndex);

    // 5. 返回响应
    return {
      records: paginatedRecords.map((r) => r.toClientDTO()),
      total,
    };
  }

  /**
   * 获取目标的所有记录（聚合所有关键结果）�?
   *
   * @param goalUuid - 目标 UUID
   * @param options - 分页选项
   * @returns {Promise<GoalRecordsResponse>} 记录列表响应
   * @throws {Error} 当目标不存在时抛�?
   */
  async getGoalRecordsByGoal(
    goalUuid: string,
    options?: {
      page?: number;
      limit?: number;
    },
  ): Promise<GoalRecordsResponse> {
    // 1. 查询目标（包含子实体�?
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 收集所有关键结果的记录
    const allRecords: GoalRecord[] = [];
    for (const keyResult of goal.keyResults) {
      if (keyResult.records) {
        const recordEntities = keyResult.records.map(dto => GoalRecord.fromServerDTO(dto));
        allRecords.push(...recordEntities);
      }
    }

    // 3. 排序（最新的在前�?
    allRecords.sort((a, b) => b.recordedAt - a.recordedAt);

    // 4. 分页
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const total = allRecords.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    // 5. 返回响应
    return {
      records: paginatedRecords.map((r) => r.toClientDTO()),
      total,
    };
  }

  /**
   * 删除目标记录�?
   *
   * @param goalUuid - 目标 UUID
   * @param keyResultUuid - 关键结果 UUID
   * @param recordUuid - 记录 UUID
   * @returns {Promise<void>}
   * @throws {Error} 当目标或关键结果不存在时抛出
   */
  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void> {
    // 1. 查询目标（包含子实体�?
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 删除记录
    keyResult.removeRecord(recordUuid);

    // 4. 持久�?
    await this.goalRepository.save(goal);

    // 5. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);
  }

  /**
   * 获取目标进度分解详情�?
   *
   * @remarks
   * 计算每个关键结果对总进度的贡献度�?
   *
   * @param goalUuid - 目标 UUID
   * @returns {Promise<ProgressBreakdown>} 进度分解数据
   * @throws {Error} 当目标不存在或总权重为0时抛�?
   */
  async getGoalProgressBreakdown(
    goalUuid: string,
  ): Promise<ProgressBreakdown> {
    // 1. 查询目标（包含子实体�?
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 计算权重总和
    const totalWeight = goal.keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);
    if (totalWeight === 0) {
      throw new Error('Total weight is 0, cannot calculate weighted progress');
    }

    // 3. 计算每个关键结果的贡献度
    const keyResultContributions = goal.keyResults.map((kr) => {
      const progress = kr.progress;
      const progressPercentage = progress.targetValue !== 0 
        ? (progress.currentValue / progress.targetValue) * 100 
        : 0;
      // 贡献�?= 进度百分�?× (�?KR 权重 / 总权�?
      const contribution = (progressPercentage / 100) * (kr.weight / totalWeight);

      return {
        keyResultUuid: kr.uuid,
        keyResultName: kr.title,
        weight: kr.weight,
        progress: progressPercentage,
        contribution,
      };
    });

    // 4. 计算总进度（加权平均�?
    // 总进�?= Σ(进度百分�?× (权重 / 总权�?)
    const totalProgress = goal.keyResults.reduce((sum, kr) => {
      const progress = kr.progress;
      const progressPercentage = progress.targetValue !== 0
        ? (progress.currentValue / progress.targetValue) * 100
        : 0;
      return sum + (progressPercentage * (kr.weight / totalWeight));
    }, 0);

    return {
      totalProgress,
      calculationMode: 'weighted_average' as const,
      krContributions: keyResultContributions,
      lastUpdateTime: Date.now(),
      updateTrigger: 'manual_request',
    };
  }
}
