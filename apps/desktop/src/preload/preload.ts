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
  // ═══════════ System / App ═══════════
  'app:getInfo',
  'app:checkDIStatus',
  'system:getDIStatus',
  'system:getAppVersion',
  'system:getLazyModuleStats',
  'system:getMemoryUsage',
  'system:getIpcCacheStats',

  // ═══════════ Goal (electron-entry: 13 handlers) ═══════════
  'goal:list',
  'goal:get',
  'goal:create',
  'goal:update',
  'goal:delete',
  'goal:archive',
  'goal:restore',
  'goal:update-progress',
  'goal:activate',
  'goal:pause',
  'goal:complete',
  'goal:search',
  // Goal → KeyResult (adapter-only, no electron-entry handler yet)
  'goal:keyResult:add',
  'goal:keyResult:list',
  'goal:keyResult:update',
  'goal:keyResult:delete',
  'goal:keyResult:batchUpdateWeights',
  'goal:progressBreakdown',
  // Goal → Review (adapter-only)
  'goal:review:create',
  'goal:review:list',
  'goal:review:update',
  'goal:review:delete',
  // Goal → Record (adapter-only)
  'goal:record:create',
  'goal:record:listByKeyResult',
  'goal:record:listByGoal',
  'goal:record:delete',
  // Goal → Aggregate (adapter-only)
  'goal:aggregate',
  'goal:clone',
  // Goal → Folder (electron-entry: 4 handlers)
  'goal:folder:list',
  'goal:folder:get',
  'goal:folder:create',
  'goal:folder:update',
  'goal:folder:delete',
  // Goal → Focus (adapter-only)
  'goal:focus:start',
  'goal:focus:pause',
  'goal:focus:resume',
  'goal:focus:stop',
  'goal:focus:status',
  'goal:focus:history',
  'goal:focus:statistics',
  // Goal → Statistics (electron-entry: 1 handler)
  'goal:statistics:get',

  // ═══════════ Task (electron-entry: 14 handlers) ═══════════
  // Task → Template
  'task:template:list',
  'task:template:get',
  'task:template:create',
  'task:template:update',
  'task:template:delete',
  'task:template:archive',
  'task:template:restore',
  'task:template:activate',
  'task:template:pause',
  'task:template:generate-instances',
  'task:template:get-instances',
  'task:template:get-by-priority',
  'task:template:bind-goal',
  'task:template:unbind-goal',
  // Task → Instance
  'task:instance:list',
  'task:instance:get',
  'task:instance:create',
  'task:instance:update',
  'task:instance:delete',
  'task:instance:start',
  'task:instance:complete',
  'task:instance:skip',
  'task:instance:check-expired',
  // Task → Dependency (adapter-only)
  'task:dependency:create',
  'task:dependency:list',
  'task:dependency:dependents',
  'task:dependency:chain',
  'task:dependency:validate',
  'task:dependency:delete',
  'task:dependency:update',
  // Task → Statistics (electron-entry: 1 handler)
  'task:statistics:get',

  // ═══════════ Schedule (electron-entry: 9 handlers) ═══════════
  // Schedule CRUD (flat — matches electron-entry)
  'schedule:list',
  'schedule:list-by-date-range',
  'schedule:get',
  'schedule:create',
  'schedule:update',
  'schedule:delete',
  'schedule:complete',
  'schedule:cancel',
  'schedule:reschedule',
  // Schedule conflict detection (adapter-only)
  'schedule:get-conflicts',
  'schedule:detect-conflicts',
  'schedule:create-with-conflict-detection',
  'schedule:resolve-conflict',
  // Schedule → ScheduleTask (adapter: schedule:task:*)
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
  // Schedule → Statistics (adapter-only, electron-entry TODO)
  'schedule:statistics:get',
  'schedule:statistics:get-module',
  'schedule:statistics:get-all-modules',
  'schedule:statistics:recalculate',
  'schedule:statistics:reset',
  'schedule:statistics:delete',

  // ═══════════ Reminder (electron-entry: 9 handlers) ═══════════
  // Reminder → Template
  'reminder:template:list',
  'reminder:template:get',
  'reminder:template:create',
  'reminder:template:update',
  'reminder:template:delete',
  'reminder:template:toggle-enabled',
  'reminder:template:move-to-group',
  'reminder:template:toggle',
  'reminder:template:move',
  'reminder:template:search',
  'reminder:template:schedule-status',
  'reminder:template:get-by-user',
  'reminder:upcoming:get',
  // Reminder → Group
  'reminder:group:list',
  'reminder:group:get',
  'reminder:group:create',
  'reminder:group:update',
  'reminder:group:delete',
  'reminder:group:get-by-user',
  'reminder:group:toggle-status',
  'reminder:group:toggle-control-mode',
  // Reminder → Statistics
  'reminder:statistics:get',

  // ═══════════ Account (electron-entry: stub) ═══════════
  'account:list',
  'account:get',
  'account:current',
  'account:create',
  'account:delete',
  'account:update-profile',
  'account:change-password',
  'account:check-availability',
  'account:close',
  'account:get-all',
  'account:activate',
  'account:deactivate',
  'account:suspend',
  'account:stats:get',

  // ═══════════ Authentication (desktop handlers) ═══════════
  // Core auth
  'auth:login',
  'auth:register',
  'auth:logout',
  'auth:get-status',
  'auth:refresh-token',
  'auth:enter-offline-mode',
  'auth:initialize',
  'auth:auto-login',
  'auth:verify-token',
  'auth:token-status',
  'auth:session-status',
  'auth:cleanup-sessions',
  // Password
  'auth:forgot-password',
  'auth:reset-password',
  'auth:change-password',
  // 2FA
  'auth:2fa:enable',
  'auth:2fa:disable',
  'auth:2fa:verify',
  'auth:2fa:get-status',
  'auth:2fa:generate-backup-codes',
  // API keys
  'auth:api-key:create',
  'auth:api-key:list',
  'auth:api-key:revoke',
  'auth:api-key:rotate',
  // Sessions
  'auth:session:list',
  'auth:session:get-current',
  'auth:session:revoke',
  'auth:session:revoke-all',
  // Devices
  'auth:device:list',
  'auth:device:get-current',
  'auth:device:trust',
  'auth:device:revoke',
  'auth:device:rename',

  // ═══════════ Notification (electron-entry: 11 handlers) ═══════════
  'notification:list',
  'notification:get',
  'notification:create',
  'notification:mark-read',
  'notification:mark-all-read',
  'notification:delete',
  'notification:clear-all',
  'notification:unread-count',
  'notification:settings:get',
  'notification:settings:update',
  'notification:statistics:get',

  // ═══════════ Dashboard (adapter-only) ═══════════
  'dashboard:get-all',
  'dashboard:get-overview',
  'dashboard:get-today',
  'dashboard:get-stats',
  'dashboard:statistics:get',
  'dashboard:statistics:refresh',
  'dashboard:config:get',
  'dashboard:config:update',
  'dashboard:config:reset',

  // ═══════════ Repository (electron-entry: 15 handlers) ═══════════
  'repository:list',
  'repository:get',
  'repository:create',
  'repository:update',
  'repository:delete',
  // Repository → Resource
  'repository:resource:list',
  'repository:resource:get',
  'repository:resource:create',
  'repository:resource:update',
  'repository:resource:delete',
  // Repository → Folder
  'repository:folder:list',
  'repository:folder:create',
  'repository:folder:update',
  'repository:folder:delete',
  // Repository → Search
  'repository:search',

  // ═══════════ Editor (electron-entry: 5 handlers) ═══════════
  'editor:document:list',
  'editor:document:get',
  'editor:document:create',
  'editor:document:update',
  'editor:document:delete',
  'editor:document:save',
  'editor:content:get',
  'editor:content:save',
  'editor:content:auto-save',
  'editor:search',

  // ═══════════ Setting (electron-entry: 6 handlers) ═══════════
  'setting:all',
  'setting:get',
  'setting:update',
  'setting:reset',
  'setting:import',
  'setting:export',

  // ═══════════ AI (electron-entry: 13 handlers) ═══════════
  // AI → Chat / Conversation
  'ai:chat',
  'ai:conversation:list',
  'ai:conversation:get',
  'ai:conversation:create',
  'ai:conversation:update',
  'ai:conversation:delete',
  'ai:conversation:clear',
  'ai:conversation:close',
  'ai:conversation:archive',
  // AI → Analysis & Suggestions
  'ai:analyze:task',
  'ai:analyze:goal',
  'ai:suggest:schedule',
  'ai:suggest:breakdown',
  'ai:task:decompose',
  // AI → Config
  'ai:config:get',
  'ai:config:update',
  // AI → Message (adapter-only, no electron-entry handler)
  'ai:message:send',
  'ai:message:list',
  'ai:message:delete',
  'ai:message:stream:start',
  'ai:message:stream:next',
  'ai:message:stream:end',
  // AI → Generation (adapter-only)
  'ai:generation-task:create',
  'ai:generation-task:list',
  'ai:generation-task:get',
  'ai:generation-task:cancel',
  'ai:generation-task:retry',
  'ai:generate:goal',
  'ai:generate:goal-with-key-results',
  'ai:generate:key-results',
  'ai:generateKeyResults',
  // AI → Provider (adapter-only)
  'ai:provider:create',
  'ai:provider:list',
  'ai:provider:get',
  'ai:provider:update',
  'ai:provider:delete',
  'ai:provider:test-connection',
  'ai:provider:set-default',
  'ai:provider:refresh-models',
  // AI → Quota (adapter-only)
  'ai:quota:get',
  'ai:quota:update-limit',
  'ai:quota:check',

  // ═══════════ Governance (adapter-only) ═══════════
  'governance:rule:create',
  'governance:rule:get',
  'governance:rule:update',
  'governance:rule:delete',
  'governance:rule:list',
  'governance:rule:search',

  // ═══════════ Desktop Features ═══════════
  'desktop:autoLaunch:isEnabled',
  'desktop:autoLaunch:enable',
  'desktop:autoLaunch:disable',
  'desktop:shortcuts:getAll',
  'desktop:shortcuts:update',
  'desktop:tray:flash',
  'desktop:tray:stopFlash',

  // ═══════════ Performance / Dev ═══════════
  'cache:stats',
  'cache:clear',
  'cache:invalidate',
  'dev:memory:status',
  'dev:memory:snapshots',
  'dev:memory:force-gc',

  // ═══════════ Sync ═══════════
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

  // ═══════════ Window Management ═══════════
  'window:transition-to-main',
  'window:transition-to-login',
  'window:minimize-login',
  'window:close-login',

  // ═══════════ GitHub Gist Sync ═══════════
  'sync:github:connect',
  'sync:github:disconnect',
  'sync:github:get-status',
  'sync:github:push',
  'sync:github:pull',
  'sync:github:full-sync',
  'sync:github:get-user',
  'sync:github:set-token',

  // ═══════════ Data Import/Export ═══════════
  'sync:export-data',
  'sync:import-data',
  'sync:get-export-preview',

  // ═══════════ Sync Coordinator ═══════════
  'sync:trigger',
  'sync:force-full',
  'sync:get-coordinator-status',

  // ═══════════ Backup ═══════════
  'sync:backup:create',
  'sync:backup:list',
  'sync:backup:restore',
  'sync:backup:delete',
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
