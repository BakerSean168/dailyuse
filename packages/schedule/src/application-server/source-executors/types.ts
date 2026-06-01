/**
 * Source Executor Port Interfaces
 *
 * Minimal ports that the shared source executors need from each domain.
 * Apps provide concrete repository implementations that satisfy these interfaces.
 *
 * @module schedule/source-executors
 */

// ─── Reminder Source Ports ───────────────────────────────────────────

export interface ReminderSourceTemplate {
  readonly id: string;
  readonly identityId: string | number;
  readonly title: string;
  readonly description?: string | null;
  readonly deletedAt: Date | null;
  readonly nextTriggerAt: number | null;
  readonly notificationConfig: {
    title?: string | null;
    body?: string | null;
    channels?: unknown;
  };
  isEffectivelyEnabled(): boolean;
  recordTrigger(): void;
}

export interface ReminderSourceRepository {
  findById(id: string, options?: { includeHistory?: boolean }): Promise<ReminderSourceTemplate | null>;
  save(template: ReminderSourceTemplate): Promise<void>;
}

// ─── Goal Source Ports ───────────────────────────────────────────────

export interface GoalSourceGoal {
  readonly id: string;
  readonly identityId: string | number;
  readonly name: string;
  readonly description?: string | null;
  readonly deletedAt: Date | null;
  readonly archivedAt: Date | null;
  readonly completedAt: Date | null;
  readonly status: string;
  readonly reminderConfig?: { enabled: boolean } | null;
}

export interface GoalSourceRepository {
  findById(id: string, options?: { includeChildren?: boolean }): Promise<GoalSourceGoal | null>;
}

// ─── Task Source Ports ───────────────────────────────────────────────

export interface TaskSourceInstance {
  readonly id: string;
  readonly identityId: string | number;
  readonly templateId: string | number;
  readonly deletedAt: Date | null;
  readonly status: string;
}

export interface TaskSourceTemplate {
  readonly id: string;
  readonly title: string;
}

export interface TaskSourceInstanceRepository {
  findById(id: string): Promise<TaskSourceInstance | null>;
}

export interface TaskSourceTemplateRepository {
  findById(id: string): Promise<TaskSourceTemplate | null>;
}

// ─── Notification Port ──────────────────────────────────────────────

export interface NotificationSourceCreator {
  execute(params: {
    identityId: string;
    title: string;
    content: string;
    type: string;
    category: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    channels?: string[];
  }): Promise<unknown>;
}

// ─── Composite Dependencies ─────────────────────────────────────────

export interface SourceExecutorDependencies {
  readonly reminderRepository: ReminderSourceRepository;
  readonly goalRepository: GoalSourceRepository;
  readonly taskInstanceRepository: TaskSourceInstanceRepository;
  readonly taskTemplateRepository: TaskSourceTemplateRepository;
  readonly createNotification: NotificationSourceCreator;
}
