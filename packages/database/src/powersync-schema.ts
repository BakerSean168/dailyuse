/**
 * PowerSync Client-Side Schema
 *
 * Defines the SQLite column types for every synced table.
 * This is the single source of truth for the client-side schema,
 * shared by both Desktop (@powersync/node) and Web (@powersync/web).
 *
 * Column type mapping from Prisma/Postgres:
 *   String / DateTime / Json / Enum → column.text
 *   Int / Boolean                    → column.integer
 *   Float                            → column.real
 *   BigInt                           → column.integer
 *   String[]                         → column.text  (JSON-serialised array)
 *
 * Notes:
 *   - PowerSync auto-provides the `id` column (TEXT PRIMARY KEY) — do NOT define it.
 *   - Relation fields are omitted — only scalar/FK columns are defined.
 *   - `@@map` names are used as table keys (snake_case SQL names).
 */

import { column, Schema, Table } from '@powersync/common';

// ──────────────────────────────────────────────
// Authentication
// ──────────────────────────────────────────────

const auth_identities = new Table({
  status: column.text,
  failed_login_attempts: column.integer,
  last_failed_attempt: column.text,
  locked_until: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const auth_identifiers = new Table({
  identity_id: column.text,
  type: column.text,
  value: column.text,
  is_verified: column.integer,
  created_at: column.text,
});

const auth_oauth_bindings = new Table({
  identity_id: column.text,
  provider: column.text,
  provider_subject_id: column.text,
  access_token: column.text,
  refresh_token: column.text,
  expires_at: column.text,
  created_at: column.text,
  last_used_at: column.text,
});

const auth_credentials = new Table({
  identity_id: column.text,
  type: column.text,
  status: column.text,
  password_hash: column.text,
  password_last_changed_at: column.text,
  version: column.integer,
  created_at: column.text,
  last_used_at: column.text,
  deleted_at: column.text,
});

const auth_sessions = new Table({
  identity_id: column.text,
  refresh_token_hash: column.text,
  device_id: column.text,
  device_fingerprint: column.text,
  device_type: column.text,
  device_name: column.text,
  os: column.text,
  browser: column.text,
  ip_address: column.text,
  location: column.text,
  version: column.integer,
  created_at: column.text,
  expires_at: column.text,
  last_active_at: column.text,
  deleted_at: column.text,
});

// ──────────────────────────────────────────────
// Account
// ──────────────────────────────────────────────

const accounts = new Table({
  status: column.text,
  profile: column.text, // JSON
  settings: column.text, // JSON
  email_address: column.text,
  email_is_verified: column.integer, // boolean
  email_verified_at: column.text, // DateTime
  email_is_primary: column.integer, // boolean
  phone_country_code: column.text,
  phone_number: column.text,
  phone_full_number: column.text,
  phone_is_verified: column.integer, // boolean
  phone_verified_at: column.text, // DateTime
  version: column.integer,
  created_at: column.text, // DateTime
  updated_at: column.text, // DateTime
  deleted_at: column.text, // DateTime
});

// ──────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────

const user_settings = new Table({
  identity_id: column.text,
  preferences: column.text, // JSON
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

// ──────────────────────────────────────────────
// Goal
// ──────────────────────────────────────────────

const goals = new Table({
  identity_id: column.text,
  name: column.text,
  description: column.text,
  color: column.text,
  feasibility_analysis: column.text,
  motivation: column.text,
  status: column.text,
  importance: column.text,
  priority: column.integer,
  category: column.text,
  tags: column.text, // JSON array
  start_date: column.text, // DateTime
  target_date: column.text, // DateTime
  completed_at: column.text, // DateTime
  archived_at: column.text, // DateTime
  folder_id: column.text, // FK
  parent_goal_id: column.text, // FK (self)
  sort_order: column.integer,
  reminder_config: column.text, // JSON
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const goal_folders = new Table({
  identity_id: column.text,
  name: column.text,
  description: column.text,
  color: column.text,
  icon: column.text,
  folder_type: column.text,
  is_system_folder: column.integer, // boolean
  parent_folder_id: column.text, // FK (self)
  sort_order: column.integer,
  goal_count: column.integer,
  completed_goal_count: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const key_results = new Table({
  identity_id: column.text,
  goal_id: column.text, // FK
  title: column.text,
  description: column.text,
  value_type: column.text,
  aggregation_method: column.text,
  target_value: column.real,
  current_value: column.real,
  unit: column.text,
  weight: column.real,
  order: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const goal_records = new Table({
  identity_id: column.text,
  key_result_id: column.text, // FK
  value: column.real,
  note: column.text,
  recorded_at: column.text, // DateTime
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const goal_reviews = new Table({
  identity_id: column.text,
  goal_id: column.text, // FK
  review_type: column.text,
  content: column.text,
  achievements: column.text,
  challenges: column.text,
  lessons_learned: column.text,
  next_steps: column.text,
  rating: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const key_result_weight_snapshots = new Table({
  identity_id: column.text,
  goal_id: column.text, // FK
  key_result_id: column.text, // FK
  old_weight: column.real,
  new_weight: column.real,
  weight_delta: column.real,
  snapshot_time: column.text, // DateTime
  trigger: column.text,
  reason: column.text,
  operator_id: column.text,
  created_at: column.text,
});

const focus_sessions = new Table({
  identity_id: column.text,
  goal_id: column.text, // FK (optional)
  status: column.text,
  duration_minutes: column.integer,
  actual_duration_minutes: column.integer,
  description: column.text,
  started_at: column.text, // DateTime
  paused_at: column.text, // DateTime
  resumed_at: column.text, // DateTime
  completed_at: column.text, // DateTime
  cancelled_at: column.text, // DateTime
  pause_count: column.integer,
  paused_duration_minutes: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const focus_modes = new Table({
  identity_id: column.text,
  focused_goal_ids: column.text, // JSON array
  hidden_goals_mode: column.text,
  start_time: column.text, // DateTime
  end_time: column.text, // DateTime
  actual_end_time: column.text, // DateTime
  is_active: column.integer, // boolean
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const goal_statistics = new Table({
  identity_id: column.text,
  total_goals: column.integer,
  active_goals: column.integer,
  completed_goals: column.integer,
  archived_goals: column.integer,
  total_key_results: column.integer,
  completed_key_results: column.integer,
  total_focus_sessions: column.integer,
  total_focus_minutes: column.integer,
  total_reviews: column.integer,
  average_rating: column.real,
  calculated_at: column.text, // DateTime
  created_at: column.text,
  updated_at: column.text,
});

// ──────────────────────────────────────────────
// Task
// ──────────────────────────────────────────────

const task_folders = new Table({
  identity_id: column.text,
  name: column.text,
  color: column.text,
  icon: column.text,
  order: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const task_templates = new Table({
  identity_id: column.text,
  name: column.text,
  description: column.text,
  status: column.text,
  importance: column.text,
  priority: column.integer,
  color: column.text,
  tags: column.text, // JSON array
  folder_id: column.text, // FK
  parent_task_id: column.text, // FK (self)
  time_config_type: column.text,
  time_config_start_time: column.text,
  time_config_end_time: column.text,
  time_config_duration_minutes: column.integer,
  recurrence_rule_type: column.text,
  recurrence_rule_interval: column.integer,
  recurrence_rule_days_of_week: column.text,
  recurrence_rule_day_of_month: column.integer,
  recurrence_rule_month_of_year: column.integer,
  recurrence_rule_end_date: column.text,
  recurrence_rule_count: column.integer,
  reminder_config_enabled: column.integer, // boolean
  reminder_config_time_offset_minutes: column.integer,
  reminder_config_unit: column.text,
  reminder_config_channel: column.text,
  last_generated_date: column.text,
  generate_ahead_days: column.integer,
  goal_binding: column.text, // JSON
  checklist: column.text, // JSON
  blocking_reason: column.text,
  dependency_status: column.text,
  is_blocked: column.integer, // boolean
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const task_instances = new Table({
  template_id: column.text, // FK
  identity_id: column.text,
  instance_date: column.text, // DateTime
  status: column.text,
  importance: column.text,
  priority: column.integer,
  time_config: column.text, // JSON
  actual_start_time: column.text,
  actual_end_time: column.text,
  comment: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const task_dependencies = new Table({
  identity_id: column.text,
  predecessor_task_id: column.text, // FK
  successor_task_id: column.text, // FK
  dependency_type: column.text,
  lag_days: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const task_template_history = new Table({
  identity_id: column.text,
  template_id: column.text, // FK
  action: column.text,
  changes: column.text, // JSON
  created_at: column.text,
});

const task_statistics = new Table({
  identity_id: column.text,
  calculated_at: column.text,
  template_total: column.integer,
  template_active: column.integer,
  template_paused: column.integer,
  template_archived: column.integer,
  template_one_time: column.integer,
  template_recurring: column.integer,
  instance_total: column.integer,
  instance_today: column.integer,
  instance_week: column.integer,
  instance_month: column.integer,
  instance_pending: column.integer,
  instance_in_progress: column.integer,
  instance_completed: column.integer,
  instance_skipped: column.integer,
  instance_expired: column.integer,
  completion_today: column.integer,
  completion_week: column.integer,
  completion_month: column.integer,
  completion_total: column.integer,
  completion_avg_time: column.real,
  completion_rate: column.real,
  time_all_day: column.integer,
  time_point: column.integer,
  time_range: column.integer,
  time_overdue: column.integer,
  time_upcoming: column.integer,
  distribution_by_importance: column.text, // JSON
  distribution_by_urgency: column.text, // JSON
  distribution_by_folder: column.text, // JSON
  distribution_by_tag: column.text, // JSON
});

// ──────────────────────────────────────────────
// Schedule
// ──────────────────────────────────────────────

const schedules = new Table({
  identity_id: column.text,
  title: column.text,
  description: column.text,
  start_time: column.text,
  end_time: column.text,
  duration: column.integer,
  has_conflict: column.integer, // boolean
  conflicting_schedules: column.text, // JSON
  priority: column.integer,
  location: column.text,
  attendees: column.text, // JSON
  created_at: column.text,
  updated_at: column.text,
});

const schedule_jobs = new Table({
  identity_id: column.text,
  next_run_at: column.text,
  cron_expression: column.text,
  source_module: column.text,
  source_id: column.text,
  trigger_event: column.text,
  payload: column.text, // JSON
  created_at: column.text,
  updated_at: column.text,
});

const schedule_tasks = new Table({
  identity_id: column.text,
  name: column.text,
  description: column.text,
  source_module: column.text,
  source_entity_id: column.text,
  status: column.text,
  enabled: column.integer, // boolean
  cron_expression: column.text,
  timezone: column.text,
  start_date: column.text,
  end_date: column.text,
  max_executions: column.integer,
  next_run_at: column.text,
  last_run_at: column.text,
  execution_count: column.integer,
  last_execution_status: column.text,
  last_execution_duration: column.integer,
  consecutive_failures: column.integer,
  max_retries: column.integer,
  initial_delay_ms: column.integer,
  max_delay_ms: column.integer,
  backoff_multiplier: column.real,
  retryable_statuses: column.text, // JSON
  payload: column.text, // JSON
  tags: column.text, // JSON
  priority: column.text,
  timeout: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const schedule_executions = new Table({
  identity_id: column.text,
  task_id: column.text, // FK
  execution_time: column.text,
  status: column.text,
  duration: column.integer,
  result: column.text, // JSON
  error: column.text,
  retry_count: column.integer,
  created_at: column.text,
});

const schedule_statistics = new Table({
  identity_id: column.text,
  total_tasks: column.integer,
  active_tasks: column.integer,
  paused_tasks: column.integer,
  completed_tasks: column.integer,
  cancelled_tasks: column.integer,
  failed_tasks: column.integer,
  total_executions: column.integer,
  successful_executions: column.integer,
  failed_executions: column.integer,
  skipped_executions: column.integer,
  timeout_executions: column.integer,
  avg_execution_duration: column.real,
  min_execution_duration: column.real,
  max_execution_duration: column.real,
  module_statistics: column.text, // JSON
  last_updated_at: column.text,
  created_at: column.text,
});

// ──────────────────────────────────────────────
// Reminder
// ──────────────────────────────────────────────

const reminder_templates = new Table({
  identity_id: column.text,
  name: column.text,
  description: column.text,
  type: column.text,
  self_enabled: column.integer, // boolean
  status: column.text,
  reminder_group_id: column.text, // FK
  importance_level: column.text,
  tags: column.text, // JSON
  color: column.text,
  icon: column.text,
  next_trigger_at: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
  trigger: column.text, // JSON
  recurrence: column.text, // JSON
  active_time: column.text, // JSON
  active_hours: column.text, // JSON
  notification_config: column.text, // JSON
  stats: column.text, // JSON
  click_rate: column.real,
  ignore_rate: column.real,
  avg_response_time: column.integer,
  snooze_count: column.integer,
  effectiveness_score: column.real,
  sample_size: column.integer,
  last_analysis_time: column.text,
  original_interval: column.integer,
  adjusted_interval: column.integer,
  adjustment_reason: column.text,
  adjustment_time: column.text,
  is_auto_adjusted: column.integer, // boolean
  user_confirmed: column.integer, // boolean
  smart_frequency_enabled: column.integer, // boolean
});

const reminder_groups = new Table({
  identity_id: column.text,
  name: column.text,
  description: column.text,
  color: column.text,
  icon: column.text,
  control_mode: column.text,
  enabled: column.integer, // boolean
  status: column.text,
  order: column.integer,
  stats: column.text, // JSON
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const reminder_instances = new Table({
  template_id: column.text, // FK
  identity_id: column.text,
  trigger_at: column.text,
  status: column.text,
  result: column.text,
  processed_at: column.text,
  note: column.text,
  payload: column.text, // JSON
  created_at: column.text,
  updated_at: column.text,
});

const reminder_history = new Table({
  identity_id: column.text,
  template_id: column.text, // FK
  triggered_at: column.text,
  result: column.text,
  error: column.text,
  notification_sent: column.integer, // boolean
  notification_channel: column.text,
  created_at: column.text,
});

const reminder_statistics = new Table({
  identity_id: column.text,
  template_stats: column.text, // JSON
  group_stats: column.text, // JSON
  trigger_stats: column.text, // JSON
  calculated_at: column.text,
});

const reminder_responses = new Table({
  identity_id: column.text,
  template_id: column.text, // FK
  action: column.text,
  response_time: column.integer,
  timestamp: column.text,
  created_at: column.text,
});

const user_reminder_preferences = new Table({
  identity_id: column.text,
  best_time_slots: column.text, // JSON
  worst_time_slots: column.text, // JSON
  global_smart_frequency: column.integer, // boolean
  created_at: column.text,
  updated_at: column.text,
});

// ──────────────────────────────────────────────
// Notification
// ──────────────────────────────────────────────

const notifications = new Table({
  identity_id: column.text,
  type: column.text,
  category: column.text,
  status: column.text,
  title: column.text,
  content: column.text,
  importance: column.text,
  urgency: column.text,
  related_entity_type: column.text,
  related_entity_id: column.text,
  metadata: column.text, // JSON
  actions: column.text, // JSON
  read_at: column.text,
  sent_at: column.text,
  expires_at: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
  is_read: column.integer, // boolean
});

const notification_channels = new Table({
  identity_id: column.text,
  notification_id: column.text, // FK
  channel_type: column.text,
  status: column.text,
  recipient: column.text,
  max_retries: column.integer,
  error: column.text,
  response: column.text,
  retry_count: column.integer,
});

const notification_history = new Table({
  identity_id: column.text,
  notification_id: column.text, // FK
  action: column.text,
  details: column.text,
  actor_id: column.text,
  created_at: column.text,
});

const notification_preferences = new Table({
  identity_id: column.text,
  enabled: column.integer, // boolean
  channels: column.text, // JSON
  categories: column.text, // JSON
  do_not_disturb: column.text, // JSON
  rate_limit: column.text, // JSON
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const notification_templates = new Table({
  name: column.text,
  display_name: column.text,
  description: column.text,
  type: column.text,
  category: column.text,
  title_template: column.text,
  content_template: column.text,
  variables: column.text, // JSON
  default_actions: column.text, // JSON
  is_system: column.integer, // boolean
  is_active: column.integer, // boolean
  created_at: column.text,
  updated_at: column.text,
});

// ──────────────────────────────────────────────
// Editor
// ──────────────────────────────────────────────

const editor_workspaces = new Table({
  identity_id: column.text,
  name: column.text,
  description: column.text,
  project_path: column.text,
  project_type: column.text,
  layout: column.text, // JSON
  setting: column.text, // JSON
  is_active: column.integer, // boolean
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  accessed_at: column.text,
  deleted_at: column.text,
});

const editor_workspace_sessions = new Table({
  workspace_id: column.text, // FK
  identity_id: column.text,
  name: column.text,
  layout: column.text, // JSON
  is_active: column.integer, // boolean
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const editor_workspace_session_groups = new Table({
  session_id: column.text, // FK
  workspace_id: column.text, // FK
  identity_id: column.text,
  group_index: column.integer,
  name: column.text,
  split_direction: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const editor_workspace_session_group_tabs = new Table({
  group_id: column.text, // FK
  session_id: column.text, // FK
  workspace_id: column.text, // FK
  identity_id: column.text,
  document_id: column.text,
  tab_index: column.integer,
  tab_type: column.text,
  title: column.text,
  view_state: column.text, // JSON
  is_pinned: column.integer, // boolean
  is_active: column.integer, // boolean
  version: column.integer,
  created_at: column.text,
});

// ──────────────────────────────────────────────
// Document
// ──────────────────────────────────────────────

const documents = new Table({
  identity_id: column.text,
  title: column.text,
  content: column.text,
  folder_path: column.text,
  tags: column.text, // JSON array
  status: column.text,
  current_version: column.integer,
  last_versioned_at: column.text,
  last_edited_at: column.text,
  edit_session_id: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const document_versions = new Table({
  identity_id: column.text,
  document_id: column.text, // FK
  version_number: column.integer,
  title: column.text,
  content: column.text,
  change_type: column.text,
  change_description: column.text,
  changed_by: column.text,
  restored_from: column.text,
  metadata: column.text, // JSON
  version: column.integer,
  created_at: column.text,
});

const document_links = new Table({
  identity_id: column.text,
  source_document_id: column.text, // FK
  target_document_id: column.text, // FK
  link_text: column.text,
  link_position: column.integer,
  is_broken: column.integer, // boolean
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

// ──────────────────────────────────────────────
// AI
// ──────────────────────────────────────────────

const ai_conversations = new Table({
  identity_id: column.text,
  name: column.text,
  status: column.text,
  message_count: column.integer,
  last_message_at: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const ai_messages = new Table({
  identity_id: column.text,
  conversation_id: column.text, // FK
  role: column.text,
  content: column.text,
  token_usage: column.text, // JSON
  created_at: column.text,
});

const ai_generation_tasks = new Table({
  identity_id: column.text,
  task_type: column.text,
  status: column.text,
  input: column.text, // JSON
  result: column.text, // JSON
  error: column.text,
  retry_count: column.integer,
  token_usage: column.text, // JSON
  processing_ms: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  completed_at: column.text,
  deleted_at: column.text,
});

const ai_usage_quotas = new Table({
  identity_id: column.text,
  quota_limit: column.integer,
  current_usage: column.integer,
  reset_period: column.text,
  last_reset_at: column.text,
  next_reset_at: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const ai_provider_configs = new Table({
  identity_id: column.text,
  name: column.text,
  provider_type: column.text,
  base_url: column.text,
  api_key_encrypted: column.text,
  default_model: column.text,
  available_models: column.text, // JSON
  is_active: column.integer, // boolean
  is_default: column.integer, // boolean
  priority: column.integer,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const dashboard_configs = new Table({
  identity_id: column.text,
  widget_config: column.text, // JSON
  created_at: column.text,
  updated_at: column.text,
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

const repositories = new Table({
  identity_id: column.text,
  name: column.text,
  type: column.text,
  path: column.text,
  description: column.text,
  config: column.text, // JSON
  stats: column.text, // JSON
  related_goals: column.text,
  status: column.text,
  git: column.text,
  sync_status: column.text,
  last_accessed_at: column.text,
  version: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const repository_explorers = new Table({
  repository_id: column.text, // FK
  identity_id: column.text,
  name: column.text,
  description: column.text,
  current_path: column.text,
  filters: column.text, // JSON
  view_config: column.text, // JSON
  pinned_paths: column.text, // JSON
  recent_paths: column.text, // JSON
  last_scan_at: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const repository_statistics = new Table({
  identity_id: column.text,
  total_repositories: column.integer,
  active_repositories: column.integer,
  archived_repositories: column.integer,
  total_resources: column.integer,
  total_files: column.integer,
  total_folders: column.integer,
  git_enabled_repos: column.integer,
  total_commits: column.integer,
  total_references: column.integer,
  total_linked_contents: column.integer,
  total_size_bytes: column.integer, // BigInt → integer
  last_updated_at: column.text,
  created_at: column.text,
});

const folders = new Table({
  identity_id: column.text,
  repository_id: column.text, // FK
  parent_id: column.text, // FK (self)
  name: column.text,
  path: column.text,
  order: column.integer,
  is_expanded: column.integer, // boolean
  metadata: column.text, // JSON
  created_at: column.text,
  updated_at: column.text,
});

const resources = new Table({
  identity_id: column.text,
  repository_id: column.text, // FK
  folder_id: column.text, // FK
  name: column.text,
  type: column.text,
  path: column.text,
  size: column.integer,
  content: column.text,
  metadata: column.text, // JSON
  stats: column.text, // JSON
  description: column.text,
  author: column.text,
  version: column.integer,
  tags: column.text, // JSON
  category: column.text,
  status: column.text,
  created_at: column.text,
  updated_at: column.text,
  modified_at: column.text,
  deleted_at: column.text,
});

const repository_resources = new Table({
  identity_id: column.text,
  repository_id: column.text, // FK
  name: column.text,
  type: column.text,
  path: column.text,
  size: column.integer,
  description: column.text,
  author: column.text,
  version: column.text,
  tags: column.text, // JSON
  category: column.text,
  status: column.text,
  metadata: column.text, // JSON
  created_at: column.text,
  updated_at: column.text,
  modified_at: column.text,
});

// ──────────────────────────────────────────────
// Governance
// ──────────────────────────────────────────────

const rules = new Table({
  code: column.text,
  title: column.text,
  description: column.text,
  severity: column.text,
  status: column.text,
  deprecation_reason: column.text,
  replacement_rule_id: column.text,
  live_reference_location: column.text,
  tags: column.text, // JSON
  good_examples: column.text, // JSON
  bad_examples: column.text, // JSON
  author_id: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const rule_revisions = new Table({
  rule_id: column.text, // FK
  revision_number: column.integer,
  author_id: column.text,
  changed_fields: column.text, // JSON
  previous_values: column.text, // JSON
  new_values: column.text, // JSON
  change_type: column.text,
  created_at: column.text,
});

// ──────────────────────────────────────────────
// Schema Export
// ──────────────────────────────────────────────

export const PowerSyncAppSchema = new Schema({
  // Authentication
  auth_identities,
  auth_identifiers,
  auth_oauth_bindings,
  auth_credentials,
  auth_sessions,
  // Account
  accounts,
  user_settings,
  // Goal
  goals,
  goal_folders,
  key_results,
  goal_records,
  goal_reviews,
  key_result_weight_snapshots,
  focus_sessions,
  focus_modes,
  goal_statistics,
  // Task
  task_folders,
  task_templates,
  task_instances,
  task_dependencies,
  task_template_history,
  task_statistics,
  // Schedule
  schedules,
  schedule_jobs,
  schedule_tasks,
  schedule_executions,
  schedule_statistics,
  // Reminder
  reminder_templates,
  reminder_groups,
  reminder_instances,
  reminder_history,
  reminder_statistics,
  reminder_responses,
  user_reminder_preferences,
  // Notification
  notifications,
  notification_channels,
  notification_history,
  notification_preferences,
  notification_templates,
  // Editor
  editor_workspaces,
  editor_workspace_sessions,
  editor_workspace_session_groups,
  editor_workspace_session_group_tabs,
  // Document
  documents,
  document_versions,
  document_links,
  // AI
  ai_conversations,
  ai_messages,
  ai_generation_tasks,
  ai_usage_quotas,
  ai_provider_configs,
  dashboard_configs,
  // Repository
  repositories,
  repository_explorers,
  repository_statistics,
  folders,
  resources,
  repository_resources,
  // Governance
  rules,
  rule_revisions,
});

export type PowerSyncDatabase = InstanceType<typeof Schema>;
