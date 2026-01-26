/**
 * Schedule 聚合根实现
 * 用户日程/会议聚合根（与 ScheduleTask 不同，这是用户面向的日历事件）
 *
 * DDD 聚合根职责：
 * - 管理日程的生命周期
 * - 实现冲突检测业务逻辑
 * - 确保日程的一致性
 * - 作为事务边界
 *
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  ConflictDetail,
  ConflictDetectionResult,
  ConflictSuggestion,
  ScheduleClientDTO,
  ScheduleServerDTO,
} from '@dailyuse/contracts/schedule';

/**
 * Schedule 聚合根
 * 
 * 注意：这是用户面向的日程（会议、约会等），不是 ScheduleTask（cron任务调度）
 * TODO: 定义 ScheduleServer 接口后实现
 */
export class Schedule extends AggregateRoot {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _startTime: number;
  private _endTime: number;
  private _duration: number; // in minutes
  private _hasConflict: boolean;
  private _conflictingSchedules: string[] | null;
  private _priority: number | null;
  private _location: string | null;
  private _attendees: string[] | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    startTime: number;
    endTime: number;
    hasConflict?: boolean;
    conflictingSchedules?: string[] | null;
    priority?: number | null;
    location?: string | null;
    attendees?: string[] | null;
    createdAt?: number;
    updatedAt?: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    
    // Validation: startTime must be before endTime
    if (params.startTime >= params.endTime) {
      throw new Error('Schedule startTime must be before endTime');
    }

    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description ?? null;
    this._startTime = params.startTime;
    this._endTime = params.endTime;
    this._duration = this.calculateDuration(params.startTime, params.endTime);
    this._hasConflict = params.hasConflict ?? false;
    this._conflictingSchedules = params.conflictingSchedules ?? null;
    this._priority = params.priority ?? null;
    this._location = params.location ?? null;
    this._attendees = params.attendees ?? null;
    this._createdAt = params.createdAt ?? Date.now();
    this._updatedAt = params.updatedAt ?? Date.now();
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | null {
    return this._description;
  }

  public get startTime(): number {
    return this._startTime;
  }

  public get endTime(): number {
    return this._endTime;
  }

  public get duration(): number {
    return this._duration;
  }

  public get hasConflict(): boolean {
    return this._hasConflict;
  }

  public get conflictingSchedules(): string[] | null {
    return this._conflictingSchedules ? [...this._conflictingSchedules] : null;
  }

  public get priority(): number | null {
    return this._priority;
  }

  public get location(): string | null {
    return this._location;
  }

  public get attendees(): string[] | null {
    return this._attendees ? [...this._attendees] : null;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的日程
   */
  public static create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    priority?: number;
    location?: string;
    attendees?: string[];
  }): Schedule {
    return new Schedule({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      startTime: params.startTime,
      endTime: params.endTime,
      priority: params.priority,
      location: params.location,
      attendees: params.attendees,
      hasConflict: false,
      conflictingSchedules: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * 从 ServerDTO 创建
   */
  public static fromServerDTO(dto: ScheduleServerDTO): Schedule {
    return new Schedule({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.name,
      description: dto.description,
      startTime: dto.startTime,
      endTime: dto.endTime,
      hasConflict: dto.hasConflict,
      conflictingSchedules: dto.conflictingSchedules ? [...dto.conflictingSchedules] : null,
      priority: dto.priority,
      location: dto.location,
      attendees: dto.attendees ? [...dto.attendees] : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 冲突检测业务逻辑 =====

  /**
   * 检测与其他日程的冲突
   * 
   * @param otherSchedules 要检查的其他日程列表
   * @returns 冲突检测结果
   */
  public detectConflicts(otherSchedules: Schedule[]): ConflictDetectionResult {
    // Filter overlapping schedules
    const conflictingSchedules = otherSchedules.filter((other) =>
      this.isOverlapping(other)
    );

    if (conflictingSchedules.length === 0) {
      return {
        hasConflict: false,
        conflicts: [],
        suggestions: [],
      };
    }

    // Generate conflict details
    const conflicts: ConflictDetail[] = conflictingSchedules.map((schedule) => ({
      scheduleUuid: schedule.uuid,
      scheduleTitle: schedule.title,
      overlapStart: Math.max(this._startTime, schedule.startTime),
      overlapEnd: Math.min(this._endTime, schedule.endTime),
      overlapDuration: this.calculateOverlap(schedule),
    }));

    // Generate suggestions
    const suggestions = this.generateSuggestions(conflictingSchedules);

    return {
      hasConflict: true,
      conflicts,
      suggestions,
    };
  }

  /**
   * 判断是否与另一个日程重叠
   * 
   * 重叠条件：(this.startTime < other.endTime) && (this.endTime > other.startTime)
   * 
   * @param other 另一个日程
   * @returns 是否重叠
   */
  private isOverlapping(other: Schedule): boolean {
    return this._startTime < other.endTime && this._endTime > other.startTime;
  }

  /**
   * 计算与另一个日程的重叠时长（分钟）
   * 
   * @param other 另一个日程
   * @returns 重叠时长（分钟）
   */
  private calculateOverlap(other: Schedule): number {
    const overlapStart = Math.max(this._startTime, other.startTime);
    const overlapEnd = Math.min(this._endTime, other.endTime);
    return this.calculateDuration(overlapStart, overlapEnd);
  }

  /**
   * 计算时长（分钟）
   * 
   * @param startTime 开始时间（毫秒）
   * @param endTime 结束时间（毫秒）
   * @returns 时长（分钟）
   */
  private calculateDuration(startTime: number, endTime: number): number {
    return Math.round((endTime - startTime) / 60000);
  }

  /**
   * 生成冲突解决建议
   * 
   * 策略：
   * 1. move_earlier: 移动到最早冲突日程之前
   * 2. move_later: 移动到最晚冲突日程之后
   * 3. shorten: 缩短时长以避免冲突（简化版：移到第一个空档）
   * 
   * @param conflicts 冲突日程列表
   * @returns 建议列表
   */
  private generateSuggestions(conflicts: Schedule[]): ConflictSuggestion[] {
    const suggestions: ConflictSuggestion[] = [];

    // Sort conflicts by startTime
    const sortedConflicts = [...conflicts].sort((a, b) => a.startTime - b.startTime);

    const earliestConflict = sortedConflicts[0];
    const latestConflict = sortedConflicts[sortedConflicts.length - 1];

    // Suggestion 1: Move earlier (before earliest conflict)
    if (earliestConflict) {
      const newEndTime = earliestConflict.startTime;
      const newStartTime = newEndTime - (this._endTime - this._startTime);
      suggestions.push({
        type: 'move_earlier',
        newStartTime,
        newEndTime,
      });
    }

    // Suggestion 2: Move later (after latest conflict)
    if (latestConflict) {
      const newStartTime = latestConflict.endTime;
      const newEndTime = newStartTime + (this._endTime - this._startTime);
      suggestions.push({
        type: 'move_later',
        newStartTime,
        newEndTime,
      });
    }

    // Suggestion 3: Shorten (simple version: move to first gap)
    // For MVP, we'll suggest shortening to fit before first conflict
    if (earliestConflict && this._startTime < earliestConflict.startTime) {
      suggestions.push({
        type: 'shorten',
        newStartTime: this._startTime,
        newEndTime: earliestConflict.startTime,
      });
    }

    return suggestions;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 ClientDTO (发送给前端)
   * Story 4-1: Schedule Event CRUD
   */
  public toClientDTO(): ScheduleClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._title,
      description: this._description,
      startTime: this._startTime,
      endTime: this._endTime,
      duration: this._duration,
      hasConflict: this._hasConflict,
      conflictingSchedules: this._conflictingSchedules,
      priority: this._priority,
      location: this._location,
      attendees: this._attendees,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 ServerDTO (内部使用)
   */
  public toServerDTO(): ScheduleServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._title,
      description: this._description ?? undefined,
      startTime: this._startTime,
      endTime: this._endTime,
      duration: this._duration,
      hasConflict: this._hasConflict,
      conflictingSchedules: this._conflictingSchedules ?? undefined,
      priority: this._priority ?? undefined,
      location: this._location ?? undefined,
      attendees: this._attendees ?? undefined,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  // ===== 业务方法 (Story 9.4) =====

  /**
   * 标记日程存在冲突
   * 
   * @param conflictingUuids 冲突日程的UUID列表
   */
  public markAsConflicting(conflictingUuids: string[]): void {
    this._hasConflict = true;
    this._conflictingSchedules = [...conflictingUuids];
    this._updatedAt = new Date();
  }

  /**
   * 清除冲突标记
   */
  public clearConflicts(): void {
    this._hasConflict = false;
    this._conflictingSchedules = null;
    this._updatedAt = new Date();
  }

  /**
   * 重新安排日程到新的时间
   * 
   * @param newStartTime 新的开始时间
   * @param newEndTime 新的结束时间
   */
  public reschedule(newStartTime: number, newEndTime: number): void {
    if (newStartTime >= newEndTime) {
      throw new Error('Invalid time range: startTime must be before endTime');
    }

    this._startTime = newStartTime;
    this._endTime = newEndTime;
    this._duration = this.calculateDuration(newStartTime, newEndTime);
    this._updatedAt = new Date();
  }

  // ===== 更新方法 (Story 4-1) =====

  /**
   * 更新标题
   */
  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    this._title = title;
    this._updatedAt = new Date();
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * 更新时间范围
   */
  public updateTimeRange(startTime: number, endTime: number): void {
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }
    this._startTime = startTime;
    this._endTime = endTime;
    this._duration = this.calculateDuration(startTime, endTime);
    this._updatedAt = new Date();
  }

  /**
   * 更新优先级
   */
  public updatePriority(priority: number | null): void {
    if (priority !== null && (priority < 1 || priority > 5)) {
      throw new Error('Priority must be between 1 and 5');
    }
    this._priority = priority;
    this._updatedAt = new Date();
  }

  /**
   * 更新地点
   */
  public updateLocation(location: string | null): void {
    this._location = location;
    this._updatedAt = new Date();
  }

  /**
   * 更新参与者
   */
  public updateAttendees(attendees: string[] | null): void {
    this._attendees = attendees ? [...attendees] : null;
    this._updatedAt = new Date();
  }
}
