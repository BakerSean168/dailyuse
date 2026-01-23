-- CreateTable
CREATE TABLE "accounts" (
    "uuid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "profile" TEXT NOT NULL,
    "preferences" TEXT NOT NULL,
    "subscription" TEXT,
    "storage" TEXT NOT NULL,
    "security" TEXT NOT NULL,
    "history" TEXT NOT NULL DEFAULT '[]',
    "stats" TEXT NOT NULL,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_configs" (
    "uuid" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "description" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "auth_credentials" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "history" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "access_token" TEXT NOT NULL,
    "access_token_expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "refresh_token_expires_at" TIMESTAMP(3) NOT NULL,
    "device" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "history" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_accessed_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "documents" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "folder_path" TEXT NOT NULL,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_version" INTEGER NOT NULL DEFAULT 0,
    "last_versioned_at" INTEGER,
    "last_edited_at" INTEGER,
    "edit_session_id" TEXT,
    "created_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,
    "updated_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,
    "deleted_at" INTEGER,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "uuid" TEXT NOT NULL,
    "document_uuid" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "change_description" TEXT,
    "changed_by" TEXT NOT NULL,
    "restored_from" TEXT,
    "metadata" JSONB,
    "created_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "document_links" (
    "uuid" TEXT NOT NULL,
    "source_document_uuid" TEXT NOT NULL,
    "target_document_uuid" TEXT,
    "link_text" TEXT NOT NULL,
    "link_position" INTEGER NOT NULL,
    "is_broken" BOOLEAN NOT NULL DEFAULT false,
    "created_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,
    "updated_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,

    CONSTRAINT "document_links_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "editor_workspace_session_group_tabs" (
    "uuid" TEXT NOT NULL,
    "group_uuid" TEXT NOT NULL,
    "session_uuid" TEXT NOT NULL,
    "workspace_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "document_uuid" TEXT,
    "tab_index" INTEGER NOT NULL,
    "tab_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "view_state" JSONB NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_workspace_session_group_tabs_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "editor_workspace_session_groups" (
    "uuid" TEXT NOT NULL,
    "session_uuid" TEXT NOT NULL,
    "workspace_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "group_index" INTEGER NOT NULL,
    "name" TEXT,
    "split_direction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_workspace_session_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "editor_workspace_sessions" (
    "uuid" TEXT NOT NULL,
    "workspace_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_workspace_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "editor_workspaces" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_path" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "setting" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editor_workspaces_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "focus_sessions" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "goal_uuid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "duration_minutes" INTEGER NOT NULL,
    "actual_duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "started_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "resumed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "pause_count" INTEGER NOT NULL DEFAULT 0,
    "paused_duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "focus_modes" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "focused_goal_uuids" TEXT[],
    "start_time" BIGINT NOT NULL,
    "end_time" BIGINT NOT NULL,
    "hidden_goals_mode" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "actual_end_time" BIGINT,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "focus_modes_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "goal_folders" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "completed_goal_count" INTEGER NOT NULL DEFAULT 0,
    "folder_type" TEXT,
    "goal_count" INTEGER NOT NULL DEFAULT 0,
    "is_system_folder" BOOLEAN NOT NULL DEFAULT false,
    "parent_folder_uuid" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "goal_folders_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "goal_records" (
    "uuid" TEXT NOT NULL,
    "key_result_uuid" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_records_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "goal_reviews" (
    "uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "review_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "achievements" TEXT,
    "challenges" TEXT,
    "lessons_learned" TEXT,
    "next_steps" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_reviews_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "goal_statistics" (
    "id" SERIAL NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "total_goals" INTEGER NOT NULL DEFAULT 0,
    "active_goals" INTEGER NOT NULL DEFAULT 0,
    "completed_goals" INTEGER NOT NULL DEFAULT 0,
    "archived_goals" INTEGER NOT NULL DEFAULT 0,
    "overdue_goals" INTEGER NOT NULL DEFAULT 0,
    "total_key_results" INTEGER NOT NULL DEFAULT 0,
    "completed_key_results" INTEGER NOT NULL DEFAULT 0,
    "average_progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "goals_by_importance" TEXT NOT NULL DEFAULT '{}',
    "goals_by_urgency" TEXT NOT NULL DEFAULT '{}',
    "goals_by_category" TEXT NOT NULL DEFAULT '{}',
    "goals_by_status" TEXT NOT NULL DEFAULT '{}',
    "goals_created_this_week" INTEGER NOT NULL DEFAULT 0,
    "goals_completed_this_week" INTEGER NOT NULL DEFAULT 0,
    "goals_created_this_month" INTEGER NOT NULL DEFAULT 0,
    "goals_completed_this_month" INTEGER NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION,
    "total_focus_sessions" INTEGER NOT NULL DEFAULT 0,
    "completed_focus_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_focus_minutes" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "importance" INTEGER NOT NULL DEFAULT 2,
    "urgency" INTEGER NOT NULL DEFAULT 2,
    "category" TEXT,
    "tags" TEXT,
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "folder_uuid" TEXT,
    "parent_goal_uuid" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "reminder_config" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "color" TEXT,
    "feasibility_analysis" TEXT,
    "motivation" TEXT,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "key_result_weight_snapshots" (
    "uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "key_result_uuid" TEXT NOT NULL,
    "old_weight" DOUBLE PRECISION NOT NULL,
    "new_weight" DOUBLE PRECISION NOT NULL,
    "weight_delta" DOUBLE PRECISION NOT NULL,
    "snapshot_time" BIGINT NOT NULL,
    "trigger" TEXT NOT NULL,
    "reason" TEXT,
    "operator_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_result_weight_snapshots_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "key_results" (
    "uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value_type" TEXT NOT NULL,
    "aggregation_method" TEXT NOT NULL,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "linked_contents" (
    "uuid" TEXT NOT NULL,
    "resource_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "author" TEXT,
    "published_at" TIMESTAMP(3),
    "is_accessible" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMP(3),
    "cached_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linked_contents_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "notification_channels" (
    "uuid" TEXT NOT NULL,
    "notification_uuid" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipient" TEXT,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "response" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "notification_history" (
    "uuid" TEXT NOT NULL,
    "notification_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "actor_uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "do_not_disturb" TEXT,
    "rate_limit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title_template" TEXT NOT NULL,
    "content_template" TEXT NOT NULL,
    "variables" TEXT,
    "default_actions" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "notifications" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "related_entity_type" TEXT,
    "related_entity_uuid" TEXT,
    "metadata" TEXT,
    "actions" TEXT,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "reminder_groups" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "control_mode" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stats" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reminder_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "reminder_history" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "error" TEXT,
    "notification_sent" BOOLEAN NOT NULL,
    "notificationChannel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_history_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "reminder_instances" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "trigger_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "processed_at" TIMESTAMP(3),
    "note" TEXT,
    "payload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_instances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "reminder_statistics" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "template_stats" TEXT NOT NULL,
    "group_stats" TEXT NOT NULL,
    "trigger_stats" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_statistics_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "reminder_templates" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "self_enabled" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "group_uuid" TEXT,
    "importance_level" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "next_trigger_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "trigger" TEXT NOT NULL,
    "recurrence" TEXT,
    "active_time" TEXT NOT NULL,
    "active_hours" TEXT,
    "notification_config" TEXT NOT NULL,
    "stats" TEXT NOT NULL,
    "click_rate" DOUBLE PRECISION,
    "ignore_rate" DOUBLE PRECISION,
    "avg_response_time" INTEGER,
    "snooze_count" INTEGER NOT NULL DEFAULT 0,
    "effectiveness_score" DOUBLE PRECISION,
    "sample_size" INTEGER NOT NULL DEFAULT 0,
    "last_analysis_time" BIGINT,
    "original_interval" INTEGER,
    "adjusted_interval" INTEGER,
    "adjustment_reason" TEXT,
    "adjustment_time" BIGINT,
    "is_auto_adjusted" BOOLEAN NOT NULL DEFAULT false,
    "user_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "smart_frequency_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "reminder_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "reminder_responses" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "response_time" INTEGER,
    "timestamp" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_responses_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "repositories" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "stats" JSONB NOT NULL DEFAULT '{}',
    "related_goals" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "git" TEXT,
    "sync_status" TEXT,
    "last_accessed_at" TIMESTAMP(3),
    "created_at" BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
    "updated_at" BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "folders" (
    "uuid" TEXT NOT NULL,
    "repository_uuid" TEXT NOT NULL,
    "parent_uuid" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_expanded" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
    "updated_at" BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "resources" (
    "uuid" TEXT NOT NULL,
    "repository_uuid" TEXT NOT NULL,
    "folder_uuid" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "stats" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "author" TEXT,
    "version" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
    "updated_at" BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
    "modified_at" BIGINT,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "repository_explorers" (
    "uuid" TEXT NOT NULL,
    "repository_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "current_path" TEXT NOT NULL,
    "filters" TEXT,
    "view_config" TEXT,
    "pinned_paths" TEXT,
    "recent_paths" TEXT,
    "last_scan_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_explorers_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "repository_resources" (
    "uuid" TEXT NOT NULL,
    "repository_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER,
    "description" TEXT,
    "author" TEXT,
    "version" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "modified_at" TIMESTAMP(3),

    CONSTRAINT "repository_resources_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "repository_statistics" (
    "id" SERIAL NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "total_repositories" INTEGER NOT NULL DEFAULT 0,
    "active_repositories" INTEGER NOT NULL DEFAULT 0,
    "archived_repositories" INTEGER NOT NULL DEFAULT 0,
    "total_resources" INTEGER NOT NULL DEFAULT 0,
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "total_folders" INTEGER NOT NULL DEFAULT 0,
    "git_enabled_repos" INTEGER NOT NULL DEFAULT 0,
    "total_commits" INTEGER NOT NULL DEFAULT 0,
    "total_references" INTEGER NOT NULL DEFAULT 0,
    "total_linked_contents" INTEGER NOT NULL DEFAULT 0,
    "total_size_bytes" BIGINT NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_references" (
    "uuid" TEXT NOT NULL,
    "source_resource_uuid" TEXT NOT NULL,
    "target_resource_uuid" TEXT NOT NULL,
    "reference_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_verified_at" TIMESTAMP(3),

    CONSTRAINT "resource_references_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "schedule_executions" (
    "uuid" TEXT NOT NULL,
    "task_uuid" TEXT NOT NULL,
    "execution_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "result" TEXT,
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_executions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "schedule_statistics" (
    "id" SERIAL NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "total_tasks" INTEGER NOT NULL,
    "active_tasks" INTEGER NOT NULL,
    "paused_tasks" INTEGER NOT NULL,
    "completed_tasks" INTEGER NOT NULL,
    "cancelled_tasks" INTEGER NOT NULL,
    "failed_tasks" INTEGER NOT NULL,
    "total_executions" INTEGER NOT NULL,
    "successful_executions" INTEGER NOT NULL,
    "failed_executions" INTEGER NOT NULL,
    "skipped_executions" INTEGER NOT NULL,
    "timeout_executions" INTEGER NOT NULL,
    "avg_execution_duration" DOUBLE PRECISION NOT NULL,
    "min_execution_duration" DOUBLE PRECISION NOT NULL,
    "max_execution_duration" DOUBLE PRECISION NOT NULL,
    "module_statistics" TEXT NOT NULL DEFAULT '{}',
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_tasks" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_module" TEXT NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "cron_expression" TEXT,
    "timezone" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "max_executions" INTEGER,
    "next_run_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "last_execution_status" TEXT,
    "last_execution_duration" INTEGER,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL,
    "initial_delay_ms" INTEGER NOT NULL,
    "max_delay_ms" INTEGER NOT NULL,
    "backoff_multiplier" DOUBLE PRECISION NOT NULL,
    "retryable_statuses" TEXT NOT NULL DEFAULT '[]',
    "payload" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "priority" TEXT NOT NULL,
    "timeout" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "schedules" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" BIGINT NOT NULL,
    "end_time" BIGINT NOT NULL,
    "duration" INTEGER NOT NULL,
    "has_conflict" BOOLEAN NOT NULL DEFAULT false,
    "conflicting_schedules" TEXT,
    "priority" INTEGER,
    "location" TEXT,
    "attendees" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "setting_groups" (
    "uuid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_uuid" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "is_collapsed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "setting_items" (
    "uuid" TEXT NOT NULL,
    "group_uuid" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "custom_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "settings" (
    "uuid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value_type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "default_value" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "account_uuid" TEXT,
    "device_id" TEXT,
    "group_uuid" TEXT,
    "validation" TEXT,
    "ui" TEXT,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "is_read_only" BOOLEAN NOT NULL DEFAULT false,
    "is_system_setting" BOOLEAN NOT NULL DEFAULT false,
    "sync_config" TEXT,
    "history_data" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "uuid" TEXT NOT NULL,
    "predecessor_task_uuid" TEXT NOT NULL,
    "successor_task_uuid" TEXT NOT NULL,
    "dependency_type" TEXT NOT NULL DEFAULT 'FINISH_TO_START',
    "lag_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "task_instances" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "instance_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "time_config" TEXT NOT NULL,
    "completion_record" TEXT,
    "skip_record" TEXT,

    CONSTRAINT "task_instances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "task_statistics" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "template_total" INTEGER NOT NULL,
    "template_active" INTEGER NOT NULL,
    "template_paused" INTEGER NOT NULL,
    "template_archived" INTEGER NOT NULL,
    "template_one_time" INTEGER NOT NULL,
    "template_recurring" INTEGER NOT NULL,
    "instance_total" INTEGER NOT NULL,
    "instance_today" INTEGER NOT NULL,
    "instance_week" INTEGER NOT NULL,
    "instance_month" INTEGER NOT NULL,
    "instance_pending" INTEGER NOT NULL,
    "instance_in_progress" INTEGER NOT NULL,
    "instance_completed" INTEGER NOT NULL,
    "instance_skipped" INTEGER NOT NULL,
    "instance_expired" INTEGER NOT NULL,
    "completion_today" INTEGER NOT NULL,
    "completion_week" INTEGER NOT NULL,
    "completion_month" INTEGER NOT NULL,
    "completion_total" INTEGER NOT NULL,
    "completion_avg_time" DOUBLE PRECISION,
    "completion_rate" DOUBLE PRECISION NOT NULL,
    "time_all_day" INTEGER NOT NULL,
    "time_point" INTEGER NOT NULL,
    "time_range" INTEGER NOT NULL,
    "time_overdue" INTEGER NOT NULL,
    "time_upcoming" INTEGER NOT NULL,
    "distribution_by_importance" TEXT NOT NULL,
    "distribution_by_urgency" TEXT NOT NULL,
    "distribution_by_folder" TEXT NOT NULL,
    "distribution_by_tag" TEXT NOT NULL,

    CONSTRAINT "task_statistics_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "task_template_history" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_template_history_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "task_templates" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "importance" INTEGER NOT NULL,
    "color" TEXT,
    "tags" TEXT NOT NULL,
    "folder_uuid" TEXT,
    "goal_uuid" TEXT,
    "key_result_uuid" TEXT,
    "parent_task_uuid" TEXT,
    "start_date" BIGINT,
    "due_date" BIGINT,
    "completed_at" BIGINT,
    "estimated_minutes" INTEGER,
    "actual_minutes" INTEGER,
    "note" TEXT,
    "last_generated_date" TIMESTAMP(3),
    "generate_ahead_days" INTEGER,
    "time_config_type" TEXT,
    "time_config_start_time" TIMESTAMP(3),
    "time_config_end_time" TIMESTAMP(3),
    "time_config_duration_minutes" INTEGER,
    "recurrence_rule_type" TEXT,
    "recurrence_rule_interval" INTEGER,
    "recurrence_rule_days_of_week" TEXT,
    "recurrence_rule_day_of_month" INTEGER,
    "recurrence_rule_month_of_year" INTEGER,
    "recurrence_rule_end_date" TIMESTAMP(3),
    "recurrence_rule_count" INTEGER,
    "reminder_config_enabled" BOOLEAN,
    "reminder_config_time_offset_minutes" INTEGER,
    "reminder_config_unit" TEXT,
    "reminder_config_channel" TEXT,
    "goal_binding_goal_uuid" TEXT,
    "goal_binding_key_result_uuid" TEXT,
    "goal_binding_increment_value" DOUBLE PRECISION,
    "blocking_reason" TEXT,
    "dependency_status" TEXT NOT NULL DEFAULT 'NONE',
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "appearance_accent_color" TEXT NOT NULL DEFAULT '#3B82F6',
    "appearance_compact_mode" BOOLEAN NOT NULL DEFAULT false,
    "appearance_font_family" TEXT,
    "appearance_font_size" TEXT NOT NULL DEFAULT 'MEDIUM',
    "appearance_theme" TEXT NOT NULL DEFAULT 'AUTO',
    "experimental_enabled" BOOLEAN NOT NULL DEFAULT false,
    "experimental_features" TEXT NOT NULL DEFAULT '[]',
    "locale_currency" TEXT NOT NULL DEFAULT 'CNY',
    "locale_date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "locale_language" TEXT NOT NULL DEFAULT 'zh-CN',
    "locale_time_format" TEXT NOT NULL DEFAULT '24H',
    "locale_timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "locale_week_starts_on" INTEGER NOT NULL DEFAULT 1,
    "privacy_allow_search_by_email" BOOLEAN NOT NULL DEFAULT true,
    "privacy_allow_search_by_phone" BOOLEAN NOT NULL DEFAULT false,
    "privacy_profile_visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "privacy_share_usage_data" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_online_status" BOOLEAN NOT NULL DEFAULT true,
    "shortcuts_custom" TEXT NOT NULL DEFAULT '{}',
    "shortcuts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "workflow_auto_save" BOOLEAN NOT NULL DEFAULT true,
    "workflow_auto_save_interval" INTEGER NOT NULL DEFAULT 30000,
    "workflow_confirm_before_delete" BOOLEAN NOT NULL DEFAULT true,
    "workflow_default_goal_view" TEXT NOT NULL DEFAULT 'LIST',
    "workflow_default_schedule_view" TEXT NOT NULL DEFAULT 'WEEK',
    "workflow_default_task_view" TEXT NOT NULL DEFAULT 'LIST',
    "notification_email" BOOLEAN NOT NULL DEFAULT true,
    "notification_push" BOOLEAN NOT NULL DEFAULT true,
    "notification_in_app" BOOLEAN NOT NULL DEFAULT true,
    "notification_sound" BOOLEAN NOT NULL DEFAULT true,
    "editor_theme" TEXT NOT NULL DEFAULT 'default',
    "editor_font_size" INTEGER NOT NULL DEFAULT 14,
    "editor_tab_size" INTEGER NOT NULL DEFAULT 2,
    "editor_word_wrap" BOOLEAN NOT NULL DEFAULT true,
    "editor_line_numbers" BOOLEAN NOT NULL DEFAULT true,
    "editor_minimap" BOOLEAN NOT NULL DEFAULT true,
    "start_page" TEXT NOT NULL DEFAULT 'dashboard',
    "sidebar_collapsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "uuid" TEXT NOT NULL,
    "conversation_uuid" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "token_usage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ai_generation_tasks" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "token_usage" TEXT,
    "processing_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_generation_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ai_usage_quotas" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "quota_limit" INTEGER NOT NULL DEFAULT 50,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "reset_period" TEXT NOT NULL DEFAULT 'DAILY',
    "last_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_reset_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_usage_quotas_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ai_provider_configs" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "default_model" TEXT,
    "available_models" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "knowledge_generation_tasks" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "document_count" INTEGER NOT NULL DEFAULT 5,
    "target_audience" TEXT,
    "folder_path" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "generated_document_uuids" TEXT[],
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_generation_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "dashboard_configs" (
    "id" SERIAL NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "widget_config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_profiles" (
    "uuid" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "provider_type" VARCHAR(30) NOT NULL,
    "provider_config_json" TEXT NOT NULL,
    "sync_config_json" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_connected" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" BIGINT,
    "last_sync_version_json" TEXT,
    "last_sync_result" VARCHAR(20),
    "history_stats_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "sync_profiles_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "sync_sessions" (
    "uuid" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "direction" VARCHAR(20) NOT NULL,
    "strategy" VARCHAR(20) NOT NULL,
    "trigger_type" VARCHAR(30) NOT NULL,
    "trigger_device_json" TEXT NOT NULL,
    "start_version_json" TEXT NOT NULL,
    "end_version_json" TEXT,
    "local_snapshot_id" UUID,
    "remote_snapshot_id" UUID,
    "statistics_json" TEXT,
    "error_json" TEXT,
    "can_retry" BOOLEAN NOT NULL DEFAULT true,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" BIGINT NOT NULL,
    "started_at" BIGINT,
    "completed_at" BIGINT,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "sync_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "uuid" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "session_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "entity_name" VARCHAR(200),
    "conflict_type" VARCHAR(20) NOT NULL,
    "local_version_json" TEXT NOT NULL,
    "local_data_json" TEXT NOT NULL,
    "remote_version_json" TEXT NOT NULL,
    "remote_data_json" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "auto_resolvable" BOOLEAN NOT NULL DEFAULT false,
    "resolution_json" TEXT,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "pending_changes" (
    "uuid" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "entity_name" VARCHAR(200),
    "operation" VARCHAR(20) NOT NULL,
    "before_data_json" TEXT,
    "after_data_json" TEXT,
    "version_json" TEXT NOT NULL,
    "is_synced" BOOLEAN NOT NULL DEFAULT false,
    "synced_in_session" UUID,
    "created_at" BIGINT NOT NULL,
    "synced_at" BIGINT,

    CONSTRAINT "pending_changes_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_created_at_idx" ON "accounts"("created_at");

-- CreateIndex
CREATE INDEX "accounts_email_idx" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_last_active_at_idx" ON "accounts"("last_active_at");

-- CreateIndex
CREATE INDEX "accounts_status_idx" ON "accounts"("status");

-- CreateIndex
CREATE INDEX "accounts_username_idx" ON "accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "app_configs_version_key" ON "app_configs"("version");

-- CreateIndex
CREATE INDEX "app_configs_version_idx" ON "app_configs"("version");

-- CreateIndex
CREATE INDEX "auth_credentials_account_uuid_idx" ON "auth_credentials"("account_uuid");

-- CreateIndex
CREATE INDEX "auth_credentials_expires_at_idx" ON "auth_credentials"("expires_at");

-- CreateIndex
CREATE INDEX "auth_credentials_type_idx" ON "auth_credentials"("type");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_access_token_key" ON "auth_sessions"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refresh_token_key" ON "auth_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "auth_sessions_access_token_expires_at_idx" ON "auth_sessions"("access_token_expires_at");

-- CreateIndex
CREATE INDEX "auth_sessions_access_token_idx" ON "auth_sessions"("access_token");

-- CreateIndex
CREATE INDEX "auth_sessions_account_uuid_idx" ON "auth_sessions"("account_uuid");

-- CreateIndex
CREATE INDEX "auth_sessions_last_accessed_at_idx" ON "auth_sessions"("last_accessed_at");

-- CreateIndex
CREATE INDEX "auth_sessions_refresh_token_idx" ON "auth_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "auth_sessions_status_idx" ON "auth_sessions"("status");

-- CreateIndex
CREATE INDEX "documents_account_uuid_deleted_at_idx" ON "documents"("account_uuid", "deleted_at");

-- CreateIndex
CREATE INDEX "documents_account_uuid_folder_path_idx" ON "documents"("account_uuid", "folder_path");

-- CreateIndex
CREATE INDEX "documents_account_uuid_status_idx" ON "documents"("account_uuid", "status");

-- CreateIndex
CREATE INDEX "document_versions_document_uuid_version_number_idx" ON "document_versions"("document_uuid", "version_number");

-- CreateIndex
CREATE INDEX "document_versions_document_uuid_created_at_idx" ON "document_versions"("document_uuid", "created_at");

-- CreateIndex
CREATE INDEX "document_versions_changed_by_idx" ON "document_versions"("changed_by");

-- CreateIndex
CREATE INDEX "document_links_source_document_uuid_idx" ON "document_links"("source_document_uuid");

-- CreateIndex
CREATE INDEX "document_links_target_document_uuid_idx" ON "document_links"("target_document_uuid");

-- CreateIndex
CREATE INDEX "document_links_is_broken_idx" ON "document_links"("is_broken");

-- CreateIndex
CREATE INDEX "editor_workspace_session_group_tabs_workspace_uuid_idx" ON "editor_workspace_session_group_tabs"("workspace_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_groups_workspace_uuid_idx" ON "editor_workspace_session_groups"("workspace_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_sessions_workspace_uuid_idx" ON "editor_workspace_sessions"("workspace_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "editor_workspaces_project_path_key" ON "editor_workspaces"("project_path");

-- CreateIndex
CREATE INDEX "editor_workspaces_is_active_idx" ON "editor_workspaces"("is_active");

-- CreateIndex
CREATE INDEX "focus_sessions_status_idx" ON "focus_sessions"("status");

-- CreateIndex
CREATE INDEX "focus_modes_account_uuid_idx" ON "focus_modes"("account_uuid");

-- CreateIndex
CREATE INDEX "focus_modes_is_active_idx" ON "focus_modes"("is_active");

-- CreateIndex
CREATE INDEX "focus_modes_end_time_idx" ON "focus_modes"("end_time");

-- CreateIndex
CREATE INDEX "goal_folders_parent_folder_uuid_idx" ON "goal_folders"("parent_folder_uuid");

-- CreateIndex
CREATE INDEX "goal_records_recorded_at_idx" ON "goal_records"("recorded_at");

-- CreateIndex
CREATE INDEX "goal_reviews_goal_uuid_idx" ON "goal_reviews"("goal_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "goal_statistics_account_uuid_key" ON "goal_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_statistics_account_uuid_idx" ON "goal_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "goals_target_date_idx" ON "goals"("target_date");

-- CreateIndex
CREATE INDEX "key_result_weight_snapshots_snapshot_time_idx" ON "key_result_weight_snapshots"("snapshot_time");

-- CreateIndex
CREATE INDEX "key_results_goal_uuid_idx" ON "key_results"("goal_uuid");

-- CreateIndex
CREATE INDEX "linked_contents_url_idx" ON "linked_contents"("url");

-- CreateIndex
CREATE INDEX "notification_channels_notification_uuid_idx" ON "notification_channels"("notification_uuid");

-- CreateIndex
CREATE INDEX "notification_history_notification_uuid_idx" ON "notification_history"("notification_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_account_uuid_key" ON "notification_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "notification_preferences_account_uuid_idx" ON "notification_preferences"("account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_name_idx" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "reminder_groups_account_uuid_idx" ON "reminder_groups"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_history_template_uuid_idx" ON "reminder_history"("template_uuid");

-- CreateIndex
CREATE INDEX "reminder_instances_trigger_at_idx" ON "reminder_instances"("trigger_at");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_statistics_account_uuid_key" ON "reminder_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_statistics_account_uuid_idx" ON "reminder_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_templates_status_idx" ON "reminder_templates"("status");

-- CreateIndex
CREATE INDEX "reminder_responses_template_uuid_timestamp_idx" ON "reminder_responses"("template_uuid", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "repositories_type_idx" ON "repositories"("type");

-- CreateIndex
CREATE INDEX "repositories_status_idx" ON "repositories"("status");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_account_uuid_path_key" ON "repositories"("account_uuid", "path");

-- CreateIndex
CREATE INDEX "folders_repository_uuid_idx" ON "folders"("repository_uuid");

-- CreateIndex
CREATE INDEX "folders_parent_uuid_idx" ON "folders"("parent_uuid");

-- CreateIndex
CREATE INDEX "folders_path_idx" ON "folders"("path");

-- CreateIndex
CREATE UNIQUE INDEX "folders_repository_uuid_parent_uuid_name_key" ON "folders"("repository_uuid", "parent_uuid", "name");

-- CreateIndex
CREATE INDEX "resources_repository_uuid_idx" ON "resources"("repository_uuid");

-- CreateIndex
CREATE INDEX "resources_folder_uuid_idx" ON "resources"("folder_uuid");

-- CreateIndex
CREATE INDEX "resources_type_idx" ON "resources"("type");

-- CreateIndex
CREATE INDEX "resources_status_idx" ON "resources"("status");

-- CreateIndex
CREATE INDEX "resources_category_idx" ON "resources"("category");

-- CreateIndex
CREATE INDEX "resources_created_at_idx" ON "resources"("created_at");

-- CreateIndex
CREATE INDEX "repository_explorers_repository_uuid_idx" ON "repository_explorers"("repository_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "repository_explorers_repository_uuid_account_uuid_key" ON "repository_explorers"("repository_uuid", "account_uuid");

-- CreateIndex
CREATE INDEX "repository_resources_type_idx" ON "repository_resources"("type");

-- CreateIndex
CREATE UNIQUE INDEX "repository_resources_repository_uuid_path_key" ON "repository_resources"("repository_uuid", "path");

-- CreateIndex
CREATE UNIQUE INDEX "repository_statistics_account_uuid_key" ON "repository_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "repository_statistics_account_uuid_idx" ON "repository_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "resource_references_target_resource_uuid_idx" ON "resource_references"("target_resource_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "resource_references_source_resource_uuid_target_resource_uu_key" ON "resource_references"("source_resource_uuid", "target_resource_uuid", "reference_type");

-- CreateIndex
CREATE INDEX "schedule_executions_task_uuid_idx" ON "schedule_executions"("task_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_statistics_account_uuid_key" ON "schedule_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_statistics_account_uuid_idx" ON "schedule_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_tasks_status_idx" ON "schedule_tasks"("status");

-- CreateIndex
CREATE INDEX "schedules_start_time_end_time_idx" ON "schedules"("start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "setting_groups_key_key" ON "setting_groups"("key");

-- CreateIndex
CREATE INDEX "setting_groups_parent_uuid_idx" ON "setting_groups"("parent_uuid");

-- CreateIndex
CREATE INDEX "setting_items_setting_key_idx" ON "setting_items"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "setting_items_group_uuid_setting_key_key" ON "setting_items"("group_uuid", "setting_key");

-- CreateIndex
CREATE INDEX "settings_scope_idx" ON "settings"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_scope_account_uuid_device_id_key" ON "settings"("key", "scope", "account_uuid", "device_id");

-- CreateIndex
CREATE INDEX "task_dependencies_successor_task_uuid_idx" ON "task_dependencies"("successor_task_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_predecessor_task_uuid_successor_task_uuid_key" ON "task_dependencies"("predecessor_task_uuid", "successor_task_uuid");

-- CreateIndex
CREATE INDEX "task_instances_template_uuid_instance_date_idx" ON "task_instances"("template_uuid", "instance_date");

-- CreateIndex
CREATE UNIQUE INDEX "task_statistics_account_uuid_key" ON "task_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "task_statistics_account_uuid_idx" ON "task_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "task_template_history_template_uuid_idx" ON "task_template_history"("template_uuid");

-- CreateIndex
CREATE INDEX "task_templates_account_uuid_idx" ON "task_templates"("account_uuid");

-- CreateIndex
CREATE INDEX "task_templates_task_type_idx" ON "task_templates"("task_type");

-- CreateIndex
CREATE INDEX "task_templates_status_idx" ON "task_templates"("status");

-- CreateIndex
CREATE INDEX "task_templates_importance_idx" ON "task_templates"("importance");

-- CreateIndex
CREATE INDEX "task_templates_goal_uuid_idx" ON "task_templates"("goal_uuid");

-- CreateIndex
CREATE INDEX "task_templates_key_result_uuid_idx" ON "task_templates"("key_result_uuid");

-- CreateIndex
CREATE INDEX "task_templates_parent_task_uuid_idx" ON "task_templates"("parent_task_uuid");

-- CreateIndex
CREATE INDEX "task_templates_due_date_idx" ON "task_templates"("due_date");

-- CreateIndex
CREATE INDEX "task_templates_deleted_at_idx" ON "task_templates"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_account_uuid_key" ON "user_settings"("account_uuid");

-- CreateIndex
CREATE INDEX "user_settings_account_uuid_idx" ON "user_settings"("account_uuid");

-- CreateIndex
CREATE INDEX "ai_conversations_account_uuid_idx" ON "ai_conversations"("account_uuid");

-- CreateIndex
CREATE INDEX "ai_conversations_status_idx" ON "ai_conversations"("status");

-- CreateIndex
CREATE INDEX "ai_conversations_created_at_idx" ON "ai_conversations"("created_at");

-- CreateIndex
CREATE INDEX "ai_conversations_last_message_at_idx" ON "ai_conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_uuid_idx" ON "ai_messages"("conversation_uuid");

-- CreateIndex
CREATE INDEX "ai_messages_created_at_idx" ON "ai_messages"("created_at");

-- CreateIndex
CREATE INDEX "ai_generation_tasks_account_uuid_idx" ON "ai_generation_tasks"("account_uuid");

-- CreateIndex
CREATE INDEX "ai_generation_tasks_task_type_idx" ON "ai_generation_tasks"("task_type");

-- CreateIndex
CREATE INDEX "ai_generation_tasks_status_idx" ON "ai_generation_tasks"("status");

-- CreateIndex
CREATE INDEX "ai_generation_tasks_created_at_idx" ON "ai_generation_tasks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_quotas_account_uuid_key" ON "ai_usage_quotas"("account_uuid");

-- CreateIndex
CREATE INDEX "ai_usage_quotas_account_uuid_idx" ON "ai_usage_quotas"("account_uuid");

-- CreateIndex
CREATE INDEX "ai_usage_quotas_next_reset_at_idx" ON "ai_usage_quotas"("next_reset_at");

-- CreateIndex
CREATE INDEX "ai_provider_configs_account_uuid_idx" ON "ai_provider_configs"("account_uuid");

-- CreateIndex
CREATE INDEX "ai_provider_configs_is_default_idx" ON "ai_provider_configs"("is_default");

-- CreateIndex
CREATE INDEX "ai_provider_configs_is_active_idx" ON "ai_provider_configs"("is_active");

-- CreateIndex
CREATE INDEX "ai_provider_configs_priority_idx" ON "ai_provider_configs"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_configs_account_uuid_name_key" ON "ai_provider_configs"("account_uuid", "name");

-- CreateIndex
CREATE INDEX "knowledge_generation_tasks_account_uuid_idx" ON "knowledge_generation_tasks"("account_uuid");

-- CreateIndex
CREATE INDEX "knowledge_generation_tasks_status_idx" ON "knowledge_generation_tasks"("status");

-- CreateIndex
CREATE INDEX "knowledge_generation_tasks_created_at_idx" ON "knowledge_generation_tasks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_configs_account_uuid_key" ON "dashboard_configs"("account_uuid");

-- CreateIndex
CREATE INDEX "dashboard_configs_account_uuid_idx" ON "dashboard_configs"("account_uuid");

-- CreateIndex
CREATE INDEX "sync_profiles_account_uuid_idx" ON "sync_profiles"("account_uuid");

-- CreateIndex
CREATE INDEX "sync_profiles_account_uuid_is_active_idx" ON "sync_profiles"("account_uuid", "is_active");

-- CreateIndex
CREATE INDEX "sync_profiles_account_uuid_is_default_idx" ON "sync_profiles"("account_uuid", "is_default");

-- CreateIndex
CREATE INDEX "sync_sessions_account_uuid_idx" ON "sync_sessions"("account_uuid");

-- CreateIndex
CREATE INDEX "sync_sessions_profile_id_idx" ON "sync_sessions"("profile_id");

-- CreateIndex
CREATE INDEX "sync_sessions_status_idx" ON "sync_sessions"("status");

-- CreateIndex
CREATE INDEX "sync_sessions_created_at_idx" ON "sync_sessions"("created_at");

-- CreateIndex
CREATE INDEX "sync_conflicts_account_uuid_idx" ON "sync_conflicts"("account_uuid");

-- CreateIndex
CREATE INDEX "sync_conflicts_session_id_idx" ON "sync_conflicts"("session_id");

-- CreateIndex
CREATE INDEX "sync_conflicts_status_idx" ON "sync_conflicts"("status");

-- CreateIndex
CREATE INDEX "sync_conflicts_entity_type_entity_uuid_idx" ON "sync_conflicts"("entity_type", "entity_uuid");

-- CreateIndex
CREATE INDEX "pending_changes_account_uuid_idx" ON "pending_changes"("account_uuid");

-- CreateIndex
CREATE INDEX "pending_changes_account_uuid_is_synced_idx" ON "pending_changes"("account_uuid", "is_synced");

-- CreateIndex
CREATE INDEX "pending_changes_entity_type_entity_uuid_idx" ON "pending_changes"("entity_type", "entity_uuid");

-- CreateIndex
CREATE INDEX "pending_changes_created_at_idx" ON "pending_changes"("created_at");

-- AddForeignKey
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_uuid_fkey" FOREIGN KEY ("document_uuid") REFERENCES "documents"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "accounts"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_source_document_uuid_fkey" FOREIGN KEY ("source_document_uuid") REFERENCES "documents"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_target_document_uuid_fkey" FOREIGN KEY ("target_document_uuid") REFERENCES "documents"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_workspace_session_group_tabs" ADD CONSTRAINT "editor_workspace_session_group_tabs_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_workspace_session_group_tabs" ADD CONSTRAINT "editor_workspace_session_group_tabs_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "editor_workspace_session_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_workspace_session_groups" ADD CONSTRAINT "editor_workspace_session_groups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_workspace_session_groups" ADD CONSTRAINT "editor_workspace_session_groups_session_uuid_fkey" FOREIGN KEY ("session_uuid") REFERENCES "editor_workspace_sessions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_workspace_sessions" ADD CONSTRAINT "editor_workspace_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_workspace_sessions" ADD CONSTRAINT "editor_workspace_sessions_workspace_uuid_fkey" FOREIGN KEY ("workspace_uuid") REFERENCES "editor_workspaces"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_workspaces" ADD CONSTRAINT "editor_workspaces_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_modes" ADD CONSTRAINT "focus_modes_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_folders" ADD CONSTRAINT "goal_folders_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_folders" ADD CONSTRAINT "goal_folders_parent_folder_uuid_fkey" FOREIGN KEY ("parent_folder_uuid") REFERENCES "goal_folders"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goal_records" ADD CONSTRAINT "goal_records_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "key_results"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_reviews" ADD CONSTRAINT "goal_reviews_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_statistics" ADD CONSTRAINT "goal_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_folder_uuid_fkey" FOREIGN KEY ("folder_uuid") REFERENCES "goal_folders"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_parent_goal_uuid_fkey" FOREIGN KEY ("parent_goal_uuid") REFERENCES "goals"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "key_result_weight_snapshots" ADD CONSTRAINT "key_result_weight_snapshots_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_result_weight_snapshots" ADD CONSTRAINT "key_result_weight_snapshots_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "key_results"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linked_contents" ADD CONSTRAINT "linked_contents_resource_uuid_fkey" FOREIGN KEY ("resource_uuid") REFERENCES "repository_resources"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_notification_uuid_fkey" FOREIGN KEY ("notification_uuid") REFERENCES "notifications"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_notification_uuid_fkey" FOREIGN KEY ("notification_uuid") REFERENCES "notifications"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_groups" ADD CONSTRAINT "reminder_groups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_history" ADD CONSTRAINT "reminder_history_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_instances" ADD CONSTRAINT "reminder_instances_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reminder_instances" ADD CONSTRAINT "reminder_instances_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_statistics" ADD CONSTRAINT "reminder_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_templates" ADD CONSTRAINT "reminder_templates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_templates" ADD CONSTRAINT "reminder_templates_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "reminder_groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_responses" ADD CONSTRAINT "reminder_responses_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_repository_uuid_fkey" FOREIGN KEY ("repository_uuid") REFERENCES "repositories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "folders"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_repository_uuid_fkey" FOREIGN KEY ("repository_uuid") REFERENCES "repositories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_explorers" ADD CONSTRAINT "repository_explorers_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_explorers" ADD CONSTRAINT "repository_explorers_repository_uuid_fkey" FOREIGN KEY ("repository_uuid") REFERENCES "repositories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_resources" ADD CONSTRAINT "repository_resources_repository_uuid_fkey" FOREIGN KEY ("repository_uuid") REFERENCES "repositories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_statistics" ADD CONSTRAINT "repository_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_source_resource_uuid_fkey" FOREIGN KEY ("source_resource_uuid") REFERENCES "repository_resources"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_target_resource_uuid_fkey" FOREIGN KEY ("target_resource_uuid") REFERENCES "repository_resources"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_executions" ADD CONSTRAINT "schedule_executions_task_uuid_fkey" FOREIGN KEY ("task_uuid") REFERENCES "schedule_tasks"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_statistics" ADD CONSTRAINT "schedule_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_tasks" ADD CONSTRAINT "schedule_tasks_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting_groups" ADD CONSTRAINT "setting_groups_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "setting_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting_items" ADD CONSTRAINT "setting_items_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "setting_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "setting_groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_predecessor_task_uuid_fkey" FOREIGN KEY ("predecessor_task_uuid") REFERENCES "task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_successor_task_uuid_fkey" FOREIGN KEY ("successor_task_uuid") REFERENCES "task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_statistics" ADD CONSTRAINT "task_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_history" ADD CONSTRAINT "task_template_history_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "key_results"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_parent_task_uuid_fkey" FOREIGN KEY ("parent_task_uuid") REFERENCES "task_templates"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_uuid_fkey" FOREIGN KEY ("conversation_uuid") REFERENCES "ai_conversations"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_tasks" ADD CONSTRAINT "ai_generation_tasks_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_quotas" ADD CONSTRAINT "ai_usage_quotas_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_configs" ADD CONSTRAINT "dashboard_configs_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_profiles" ADD CONSTRAINT "sync_profiles_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_sessions" ADD CONSTRAINT "sync_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_sessions" ADD CONSTRAINT "sync_sessions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "sync_profiles"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sync_sessions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_changes" ADD CONSTRAINT "pending_changes_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
