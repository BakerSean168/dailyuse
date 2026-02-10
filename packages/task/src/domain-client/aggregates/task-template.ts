/**
 * TaskTemplate Aggregate Root - Domain Client
 * 任务模板聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 TaskTemplateClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: TaskTemplateClientDTO): TaskTemplate
 * - Instance toDTO(): TaskTemplateClientDTO
 */

import type {
  TaskTemplateClient,
  TaskTemplateClientDTO,
  TaskTimeConfig,
  TaskTimeConfigDTO,
  RecurrenceRule,
  RecurrenceRuleDTO,
  TaskReminderConfig,
  TaskReminderConfigDTO,
  TaskGoalBinding,
  TaskGoalBindingDTO,
  TaskTemplateStatus,
} from '@dailyuse/contracts/task';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { TaskTemplateId } from '@/domain-shared';
import { GoalFolderId } from '@dailyuse/domain-shared/goal';
import { IdentityId } from '@dailyuse/domain-shared';

// 内部状态接口
interface TaskTemplateState {
  id: TaskTemplateId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  timeConfig: TaskTimeConfig;
  recurrenceRule: RecurrenceRule | null;
  reminderConfig: TaskReminderConfig | null;
  importance: ImportanceLevel;
  priority: number | undefined;
  goalBinding: TaskGoalBinding | null;
  folderId: GoalFolderId | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: Date | null;
  generateAheadDays: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  parentTaskId: TaskTemplateId | null;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  comment: string | null;
  blockingReason: string | null;
  dependencyStatus?: string;
  isBlocked?: boolean;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
  history?: any[];
  instances?: any[];
}

export class TaskTemplate extends AggregateRoot<TaskTemplateId> implements TaskTemplateClient {
  // ================= 1. Props =================
  private readonly _props: TaskTemplateState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: TaskTemplateState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get description(): string | null {
    return this._props.description;
  }

  get timeConfig(): TaskTimeConfig {
    return this._props.timeConfig;
  }

  get recurrenceRule(): RecurrenceRule | null {
    return this._props.recurrenceRule;
  }

  get reminderConfig(): TaskReminderConfig | null {
    return this._props.reminderConfig;
  }

  get importance(): ImportanceLevel {
    return this._props.importance;
  }

  get priority(): number | undefined {
    return this._props.priority;
  }

  get goalBinding(): TaskGoalBinding | null {
    return this._props.goalBinding;
  }

  get folderId(): GoalFolderId | null {
    return this._props.folderId;
  }

  get tags(): string[] {
    return [...this._props.tags];
  }

  get color(): string | null {
    return this._props.color;
  }

  get status(): TaskTemplateStatus {
    return this._props.status;
  }

  get lastGeneratedDate(): Date | null {
    return this._props.lastGeneratedDate;
  }

  get generateAheadDays(): number | null {
    return this._props.generateAheadDays;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  get parentTaskId(): TaskTemplateId | null {
    return this._props.parentTaskId;
  }

  get startDate(): Date | null {
    return this._props.startDate;
  }

  get dueDate(): Date | null {
    return this._props.dueDate;
  }

  get completedAt(): Date | null {
    return this._props.completedAt;
  }

  get estimatedMinutes(): number | null {
    return this._props.estimatedMinutes;
  }

  get actualMinutes(): number | null {
    return this._props.actualMinutes;
  }

  get comment(): string | null {
    return this._props.comment;
  }

  get dependencyStatus(): string | undefined {
    return this._props.dependencyStatus;
  }

  get isBlocked(): boolean | undefined {
    return this._props.isBlocked;
  }

  get blockingReason(): string | null {
    return this._props.blockingReason;
  }

  get instanceCount(): number {
    return this._props.instanceCount;
  }

  get completedInstanceCount(): number {
    return this._props.completedInstanceCount;
  }

  get pendingInstanceCount(): number {
    return this._props.pendingInstanceCount;
  }

  get completionRate(): number {
    return this._props.completionRate;
  }

  get history(): any[] | undefined {
    return this._props.history ? [...this._props.history] : undefined;
  }

  get instances(): any[] | undefined {
    return this._props.instances ? [...this._props.instances] : undefined;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get isCompleted(): boolean {
    return this._props.completedAt !== null;
  }

  get isOverdue(): boolean {
    if (!this._props.dueDate) return false;
    return this._props.dueDate.getTime() < Date.now() && !this.isCompleted;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: TaskTemplateClientDTO): TaskTemplate {
    return new TaskTemplate({
      id: TaskTemplateId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      timeConfig: TaskTemplate.parseTimeConfig(dto.timeConfig),
      recurrenceRule: dto.recurrenceRule ? TaskTemplate.parseRecurrenceRule(dto.recurrenceRule) : null,
      reminderConfig: dto.reminderConfig as TaskReminderConfig | null,
      importance: dto.importance,
      priority: dto.priority,
      goalBinding: dto.goalBinding ? TaskTemplate.parseGoalBinding(dto.goalBinding) : null,
      folderId: dto.folderId ? GoalFolderId.of(dto.folderId) : null,
      tags: dto.tags ?? [],
      color: dto.color,
      status: dto.status,
      lastGeneratedDate: dto.lastGeneratedDate ? new Date(dto.lastGeneratedDate) : null,
      generateAheadDays: dto.generateAheadDays,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      parentTaskId: dto.parentTaskId ? TaskTemplateId.of(dto.parentTaskId) : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      estimatedMinutes: dto.estimatedMinutes,
      actualMinutes: dto.actualMinutes,
      comment: dto.comment,
      dependencyStatus: dto.dependencyStatus,
      isBlocked: dto.isBlocked,
      blockingReason: dto.blockingReason,
      instanceCount: dto.instanceCount,
      completedInstanceCount: dto.completedInstanceCount,
      pendingInstanceCount: dto.pendingInstanceCount,
      completionRate: dto.completionRate,
      history: dto.history,
      instances: dto.instances,
    });
  }

  private static parseTimeConfig(dto: TaskTimeConfigDTO): TaskTimeConfig {
    return {
      timeType: dto.timeType,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    };
  }

  private static parseRecurrenceRule(dto: RecurrenceRuleDTO): RecurrenceRule {
    return {
      frequency: dto.frequency,
      interval: dto.interval,
      daysOfWeek: dto.daysOfWeek,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      occurrences: dto.occurrences,
    };
  }

  private static parseGoalBinding(dto: TaskGoalBindingDTO): TaskGoalBinding {
    return {
      goalId: dto.goalId as unknown as TaskGoalBinding['goalId'],
      keyResultId: dto.keyResultId as unknown as TaskGoalBinding['keyResultId'],
      goalRecordValue: dto.goalRecordValue,
    };
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): TaskTemplateClientDTO {
    return {
      id: String(this.id) as TaskTemplateClientDTO['id'],
      identityId: String(this._props.identityId) as TaskTemplateClientDTO['identityId'],
      name: this._props.name,
      description: this._props.description,
      timeConfig: this.serializeTimeConfig(this._props.timeConfig),
      recurrenceRule: this._props.recurrenceRule ? this.serializeRecurrenceRule(this._props.recurrenceRule) : null,
      reminderConfig: this._props.reminderConfig as TaskReminderConfigDTO | null,
      importance: this._props.importance,
      priority: this._props.priority,
      goalBinding: this._props.goalBinding ? this.serializeGoalBinding(this._props.goalBinding) : null,
      folderId: this._props.folderId ? String(this._props.folderId) : null,
      tags: [...this._props.tags],
      color: this._props.color,
      status: this._props.status,
      lastGeneratedDate: this._props.lastGeneratedDate?.getTime() ?? null,
      generateAheadDays: this._props.generateAheadDays,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      parentTaskId: this._props.parentTaskId ? String(this._props.parentTaskId) : null,
      startDate: this._props.startDate?.getTime() ?? null,
      dueDate: this._props.dueDate?.getTime() ?? null,
      completedAt: this._props.completedAt?.getTime() ?? null,
      estimatedMinutes: this._props.estimatedMinutes,
      actualMinutes: this._props.actualMinutes,
      comment: this._props.comment,
      dependencyStatus: this._props.dependencyStatus,
      isBlocked: this._props.isBlocked,
      blockingReason: this._props.blockingReason,
      instanceCount: this._props.instanceCount,
      completedInstanceCount: this._props.completedInstanceCount,
      pendingInstanceCount: this._props.pendingInstanceCount,
      completionRate: this._props.completionRate,
      history: this._props.history ? [...this._props.history] : undefined,
      instances: this._props.instances ? [...this._props.instances] : undefined,
    };
  }

  private serializeTimeConfig(config: TaskTimeConfig): TaskTimeConfigDTO {
    return {
      timeType: config.timeType,
      startDate: config.startDate ? (config.startDate as Date).getTime() : null,
      timePoint: config.timePoint,
      timeRange: config.timeRange,
    };
  }

  private serializeRecurrenceRule(rule: RecurrenceRule): RecurrenceRuleDTO {
    return {
      frequency: rule.frequency,
      interval: rule.interval,
      daysOfWeek: rule.daysOfWeek,
      endDate: rule.endDate ? (rule.endDate as Date).getTime() : null,
      occurrences: rule.occurrences,
    };
  }

  private serializeGoalBinding(binding: TaskGoalBinding): TaskGoalBindingDTO {
    return {
      goalId: String(binding.goalId),
      keyResultId: String(binding.keyResultId),
      goalRecordValue: binding.goalRecordValue,
    };
  }
}
