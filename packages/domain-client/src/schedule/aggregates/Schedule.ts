/**
 * Schedule 聚合根实现 (Client)
 * 用户日历事件/会议，支持冲突检测
 *
 * **严格参考 ScheduleTask.ts 规范**
 *
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

import type { ScheduleClient, ScheduleClientDTO, ScheduleServerDTO } from '@dailyuse/contracts/schedule';
import { AggregateRoot } from '@dailyuse/utils';

/**
 * Schedule 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理日历事件数据
 * - 执行业务逻辑（冲突检测等）
 * - 确保聚合内的一致性
 */
export class Schedule extends AggregateRoot implements ScheduleClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _startTime: number;
  private _endTime: number;
  private _duration: number;
  private _hasConflict: boolean;
  private _conflictingSchedules: readonly string[] | null;
  private _priority: number | null;
  private _location: string | null;
  private _attendees: readonly string[] | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    startTime: number;
    endTime: number;
    duration: number;
    hasConflict: boolean;
    conflictingSchedules?: readonly string[] | null;
    priority?: number | null;
    location?: string | null;
    attendees?: readonly string[] | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description ?? null;
    this._startTime = params.startTime;
    this._endTime = params.endTime;
    this._duration = params.duration;
    this._hasConflict = params.hasConflict;
    this._conflictingSchedules = params.conflictingSchedules ?? null;
    this._priority = params.priority ?? null;
    this._location = params.location ?? null;
    this._attendees = params.attendees ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
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
  public get conflictingSchedules(): readonly string[] | null {
    return this._conflictingSchedules;
  }
  public get priority(): number | null {
    return this._priority;
  }
  public get location(): string | null {
    return this._location;
  }
  public get attendees(): readonly string[] | null {
    return this._attendees;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== UI 辅助属性 =====

  /**
   * 时长显示（人性化格式）
   */
  public get durationDisplay(): string {
    const minutes = this._duration;
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}小时`;
    }
    return `${hours}小时${remainingMinutes}分钟`;
  }

  /**
   * 开始时间格式化
   */
  public get startTimeFormatted(): string {
    return this.formatDateTime(this._startTime);
  }

  /**
   * 结束时间格式化
   */
  public get endTimeFormatted(): string {
    return this.formatDateTime(this._endTime);
  }

  /**
   * 时间范围显示
   */
  public get timeRangeDisplay(): string {
    const start = new Date(this._startTime);
    const end = new Date(this._endTime);
    const sameDay = this.isSameDay(start, end);

    if (sameDay) {
      return `${this.formatDate(start)} ${this.formatTime(start)} - ${this.formatTime(end)}`;
    }
    return `${this.formatDateTime(this._startTime)} - ${this.formatDateTime(this._endTime)}`;
  }

  /**
   * 优先级显示
   */
  public get priorityDisplay(): string {
    if (this._priority === null) return '无';
    const labels: Record<number, string> = {
      1: '最低',
      2: '低',
      3: '中',
      4: '高',
      5: '最高',
    };
    return labels[this._priority] || `${this._priority}`;
  }

  /**
   * 优先级颜色
   */
  public get priorityColor(): string {
    if (this._priority === null) return 'gray';
    const colors: Record<number, string> = {
      1: 'gray',
      2: 'blue',
      3: 'yellow',
      4: 'orange',
      5: 'red',
    };
    return colors[this._priority] || 'gray';
  }

  /**
   * 冲突状态显示
   */
  public get conflictDisplay(): string {
    if (!this._hasConflict) return '无冲突';
    const count = this._conflictingSchedules?.length || 0;
    return `有 ${count} 个冲突`;
  }

  /**
   * 冲突状态颜色
   */
  public get conflictColor(): string {
    return this._hasConflict ? 'red' : 'green';
  }

  /**
   * 参与者数量
   */
  public get attendeeCount(): number {
    return this._attendees?.length || 0;
  }

  /**
   * 参与者显示
   */
  public get attendeesDisplay(): string {
    if (!this._attendees || this._attendees.length === 0) return '无参与者';
    if (this._attendees.length === 1) return this._attendees[0];
    return `${this._attendees[0]} 等 ${this._attendees.length} 人`;
  }

  /**
   * 创建时间格式化
   */
  public get formattedCreatedAt(): string {
    return this.formatDateTime(this._createdAt);
  }

  /**
   * 更新时间格式化
   */
  public get formattedUpdatedAt(): string {
    return this.formatDateTime(this._updatedAt);
  }

  // ===== 业务方法 =====

  /**
   * 是否正在进行中
   */
  public isOngoing(): boolean {
    const now = Date.now();
    return now >= this._startTime && now <= this._endTime;
  }

  /**
   * 是否已过期
   */
  public isPast(): boolean {
    return Date.now() > this._endTime;
  }

  /**
   * 是否即将开始（默认 30 分钟内）
   */
  public isUpcoming(withinMinutes: number = 30): boolean {
    const now = Date.now();
    const threshold = now + withinMinutes * 60 * 1000;
    return this._startTime > now && this._startTime <= threshold;
  }

  /**
   * 是否是今天的日程
   */
  public isToday(): boolean {
    const today = new Date();
    const start = new Date(this._startTime);
    return this.isSameDay(today, start);
  }

  /**
   * 是否有冲突
   */
  public hasConflicts(): boolean {
    return this._hasConflict;
  }

  /**
   * 获取冲突数量
   */
  public getConflictCount(): number {
    return this._conflictingSchedules?.length || 0;
  }

  /**
   * 是否有地点
   */
  public hasLocation(): boolean {
    return !!this._location;
  }

  /**
   * 是否有参与者
   */
  public hasAttendees(): boolean {
    return !!this._attendees && this._attendees.length > 0;
  }

  /**
   * 检查是否与另一个时间段重叠
   */
  public overlaps(startTime: number, endTime: number): boolean {
    return this._startTime < endTime && this._endTime > startTime;
  }

  /**
   * 计算与另一个日程的重叠时长（分钟）
   */
  public getOverlapDuration(startTime: number, endTime: number): number {
    if (!this.overlaps(startTime, endTime)) return 0;
    const overlapStart = Math.max(this._startTime, startTime);
    const overlapEnd = Math.min(this._endTime, endTime);
    return Math.round((overlapEnd - overlapStart) / 60000);
  }

  // ===== 格式化辅助方法 =====

  private formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // ===== 工厂方法 =====

  /**
   * 创建一个空的 Schedule 实例（用于新建表单）
   */
  public static forCreate(accountUuid: string): Schedule {
    const now = Date.now();
    // 默认创建 1 小时后开始的 1 小时事件
    const startTime = now + 60 * 60 * 1000;
    const endTime = startTime + 60 * 60 * 1000;
    return new Schedule({
      accountUuid,
      title: '',
      description: null,
      startTime,
      endTime,
      duration: 60,
      hasConflict: false,
      conflictingSchedules: null,
      priority: null,
      location: null,
      attendees: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  public clone(): Schedule {
    return Schedule.fromClientDTO(this.toClientDTO());
  }

  /**
   * 创建新的 Schedule 聚合根
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
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();
    const duration = Math.round((params.endTime - params.startTime) / 60000);

    return new Schedule({
      uuid,
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      startTime: params.startTime,
      endTime: params.endTime,
      duration,
      hasConflict: false,
      conflictingSchedules: null,
      priority: params.priority,
      location: params.location,
      attendees: params.attendees,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 状态修改方法（返回新实例，保持不可变性）=====

  /**
   * 更新标题
   */
  public updateTitle(title: string): Schedule {
    if (!title || title.trim().length === 0) {
      throw new Error('标题不能为空');
    }
    const cloned = this.clone();
    cloned._title = title.trim();
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string | null): Schedule {
    const cloned = this.clone();
    cloned._description = description;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 更新时间范围
   */
  public updateTimeRange(startTime: number, endTime: number): Schedule {
    if (startTime >= endTime) {
      throw new Error('开始时间必须早于结束时间');
    }
    const cloned = this.clone();
    cloned._startTime = startTime;
    cloned._endTime = endTime;
    cloned._duration = Math.round((endTime - startTime) / 60000);
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 更新优先级
   */
  public updatePriority(priority: number | null): Schedule {
    if (priority !== null && (priority < 1 || priority > 5)) {
      throw new Error('优先级必须在 1-5 之间');
    }
    const cloned = this.clone();
    cloned._priority = priority;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 更新地点
   */
  public updateLocation(location: string | null): Schedule {
    const cloned = this.clone();
    cloned._location = location;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 更新参与者
   */
  public updateAttendees(attendees: string[] | null): Schedule {
    const cloned = this.clone();
    cloned._attendees = attendees ? [...attendees] : null;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 添加参与者
   */
  public addAttendee(attendee: string): Schedule {
    const cloned = this.clone();
    const currentAttendees = cloned._attendees ? [...cloned._attendees] : [];
    if (!currentAttendees.includes(attendee)) {
      currentAttendees.push(attendee);
    }
    cloned._attendees = currentAttendees;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 移除参与者
   */
  public removeAttendee(attendee: string): Schedule {
    const cloned = this.clone();
    const currentAttendees = cloned._attendees ? [...cloned._attendees] : [];
    const index = currentAttendees.indexOf(attendee);
    if (index > -1) {
      currentAttendees.splice(index, 1);
    }
    cloned._attendees = currentAttendees.length > 0 ? currentAttendees : null;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 更新冲突状态
   */
  public updateConflictStatus(hasConflict: boolean, conflictingSchedules: string[] | null): Schedule {
    const cloned = this.clone();
    cloned._hasConflict = hasConflict;
    cloned._conflictingSchedules = conflictingSchedules;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ScheduleServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description ?? undefined,
      startTime: this._startTime,
      endTime: this._endTime,
      duration: this._duration,
      hasConflict: this._hasConflict,
      conflictingSchedules: this._conflictingSchedules ?? undefined,
      priority: this._priority ?? undefined,
      location: this._location ?? undefined,
      attendees: this._attendees ?? undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ScheduleClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      startTime: this._startTime,
      endTime: this._endTime,
      duration: this._duration,
      hasConflict: this._hasConflict,
      conflictingSchedules: this._conflictingSchedules,
      priority: this._priority,
      location: this._location,
      attendees: this._attendees,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: ScheduleServerDTO): Schedule {
    return new Schedule({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      startTime: dto.startTime,
      endTime: dto.endTime,
      duration: dto.duration,
      hasConflict: dto.hasConflict,
      conflictingSchedules: dto.conflictingSchedules,
      priority: dto.priority,
      location: dto.location,
      attendees: dto.attendees,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 Client DTO 创建实体
   */
  public static fromClientDTO(dto: ScheduleClientDTO): Schedule {
    return new Schedule({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      startTime: dto.startTime,
      endTime: dto.endTime,
      duration: dto.duration,
      hasConflict: dto.hasConflict,
      conflictingSchedules: dto.conflictingSchedules,
      priority: dto.priority,
      location: dto.location,
      attendees: dto.attendees,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
