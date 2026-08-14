/**
 * PowerSync implementation of DataPortabilityImportStore.
 *
 * Wraps db.writeTransaction() and executes raw INSERT/UPDATE SQL
 * with snake_case column names. JSON fields are stringified,
 * booleans are 0/1, dates are ISO strings.
 */

import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import { newId } from '@memoflow/utils';
import type {
  DataPortabilityImportStore,
  DataPortabilityImportTx,
  UpsertUserSettingInput,
  UpsertNotificationPreferenceInput,
  UpsertUserReminderPreferenceInput,
  CreateRepositoryInput,
  CreateResourceFolderInput,
  CreateResourceInput,
  CreateGoalFolderInput,
  CreateGoalInput,
  CreateKeyResultInput,
  CreateGoalReviewInput,
  CreateGoalRecordInput,
  CreateFocusSessionInput,
  CreateFocusModeInput,
  CreateTaskFolderInput,
  CreateTaskTemplateInput,
  CreateTaskInstanceInput,
  CreateTaskDependencyInput,
  CreateScheduleInput,
  CreateScheduleTaskInput,
  CreateReminderGroupInput,
  CreateReminderTemplateInput,
  CreateReminderResponseInput,
  CreateEditorWorkspaceInput,
  CreateEditorSessionInput,
  CreateEditorGroupInput,
  CreateEditorTabInput,
  CreateAIConversationInput,
  CreateAIMessageInput,
} from '../../application/import-store/data-portability-import-store';

// ============ Helpers ============

function json(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value ?? {});
}
function bool(value: boolean | undefined | null): number {
  return value ? 1 : 0;
}

function str(value: string | null | undefined): string | null {
  return value ?? null;
}

interface TimestampedInput {
  createdAt?: string;
  updatedAt?: string;
}

function createdUpdated(input: TimestampedInput): [string, string] {
  const fallback = new Date().toISOString();
  const createdAt = input.createdAt ?? fallback;
  return [createdAt, input.updatedAt ?? createdAt];
}

function createdAt(input: TimestampedInput): string {
  return input.createdAt ?? new Date().toISOString();
}

// ============ Transaction Implementation ============

class PowerSyncDataPortabilityImportTx implements DataPortabilityImportTx {
  constructor(private readonly tx: IElectronDatabaseTransaction) {}

  // --- Singletons ---

  async upsertUserSetting(input: UpsertUserSettingInput): Promise<void> {
    const existing = await this.tx.getOptional<{ id: string }>(
      `SELECT id FROM user_settings WHERE identity_id = ?`,
      [input.identityId],
    );
    if (existing) {
      await this.tx.execute(
        `UPDATE user_settings SET preferences = ?, updated_at = ? WHERE identity_id = ?`,
        [json(input.preferences), new Date().toISOString(), input.identityId],
      );
    } else {
      await this.tx.execute(
        `INSERT INTO user_settings (id, identity_id, preferences, version, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
        [input.id ?? newId(), input.identityId, json(input.preferences), ...createdUpdated({})],
      );
    }
  }

  async upsertNotificationPreference(input: UpsertNotificationPreferenceInput): Promise<void> {
    const existing = await this.tx.getOptional<{ id: string }>(
      `SELECT id FROM notification_preferences WHERE identity_id = ?`,
      [input.identityId],
    );
    if (existing) {
      await this.tx.execute(
        `UPDATE notification_preferences SET enabled = ?, channels = ?, categories = ?, do_not_disturb = ?, rate_limit = ?, updated_at = ? WHERE identity_id = ?`,
        [bool(input.enabled), input.channels, input.categories, str(input.doNotDisturb), str(input.rateLimit), new Date().toISOString(), input.identityId],
      );
    } else {
      await this.tx.execute(
        `INSERT INTO notification_preferences (id, identity_id, enabled, channels, categories, do_not_disturb, rate_limit, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [input.id, input.identityId, bool(input.enabled), input.channels, input.categories, str(input.doNotDisturb), str(input.rateLimit), ...createdUpdated({})],
      );
    }
  }

  async upsertUserReminderPreference(input: UpsertUserReminderPreferenceInput): Promise<void> {
    const existing = await this.tx.getOptional<{ identity_id: string }>(
      `SELECT identity_id FROM user_reminder_preferences WHERE identity_id = ?`,
      [input.identityId],
    );
    if (existing) {
      await this.tx.execute(
        `UPDATE user_reminder_preferences SET best_time_slots = ?, worst_time_slots = ?, global_reminder_enabled = ?, global_smart_frequency = ?, updated_at = ? WHERE identity_id = ?`,
        [input.bestTimeSlots, input.worstTimeSlots, bool(input.globalReminderEnabled), bool(input.globalSmartFrequency), new Date().toISOString(), input.identityId],
      );
    } else {
      await this.tx.execute(
        `INSERT INTO user_reminder_preferences (id, identity_id, best_time_slots, worst_time_slots, global_reminder_enabled, global_smart_frequency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.id, input.identityId, input.bestTimeSlots, input.worstTimeSlots, bool(input.globalReminderEnabled), bool(input.globalSmartFrequency), ...createdUpdated({})],
      );
    }
  }

  // --- Repository ---

  async createRepository(input: CreateRepositoryInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO repositories (id, identity_id, name, type, path, description, config, status, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, input.type, input.path, str(input.description), json(input.config), input.status, ...createdUpdated(input)],
    );
  }

  async createResourceFolder(input: CreateResourceFolderInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO folders (id, identity_id, repository_id, parent_id, name, path, "order", is_expanded, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.id, input.identityId, input.repositoryId, str(input.parentId), input.name, input.path, input.order, bool(input.isExpanded), json(input.metadata), ...createdUpdated(input)],
    );
  }

  async createResource(input: CreateResourceInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO resources (id, identity_id, repository_id, folder_id, name, type, path, size, content, metadata, status, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.repositoryId, str(input.folderId), input.name, input.type, input.path, input.size, str(input.content), json(input.metadata), input.status, ...createdUpdated(input)],
    );
  }

  // --- Goal ---

  async createGoalFolder(input: CreateGoalFolderInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO goal_folders (id, identity_id, name, description, color, icon, parent_folder_id, sort_order, is_system_folder, folder_type, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, str(input.description), str(input.color), str(input.icon), str(input.parentFolderId), input.sortOrder, bool(input.isSystemFolder), str(input.folderType), ...createdUpdated(input)],
    );
  }

  async createGoal(input: CreateGoalInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO goals (id, identity_id, name, description, color, feasibility_analysis, motivation, status, importance, priority, category, tags, start_date, target_date, completed_at, folder_id, parent_goal_id, sort_order, reminder_config, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, str(input.description), input.color, str(input.feasibilityAnalysis), str(input.motivation), input.status, input.importance, input.priority, str(input.category), json(input.tags), str(input.startDate), str(input.targetDate), str(input.completedAt), str(input.folderId), str(input.parentGoalId), input.sortOrder, str(input.reminderConfig), ...createdUpdated(input)],
    );
  }

  async createKeyResult(input: CreateKeyResultInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO key_results (id, identity_id, goal_id, title, description, value_type, aggregation_method, initial_value, target_value, current_value, unit, weight, "order", version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.goalId, input.title, str(input.description), input.valueType, input.aggregationMethod, input.initialValue, input.targetValue, input.currentValue, str(input.unit), input.weight, input.order, ...createdUpdated(input)],
    );
  }

  async createGoalReview(input: CreateGoalReviewInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO goal_reviews (id, identity_id, goal_id, review_type, content, achievements, challenges, lessons_learned, next_steps, rating, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.goalId, input.reviewType, input.content, str(input.achievements), str(input.challenges), str(input.lessonsLearned), str(input.nextSteps), input.rating ?? null, ...createdUpdated(input)],
    );
  }

  async createGoalRecord(input: CreateGoalRecordInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO goal_records (id, identity_id, key_result_id, value, note, recorded_at, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.keyResultId, input.value, str(input.note), input.recordedAt, ...createdUpdated(input)],
    );
  }

  async createFocusSession(input: CreateFocusSessionInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO focus_sessions (id, identity_id, goal_id, status, duration_minutes, actual_duration_minutes, description, started_at, completed_at, pause_count, paused_duration_minutes, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, str(input.goalId), input.status, input.durationMinutes, input.actualDurationMinutes, str(input.description), str(input.startedAt), str(input.completedAt), input.pauseCount, input.pausedDurationMinutes, ...createdUpdated(input)],
    );
  }

  async createFocusMode(input: CreateFocusModeInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO focus_modes (id, identity_id, focused_goal_ids, hidden_goals_mode, start_time, end_time, actual_end_time, is_active, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, json(input.focusedGoalIds), input.hiddenGoalsMode, input.startTime, input.endTime, str(input.actualEndTime), bool(input.isActive), ...createdUpdated(input)],
    );
  }

  // --- Task ---

  async createTaskFolder(input: CreateTaskFolderInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO task_folders (id, identity_id, name, color, icon, "order", version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, str(input.color), str(input.icon), input.order, ...createdUpdated(input)],
    );
  }

  async createTaskTemplate(input: CreateTaskTemplateInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO task_templates (id, identity_id, name, description, status, importance, color, tags, folder_id, parent_task_id, time_config_type, time_config_start_time, time_config_end_time, time_config_duration_minutes, time_config_time_point, time_config_time_range_start, time_config_time_range_end, recurrence_rule_type, recurrence_rule_interval, recurrence_rule_days_of_week, recurrence_rule_day_of_month, recurrence_rule_month_of_year, recurrence_rule_end_date, recurrence_rule_count, reminder_config_enabled, reminder_config_time_offset_minutes, reminder_config_unit, reminder_config_channel, goal_id, key_result_id, goal_record_value, goal_progress_trigger, checklist, dependency_status, is_blocked, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, str(input.description), input.status, input.importance, str(input.color), input.tags, str(input.folderId), str(input.parentTaskId), str(input.timeConfigType), str(input.timeConfigStartTime), str(input.timeConfigEndTime), input.timeConfigDurationMinutes, input.timeConfigTimePoint, input.timeConfigTimeRangeStart, input.timeConfigTimeRangeEnd, str(input.recurrenceRuleType), input.recurrenceRuleInterval, str(input.recurrenceRuleDaysOfWeek), input.recurrenceRuleDayOfMonth, input.recurrenceRuleMonthOfYear, str(input.recurrenceRuleEndDate), input.recurrenceRuleCount, input.reminderConfigEnabled != null ? bool(input.reminderConfigEnabled) : null, input.reminderConfigTimeOffsetMinutes, str(input.reminderConfigUnit), str(input.reminderConfigChannel), str(input.goalId), str(input.keyResultId), input.goalRecordValue, str(input.goalProgressTrigger), str(input.checklist), input.dependencyStatus, bool(input.isBlocked), ...createdUpdated(input)],
    );
  }

  async createTaskInstance(input: CreateTaskInstanceInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO task_instances (id, template_id, identity_id, instance_date, status, importance, time_config, actual_start_time, actual_end_time, comment, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.templateId, input.identityId, input.instanceDate, input.status, input.importance, input.timeConfig, str(input.actualStartTime), str(input.actualEndTime), str(input.comment), ...createdUpdated(input)],
    );
  }

  async createTaskDependency(input: CreateTaskDependencyInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO task_dependencies (id, identity_id, predecessor_task_id, successor_task_id, dependency_type, lag_days, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.predecessorTaskId, input.successorTaskId, input.dependencyType, input.lagDays, ...createdUpdated(input)],
    );
  }

  // --- Schedule ---

  async createSchedule(input: CreateScheduleInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO schedules (id, identity_id, title, description, start_time, end_time, duration, priority, location, attendees, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.id, input.identityId, input.title, str(input.description), input.startTime, input.endTime, input.duration, input.priority, str(input.location), str(input.attendees), ...createdUpdated(input)],
    );
  }

  async createScheduleTask(input: CreateScheduleTaskInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO schedule_tasks (id, identity_id, name, description, source_module, source_entity_id, status, enabled, cron_expression, timezone, start_date, end_date, max_executions, next_run_at, last_run_at, execution_count, last_execution_status, last_execution_duration, consecutive_failures, max_retries, initial_delay_ms, max_delay_ms, backoff_multiplier, retryable_statuses, payload, tags, priority, timeout, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [
        input.id,
        input.identityId,
        input.name,
        str(input.description),
        input.sourceModule,
        input.sourceEntityId,
        input.status,
        bool(input.enabled),
        str(input.cronExpression),
        input.timezone,
        str(input.startDate),
        str(input.endDate),
        input.maxExecutions,
        str(input.nextRunAt),
        str(input.lastRunAt),
        input.executionCount,
        str(input.lastExecutionStatus),
        input.lastExecutionDuration,
        input.consecutiveFailures,
        input.maxRetries,
        input.initialDelayMs,
        input.maxDelayMs,
        input.backoffMultiplier,
        input.retryableStatuses,
        str(input.payload),
        input.tags,
        input.priority,
        input.timeout,
        ...createdUpdated(input),
      ],
    );
  }

  // --- Reminder ---

  async createReminderGroup(input: CreateReminderGroupInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO reminder_groups (id, identity_id, name, description, color, icon, control_mode, enabled, status, "order", stats, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, str(input.description), str(input.color), str(input.icon), input.controlMode, bool(input.enabled), input.status, input.order, input.stats, ...createdUpdated(input)],
    );
  }

  async createReminderTemplate(input: CreateReminderTemplateInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO reminder_templates (id, identity_id, name, description, type, self_enabled, status, reminder_group_id, importance_level, tags, color, icon, trigger, active_time, active_hours, notification_config, stats, smart_frequency_enabled, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, str(input.description), input.type, bool(input.selfEnabled), input.status, str(input.reminderGroupId), input.importanceLevel, input.tags, str(input.color), str(input.icon), input.trigger, input.activeTime, str(input.activeHours), input.notificationConfig, input.stats, bool(input.smartFrequencyEnabled), ...createdUpdated(input)],
    );
  }

  async createReminderResponse(input: CreateReminderResponseInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO reminder_responses (id, identity_id, template_id, action, response_time, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.id, input.identityId, input.templateId, input.action, input.responseTime, input.timestamp, createdAt(input)],
    );
  }

  // --- Editor ---

  async createEditorWorkspace(input: CreateEditorWorkspaceInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO editor_workspaces (id, identity_id, name, description, project_path, project_type, layout, setting, is_active, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, str(input.description), input.projectPath, input.projectType, json(input.layout), json(input.setting), bool(input.isActive), ...createdUpdated(input)],
    );
  }

  async createEditorSession(input: CreateEditorSessionInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO editor_workspace_sessions (id, workspace_id, identity_id, name, layout, is_active, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.workspaceId, input.identityId, input.name, json(input.layout), bool(input.isActive), ...createdUpdated(input)],
    );
  }

  async createEditorGroup(input: CreateEditorGroupInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO editor_workspace_session_groups (id, session_id, workspace_id, identity_id, group_index, name, split_direction, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.sessionId, input.workspaceId, input.identityId, input.groupIndex, str(input.name), input.splitDirection, ...createdUpdated(input)],
    );
  }

  async createEditorTab(input: CreateEditorTabInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO editor_workspace_session_group_tabs (id, group_id, session_id, workspace_id, identity_id, resource_id, tab_index, tab_type, title, view_state, is_pinned, is_active, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.groupId, input.sessionId, input.workspaceId, input.identityId, str(input.resourceId), input.tabIndex, input.tabType, input.title, json(input.viewState), bool(input.isPinned), bool(input.isActive), ...createdUpdated(input)],
    );
  }

  // --- AI ---

  async createAIConversation(input: CreateAIConversationInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO ai_conversations (id, identity_id, name, status, version, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, 1, ?, ?, NULL)`,
      [input.id, input.identityId, input.name, input.status, ...createdUpdated(input)],
    );
  }

  async createAIMessage(input: CreateAIMessageInput): Promise<void> {
    await this.tx.execute(
      `INSERT INTO ai_messages (id, identity_id, conversation_id, role, content, token_usage, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.id, input.identityId, input.conversationId, input.role, input.content, str(input.tokenUsage), createdAt(input)],
    );
  }
}

// ============ Store Implementation ============

export class PowerSyncDataPortabilityImportStore implements DataPortabilityImportStore {
  constructor(private readonly db: IElectronDatabase) {}

  async transaction<T>(fn: (tx: DataPortabilityImportTx) => Promise<T>): Promise<T> {
    return this.db.writeTransaction(async (tx) => {
      const importTx = new PowerSyncDataPortabilityImportTx(tx);
      return fn(importTx);
    });
  }
}

/**
 * Creates a PowerSync-backed data portability import store.
 * 创建基于 PowerSync 的 data portability import store。
 *
 * Host-level composition ingredient: returns the `DataPortabilityImportStore`
 * port backed by the PowerSync adapter, so hosts never import the concrete class.
 *
 * 宿主级组合原料：返回由 PowerSync 适配器支撑的 `DataPortabilityImportStore` Port，
 * 宿主无需导入具体类。
 *
 * @param db - Electron database adapter owned by the desktop main runtime. 桌面主进程持有的 Electron 数据库适配器。
 * @returns A PowerSync-backed import store port. 基于 PowerSync 的 import store Port。
 */
export function createPowerSyncDataPortabilityImportStore(
  db: IElectronDatabase,
): DataPortabilityImportStore {
  return new PowerSyncDataPortabilityImportStore(db);
}
