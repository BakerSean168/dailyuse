/**
 * PowerSync CRUD value normalization
 *
 * PowerSync clients send CRUD operations with string-encoded JSON and
 * string/number booleans. These helpers normalize values to their proper
 * Prisma-compatible types before upsert.
 */

export const JSON_FIELDS_BY_TABLE: Record<string, ReadonlySet<string>> = {
  accounts: new Set(['profile', 'settings']),
  user_settings: new Set(['preferences']),
  repositories: new Set(['config', 'stats']),
  folders: new Set(['metadata']),
  resources: new Set(['metadata', 'stats']),
  editor_workspaces: new Set(['layout', 'setting']),
  editor_workspace_sessions: new Set(['layout']),
  editor_workspace_session_group_tabs: new Set(['view_state']),
  ai_knowledge_index_entries: new Set(['keywords', 'embedding', 'chunks', 'metadata']),
  dashboard_configs: new Set(['widget_config']),
};

export const BOOLEAN_FIELDS_BY_TABLE: Record<string, ReadonlySet<string>> = {
  accounts: new Set(['email_is_verified', 'email_is_primary', 'phone_is_verified']),
  goal_folders: new Set(['is_system_folder']),
  focus_modes: new Set(['is_active']),
  task_templates: new Set(['reminder_config_enabled', 'is_blocked']),
  schedules: new Set(['has_conflict']),
  schedule_tasks: new Set(['enabled']),
  reminder_templates: new Set([
    'self_enabled',
    'is_auto_adjusted',
    'user_confirmed',
    'smart_frequency_enabled',
  ]),
  reminder_groups: new Set(['enabled']),
  reminder_history: new Set(['notification_sent']),
  user_reminder_preferences: new Set(['global_reminder_enabled', 'global_smart_frequency']),
  notifications: new Set(['is_read']),
  notification_preferences: new Set(['enabled']),
  notification_templates: new Set(['is_system', 'is_active']),
  ai_provider_configs: new Set(['is_active', 'is_default']),
  folders: new Set(['is_expanded']),
  editor_workspaces: new Set(['is_active']),
  editor_workspace_sessions: new Set(['is_active']),
  editor_workspace_session_group_tabs: new Set(['is_pinned', 'is_active']),
};

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function parseJsonLikeString(value: string): unknown {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return JSON.parse(trimmed);
  }

  return value;
}

function normalizeBooleanLikeValue(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === '1' || trimmed === 'true') return true;
    if (trimmed === '0' || trimmed === 'false') return false;
  }

  return value;
}

function normalizeCrudValue(tableName: string, key: string, value: unknown): unknown {
  if (JSON_FIELDS_BY_TABLE[tableName]?.has(key) && typeof value === 'string') {
    try {
      return parseJsonLikeString(value);
    } catch {
      return value;
    }
  }

  if (BOOLEAN_FIELDS_BY_TABLE[tableName]?.has(key)) {
    return normalizeBooleanLikeValue(value);
  }

  return value;
}

export function normalizeCrudData(
  tableName: string,
  data: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!data) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      snakeToCamel(key),
      normalizeCrudValue(tableName, key, value),
    ]),
  );
}
