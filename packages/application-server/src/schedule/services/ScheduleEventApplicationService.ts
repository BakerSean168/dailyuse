import type { IScheduleRepository } from '@dailyuse/domain-server/schedule';
import { Schedule } from '@dailyuse/domain-server/schedule';
import type { ScheduleClientDTO, ConflictDetectionResult } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../../infrastructure/di/ScheduleContainer';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleEventApplicationService');

/**
 * Schedule Event Application Service
 * 日程事件应用服务
 * 
 * 职责：
 * - 处理用户面向的日程事件 CRUD 操作
 * - 协调领域层逻辑
 * - DTO 转换（Domain ↔ Contracts）
 * - 事务管理
 * 
 * Story 4-1: Schedule Event CRUD
 */
export class ScheduleEventApplicationService {
  private static instance: ScheduleEventApplicationService | null = null;
  private scheduleRepository: IScheduleRepository;

  private constructor(scheduleRepository: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ScheduleEventApplicationService {
    if (!ScheduleEventApplicationService.instance) {
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleRepository();
      ScheduleEventApplicationService.instance = new ScheduleEventApplicationService(repository);
    }
    return ScheduleEventApplicationService.instance;
  }

  // ===== CRUD Operations =====

  /**
   * 创建日程事件
   * 
   * @param params 创建参数
   * @returns 创建的日程事件 DTO
   */
  async createSchedule(params: {
    accountUuid: string;
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    priority?: number;
    location?: string;
    attendees?: string[];
    autoDetectConflicts?: boolean; // 默认 true
  }): Promise<ScheduleClientDTO> {
    logger.info('Creating schedule', { title: params.title, accountUuid: params.accountUuid });

    // 参数验证
    if (params.startTime >= params.endTime) {
      throw new Error('Start time must be before end time');
    }

    if (params.startTime < Date.now()) {
      throw new Error('Start time cannot be in the past');
    }

    // 创建领域实体
    const schedule = Schedule.create({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      startTime: params.startTime,
      endTime: params.endTime,
      priority: params.priority,
      location: params.location,
      attendees: params.attendees,
    });

    // 自动冲突检测（默认开启）
    if (params.autoDetectConflicts !== false) {
      await this.detectAndMarkConflicts(schedule);
    }

    // 持久化
    await this.scheduleRepository.save(schedule);

    logger.info('Schedule created', { uuid: schedule.uuid, hasConflict: schedule.hasConflict });

    // 转换为客户端 DTO
    return schedule.toClientDTO();
  }

  /**
   * 获取日程事件详情
   * 
   * @param uuid 日程UUID
   * @returns 日程事件 DTO，不存在则返回 null
   */
  async getSchedule(uuid: string): Promise<ScheduleClientDTO | null> {
    logger.debug('Fetching schedule', { uuid });

    const schedule = await this.scheduleRepository.findByUuid(uuid);

    if (!schedule) {
      logger.warn('Schedule not found', { uuid });
      return null;
    }

    return schedule.toClientDTO();
  }

  /**
   * 获取账户的所有日程事件
   * 
   * @param accountUuid 账户UUID
   * @returns 日程事件 DTO 列表
   */
  async getSchedulesByAccount(accountUuid: string): Promise<ScheduleClientDTO[]> {
    logger.debug('Fetching schedules by account', { accountUuid });

    const schedules = await this.scheduleRepository.findByAccountUuid(accountUuid);

    return schedules.map((schedule) => schedule.toClientDTO());
  }

  /**
   * 获取时间范围内的日程事件
   * 
   * @param accountUuid 账户UUID
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @returns 日程事件 DTO 列表
   */
  async getSchedulesByTimeRange(
    accountUuid: string,
    startTime: number,
    endTime: number,
  ): Promise<ScheduleClientDTO[]> {
    logger.debug('Fetching schedules by time range', { accountUuid, startTime, endTime });

    const schedules = await this.scheduleRepository.findByTimeRange(
      accountUuid,
      startTime,
      endTime
    );

    return schedules.map((schedule) => schedule.toClientDTO());
  }

  /**
   * 更新日程事件
   * 
   * @param uuid 日程UUID
   * @param params 更新参数
   * @returns 更新后的日程事件 DTO
   */
  async updateSchedule(
    uuid: string,
    params: {
      title?: string;
      description?: string;
      startTime?: number;
      endTime?: number;
      priority?: number;
      location?: string;
      attendees?: string[];
      autoDetectConflicts?: boolean;
    },
  ): Promise<ScheduleClientDTO> {
    logger.info('Updating schedule', { uuid, updates: Object.keys(params) });

    // 查询现有日程
    const schedule = await this.scheduleRepository.findByUuid(uuid);

    if (!schedule) {
      throw new Error(`Schedule not found: ${uuid}`);
    }

    // 参数验证
    if (params.startTime !== undefined && params.endTime !== undefined) {
      if (params.startTime >= params.endTime) {
        throw new Error('Start time must be before end time');
      }
    }

    // 更新字段
    if (params.title !== undefined) {
      schedule.updateTitle(params.title);
    }

    if (params.description !== undefined) {
      schedule.updateDescription(params.description);
    }

    if (params.startTime !== undefined && params.endTime !== undefined) {
      schedule.updateTimeRange(params.startTime, params.endTime);
    } else if (params.startTime !== undefined) {
      schedule.updateTimeRange(params.startTime, schedule.endTime);
    } else if (params.endTime !== undefined) {
      schedule.updateTimeRange(schedule.startTime, params.endTime);
    }

    if (params.priority !== undefined) {
      schedule.updatePriority(params.priority);
    }

    if (params.location !== undefined) {
      schedule.updateLocation(params.location);
    }

    if (params.attendees !== undefined) {
      schedule.updateAttendees(params.attendees);
    }

    // 自动检测冲突（默认开启）
    if (params.autoDetectConflicts !== false) {
      await this.detectAndMarkConflicts(schedule, uuid);
    }

    // 持久化
    await this.scheduleRepository.save(schedule);

    logger.info('Schedule updated', { 
      uuid, 
      hasConflict: schedule.hasConflict,
      updates: Object.keys(params),
    });

    // 返回更新后的 DTO
    return schedule.toClientDTO();
  }

  /**
   * 删除日程事件
   * 
   * @param uuid 日程UUID
   */
  async deleteSchedule(uuid: string): Promise<void> {
    logger.info('Deleting schedule', { uuid });

    // 验证日程是否存在
    const schedule = await this.scheduleRepository.findByUuid(uuid);

    if (!schedule) {
      throw new Error(`Schedule not found: ${uuid}`);
    }

    // 删除
    await this.scheduleRepository.deleteByUuid(uuid);

    logger.info('Schedule deleted', { uuid });
  }

  /**
   * 批量删除日程事件
   * 
   * @param accountUuid 账户UUID
   * @param uuids 日程UUID列表
   */
  async deleteSchedulesBatch(accountUuid: string, uuids: string[]): Promise<void> {
    logger.info('Batch deleting schedules', { accountUuid, count: uuids.length });

    // 验证所有日程都属于该账户
    for (const uuid of uuids) {
      const schedule = await this.scheduleRepository.findByUuid(uuid);

      if (!schedule) {
        throw new Error(`Schedule not found: ${uuid}`);
      }

      if (schedule.accountUuid !== accountUuid) {
        throw new Error(`Schedule ${uuid} does not belong to account ${accountUuid}`);
      }
    }

    // 批量删除
    for (const uuid of uuids) {
      await this.scheduleRepository.deleteByUuid(uuid);
    }

    logger.info('Batch delete completed', { count: uuids.length });
  }

  // ===== Conflict Detection (Story 4-3) =====

  /**
   * 检测并标记日程冲突
   * 
   * @param schedule 要检测的日程
   * @param excludeUuid 可选：排除的日程UUID（用于更新场景）
   */
  private async detectAndMarkConflicts(schedule: Schedule, excludeUuid?: string): Promise<void> {
    logger.debug('Detecting conflicts', { scheduleUuid: schedule.uuid });

    // 查询同一账户在时间范围内的其他日程
    const overlappingSchedules = await this.scheduleRepository.findByTimeRange(
      schedule.accountUuid,
      schedule.startTime,
      schedule.endTime,
      excludeUuid // 排除当前日程（更新场景）
    );

    if (overlappingSchedules.length === 0) {
      // 无冲突，清除冲突标记
      schedule.clearConflicts();
      logger.debug('No conflicts found', { scheduleUuid: schedule.uuid });
      return;
    }

    // 使用领域方法检测冲突
    const conflictResult = schedule.detectConflicts(overlappingSchedules);

    if (conflictResult.hasConflict) {
      // 提取冲突的日程 UUID
      const conflictingUuids = conflictResult.conflicts.map((c) => c.scheduleUuid);
      schedule.markAsConflicting(conflictingUuids);

      logger.info('Conflicts detected', {
        scheduleUuid: schedule.uuid,
        conflictCount: conflictingUuids.length,
        conflictingUuids,
      });
    } else {
      schedule.clearConflicts();
    }
  }

  /**
   * 获取日程冲突详情
   * 
   * @param uuid 日程UUID
   * @returns 冲突检测结果
   */
  async getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult | null> {
    const schedule = await this.scheduleRepository.findByUuid(uuid);

    if (!schedule) {
      return null;
    }

    // 查询重叠的日程
    const overlappingSchedules = await this.scheduleRepository.findByTimeRange(
      schedule.accountUuid,
      schedule.startTime,
      schedule.endTime,
      uuid // 排除自己
    );

    // 使用领域方法检测冲突
    const conflictResult = schedule.detectConflicts(overlappingSchedules);

    return conflictResult;
  }
}

