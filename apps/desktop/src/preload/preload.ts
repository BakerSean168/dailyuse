/**
 * @file Electron Preload Script
 * @description
 * Implements a secure `contextBridge` to expose specific API capabilities to the renderer process.
 * Acts as a security barrier, ensuring only authorized IPC channels can be accessed.
 * Follows Electron security best practices (context isolation, sandboxing).
 *
 * The exposed API matches the `ElectronAPI` type definition expected by `@dailyuse/infrastructure-client`.
 *
 * @module preload
 */

import { contextBridge, ipcRenderer } from 'electron';

// ========== IPC Channel Whitelist ==========
// Security: Only allow communication on these specific channels.

const ALLOWED_CHANNELS = [
  // App
  'app:getInfo',
  'app:checkDIStatus',
  'system:getDIStatus',
  'system:getAppVersion',

  // Goal
  'goal:create',
  'goal:list',
  'goal:get',
  'goal:update',
  'goal:delete',
  'goal:activate',
  'goal:pause',
  'goal:complete',
  'goal:archive',
  'goal:search',
  'goal:keyResult:add',
  'goal:keyResult:list',
  'goal:keyResult:update',
  'goal:keyResult:delete',
  'goal:keyResult:batchUpdateWeights',
  'goal:progressBreakdown',
  'goal:review:create',
  'goal:review:list',
  'goal:review:update',
  'goal:review:delete',
  'goal:record:create',
  'goal:record:listByKeyResult',
  'goal:record:listByGoal',
  'goal:record:delete',
  'goal:aggregate',
  'goal:clone',

  // Goal Folder
  'goal-folder:create',
  'goal-folder:list',
  'goal-folder:get',
  'goal-folder:update',
  'goal-folder:delete',

  // Task Template
  'task-template:create',
  'task-template:list',
  'task-template:get',
  'task-template:update',
  'task-template:delete',
  'task-template:activate',
  'task-template:pause',
  'task-template:archive',
  'task-template:generate-instances',
  'task-template:get-instances',
  'task-template:bind-goal',
  'task-template:unbind-goal',

  // Task Instance
  'task-instance:list',
  'task-instance:get',
  'task-instance:delete',
  'task-instance:start',
  'task-instance:complete',
  'task-instance:skip',
  'task-instance:check-expired',

  // Task Dependency
  'task-dependency:create',
  'task-dependency:list',
  'task-dependency:dependents',
  'task-dependency:chain',
  'task-dependency:validate',
  'task-dependency:delete',
  'task-dependency:update',

  // Task Statistics
  'task-statistics:get',
  'task-statistics:recalculate',
  'task-statistics:delete',
  'task-statistics:update-template',
  'task-statistics:update-instance',
  'task-statistics:update-completion',
  'task-statistics:today-rate',
  'task-statistics:week-rate',
  'task-statistics:efficiency-trend',

  // Schedule Task
  'schedule:task:create',
  'schedule:task:create-batch',
  'schedule:task:list',
  'schedule:task:get',
  'schedule:task:get-due',
  'schedule:task:get-by-source',
  'schedule:task:listBySourceEntity',
  'schedule:task:update',
  'schedule:task:delete',
  'schedule:task:pause',
  'schedule:task:resume',
  'schedule:task:reschedule',
  'schedule:task:trigger',
  'schedule:task:cancel',
  'schedule:task:complete',
  'schedule:task:delete-batch',
  'schedule:task:update-metadata',
  'schedule:statistics:get',
  'schedule:statistics:get-module',
  'schedule:statistics:get-all-modules',
  'schedule:statistics:recalculate',
  'schedule:statistics:reset',
  'schedule:statistics:delete',

  // Schedule Event
  'schedule:event:create',
  'schedule:event:get',
  'schedule:event:get-by-account',
  'schedule:event:get-by-time-range',
  'schedule:event:update',
  'schedule:event:delete',
  'schedule:event:get-conflicts',
  'schedule:event:detect-conflicts',
  'schedule:event:create-with-conflict-detection',
  'schedule:event:resolve-conflict',

  // Reminder
  'reminder:template:create',
  'reminder:template:get',
  'reminder:template:list',
  'reminder:template:listByGroup',
  'reminder:template:listActive',
  'reminder:template:update',
  'reminder:template:delete',
  'reminder:template:enable',
  'reminder:template:disable',
  'reminder:template:move',
  'reminder:template:search',
  'reminder:template:schedule-status',
  'reminder:upcoming:get',
  'reminder:group:create',
  'reminder:group:get',
  'reminder:group:list',
  'reminder:group:listByUser',
  'reminder:group:update',
  'reminder:group:delete',
  'reminder:group:toggleStatus',
  'reminder:group:toggleControlMode',
  'reminder:statistics:get',

  // Account
  'account:create',
  'account:get',
  'account:get-all',
  'account:delete',
  'account:me:get',
  'account:me:update',
  'account:me:change-password',
  'account:profile:update',
  'account:preferences:update',
  'account:email:update',
  'account:email:verify',
  'account:phone:update',
  'account:phone:verify',
  'account:deactivate',
  'account:suspend',
  'account:activate',
  'account:subscription:get',
  'account:subscription:subscribe',
  'account:subscription:cancel',
  'account:history:get',
  'account:stats:get',

  // Authentication
  'auth:login',
  'auth:register',
  'auth:logout',
  'auth:refresh-token',
  'auth:forgot-password',
  'auth:reset-password',
  'auth:change-password',
  'auth:2fa:enable',
  'auth:2fa:disable',
  'auth:2fa:verify',
  'auth:api-key:create',
  'auth:api-key:list',
  'auth:api-key:revoke',
  'auth:session:list',
  'auth:session:revoke',
  'auth:session:revoke-all',
  'auth:device:trust',
  'auth:device:revoke',
  'auth:device:list',

  // Notification
  'notification:create',
  'notification:find-all',
  'notification:find-by-uuid',
  'notification:mark-read',
  'notification:mark-all-read',
  'notification:delete',
  'notification:batch-delete',
  'notification:unread-count',

  // Dashboard
  'dashboard:get-all',
  'dashboard:get-overview',
  'dashboard:get-today',
  'dashboard:get-stats',
  'dashboard:statistics:get',
  'dashboard:statistics:refresh',
  'dashboard:config:get',
  'dashboard:config:update',
  'dashboard:config:reset',

  // Repository
  'repository:create',
  'repository:list',
  'repository:get',
  'repository:delete',
  'repository:folder:create',
  'repository:folder:contents',
  'repository:folder:rename',
  'repository:folder:move',
  'repository:folder:delete',
  'repository:tree',
  'repository:search',
  'repository:resource:get',
  'repository:resource:rename',
  'repository:resource:move',
  'repository:resource:delete',

  // Setting
  'setting:user:get',
  'setting:user:appearance',
  'setting:user:locale',
  'setting:user:workflow',
  'setting:user:privacy',
  'setting:user:reset',
  'setting:app:get',
  'setting:sync',
  'setting:export',
  'setting:import',

  // AI Conversation
  'ai:conversation:create',
  'ai:conversation:list',
  'ai:conversation:get',
  'ai:conversation:update',
  'ai:conversation:delete',
  'ai:conversation:close',
  'ai:conversation:archive',

  // AI Message
  'ai:message:send',
  'ai:message:list',
  'ai:message:delete',
  'ai:message:stream:start',
  'ai:message:stream:next',
  'ai:message:stream:end',

  // AI Generation
  'ai:generation-task:create',
  'ai:generation-task:list',
  'ai:generation-task:get',
  'ai:generation-task:cancel',
  'ai:generation-task:retry',
  'ai:generate:goal',
  'ai:generate:goal-with-key-results',
  'ai:generate:key-results',
  'ai:generateKeyResults',

  // AI Provider
  'ai:provider:create',
  'ai:provider:list',
  'ai:provider:get',
  'ai:provider:update',
  'ai:provider:delete',
  'ai:provider:test-connection',
  'ai:provider:set-default',
  'ai:provider:refresh-models',

  // AI Quota
  'ai:quota:get',
  'ai:quota:update-limit',
  'ai:quota:check',

  // STORY-10: Desktop Features
  'desktop:autoLaunch:isEnabled',
  'desktop:autoLaunch:enable',
  'desktop:autoLaunch:disable',
  'desktop:shortcuts:getAll',
  'desktop:shortcuts:update',
  'desktop:tray:flash',
  'desktop:tray:stopFlash',

  // EPIC-003: Performance Monitoring
  'system:getLazyModuleStats',
  'system:getMemoryUsage',
  'system:getIpcCacheStats',
  'cache:stats',
  'cache:clear',
  'cache:invalidate',
  'dev:memory:status',
  'dev:memory:snapshots',
  'dev:memory:force-gc',

  // EPIC-004: Sync (STORY-019-022)
  'sync:getSummary',
  'sync:getStats',
  'sync:getState',
  'sync:triggerSync',
  'sync:forceSync',
  'sync:isOnline',
  'sync:getSettings',
  'sync:updateSettings',
  'sync:conflict:getUnresolved',
  'sync:conflict:getCount',
  'sync:conflict:resolve',
  'sync:conflict:resolveWithLocal',
  'sync:conflict:resolveWithServer',
  'sync:conflict:getHistory',
  'sync:conflict:getStats',
  'sync:device:getInfo',
  'sync:device:rename',
  'sync:device:list',
] as const;

/**
 * @typedef AllowedChannel
 * @description Type representing valid allowed channels.
 */
type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

// Fast lookup set for allowed channels
const allowedChannelsSet = new Set<string>(ALLOWED_CHANNELS);

/**
 * @function isAllowedChannel
 * @description Validates if a channel string is permitted.
 *
 * @param {string} channel - The channel name to check.
 * @returns {boolean} True if the channel is allowed.
 */
function isAllowedChannel(channel: string): channel is AllowedChannel {
  return allowedChannelsSet.has(channel);
}

// Map to store event listeners for safe removal
const eventListeners = new Map<string, Set<(...args: unknown[]) => void>>();

/**
 * @constant electronAPI
 * @description The API exposed to the renderer process via `window.electronAPI`.
 *
 * Implements the `ElectronAPI` interface used by the frontend infrastructure client.
 */
const electronAPI = {
  /**
   * @method invoke
   * @description Invokes a main process handler via IPC.
   * Used for request-response communication (e.g., fetching data).
   *
   * @template T The expected return type.
   * @param {string} channel - The IPC channel name.
   * @param {...unknown[]} args - Arguments to pass to the handler.
   * @returns {Promise<T>} A promise that resolves with the handler's result.
   */
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    if (!isAllowedChannel(channel)) {
      return Promise.reject(new Error(`IPC channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  /**
   * @method on
   * @description Registers a listener for messages sent from the main process.
   * Used for push notifications or event updates.
   *
   * @param {string} channel - The IPC channel to listen on.
   * @param {(...args: unknown[]) => void} callback - The function to call when a message is received.
   */
  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    if (!isAllowedChannel(channel)) {
      console.warn(`IPC channel "${channel}" is not allowed for listening`);
      return;
    }

    // Wrap callback to strip the event object from arguments, exposing only data
    const wrappedCallback = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };

    // Store for cleanup
    if (!eventListeners.has(channel)) {
      eventListeners.set(channel, new Set());
    }
    eventListeners.get(channel)!.add(callback);

    // Attach wrapped reference to original callback for removal
    (callback as unknown as { __wrapped: typeof wrappedCallback }).__wrapped = wrappedCallback;

    ipcRenderer.on(channel, wrappedCallback);
  },

  /**
   * @method off
   * @description Removes a previously registered listener.
   *
   * @param {string} channel - The IPC channel.
   * @param {(...args: unknown[]) => void} callback - The original callback function to remove.
   */
  off: (channel: string, callback: (...args: unknown[]) => void): void => {
    const wrappedCallback = (callback as unknown as { __wrapped: (...args: unknown[]) => void }).__wrapped;
    if (wrappedCallback) {
      ipcRenderer.removeListener(channel, wrappedCallback);
    }

    // Clean up internal map
    eventListeners.get(channel)?.delete(callback);
  },

  // ========== Convenience Methods (Backward Compatibility) ==========
  
  /** Retrieves application info. */
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  /** Checks Dependency Injection status. */
  checkDIStatus: () => ipcRenderer.invoke('app:checkDIStatus'),
};

// Expose the API to the renderer process safely
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Export type for TypeScript usage in renderer
export type ElectronAPI = typeof electronAPI;
