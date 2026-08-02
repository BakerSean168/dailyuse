/**
 * Desktop Platform — Electron-specific Feature Initialization
 *
 * Hooks into Electron IPC events for tray, shortcuts, online/offline,
 * window state management, and PowerSync data-change broadcasts.
 * Called once during app startup.
 */
import type { App } from 'vue';
import { RendererEventChannels } from '@memoflow/contracts/electron';

import { useAccountStore } from '@memoflow/app-vue/modules/account';
import { useGoalStore } from '@memoflow/app-vue/modules/goal';
import { useTaskStore } from '@memoflow/app-vue/modules/task';
import { useScheduleStore } from '@memoflow/app-vue/modules/schedule';
import { useReminderStore } from '@memoflow/app-vue/modules/reminder';
import { useNotificationStore } from '@memoflow/app-vue/modules/notification';
import { useUserSettingStore } from '@memoflow/app-vue/modules/setting';
import { useGovernanceStore } from '@memoflow/app-vue/modules/governance';
// Residual 941: host bridge via getElectronBridge sole helper.
import { getElectronBridge } from './electron-bridge';

const api = getElectronBridge();

export function initElectronFeatures(app: App): void {
  void app;

  if (!api) return;

  setupTraySync();
  setupShortcuts();
  setupOnlineStatus();
  setupDbChangeListener();
}

function setupTraySync(): void {
  api?.on(RendererEventChannels.TRAY_ACTION, (...args: unknown[]) => {
    const action = args[1] as string | undefined;
    if (action) {
      console.log('[Electron] Tray action:', action);
    }
  });
}

function setupShortcuts(): void {
  api?.on(RendererEventChannels.SHORTCUT_TRIGGERED, (...args: unknown[]) => {
    const shortcut = args[1] as string | undefined;
    if (shortcut) {
      console.log('[Electron] Shortcut triggered:', shortcut);
    }
  });
}

function setupOnlineStatus(): void {
  window.addEventListener('online', () => {
    console.log('[Electron] Network: online');
  });
  window.addEventListener('offline', () => {
    console.log('[Electron] Network: offline');
  });
}

// ──────────────────────────────────────────────
// PowerSync db:changed → Pinia store invalidation
// ──────────────────────────────────────────────

/**
 * Maps PowerSync table names to the domain module whose Pinia store
 * should be invalidated when the table changes.
 */
const TABLE_TO_MODULE: Record<string, string> = {
  accounts: 'account',
  // Goal
  goals: 'goal',
  goal_folders: 'goal',
  key_results: 'goal',
  goal_records: 'goal',
  goal_reviews: 'goal',
  key_result_weight_snapshots: 'goal',
  focus_sessions: 'goal',
  focus_modes: 'goal',
  // Task
  task_templates: 'task',
  task_instances: 'task',
  task_folders: 'task',
  task_dependencies: 'task',
  task_template_history: 'task',
  task_statistics: 'task',
  // Schedule
  schedules: 'schedule',
  schedule_jobs: 'schedule',
  schedule_tasks: 'schedule',
  schedule_executions: 'schedule',
  schedule_statistics: 'schedule',
  // Reminder
  reminder_templates: 'reminder',
  reminder_groups: 'reminder',
  reminder_instances: 'reminder',
  reminder_history: 'reminder',
  reminder_statistics: 'reminder',
  reminder_responses: 'reminder',
  user_reminder_preferences: 'reminder',
  // Notification
  notifications: 'notification',
  notification_channels: 'notification',
  notification_history: 'notification',
  notification_preferences: 'notification',
  notification_templates: 'notification',
  // Settings
  user_settings: 'setting',
  // Governance
  rules: 'governance',
  rule_revisions: 'governance',
};

/**
 * Module name → Pinia store invalidation function.
 *
 * When a PowerSync table changes, we mark the corresponding store as
 * not-initialized so the next composable access triggers a fresh fetch.
 */
const MODULE_INVALIDATORS: Record<string, () => void> = {
  account: () => useAccountStore().setInitialized(false),
  goal: () => useGoalStore().setInitialized(false),
  task: () => useTaskStore().setInitialized(false),
  schedule: () => useScheduleStore().setInitialized(false),
  reminder: () => useReminderStore().setInitialized(false),
  notification: () => useNotificationStore().setInitialized(false),
  setting: () => useUserSettingStore().setInitialized(false),
  governance: () => useGovernanceStore().setInitialized(false),
};

/**
 * Listens for `db:changed` events from the main process (PowerSync onChange)
 * and invalidates the affected Pinia stores so the next view access re-fetches.
 *
 * Also dispatches a `db:tables-changed` CustomEvent on `window` so active
 * components can react immediately if desired.
 */
function setupDbChangeListener(): void {
  api?.on(RendererEventChannels.DB_CHANGED, (...args: unknown[]) => {
    const payload = args[0] as { tables: string[] } | undefined;
    if (!payload?.tables?.length) return;

    // Deduplicate modules
    const modules = new Set<string>();
    for (const table of payload.tables) {
      const mod = TABLE_TO_MODULE[table];
      if (mod) modules.add(mod);
    }

    // Invalidate affected stores
    for (const mod of modules) {
      MODULE_INVALIDATORS[mod]?.();
    }

    if (modules.size > 0) {
      console.log('[Electron] db:changed → invalidated:', [...modules].join(', '));
    }

    // Emit a DOM event for components that want immediate reactivity
    window.dispatchEvent(
      new CustomEvent('db:tables-changed', {
        detail: { tables: payload.tables, modules: [...modules] },
      }),
    );
  });
}
