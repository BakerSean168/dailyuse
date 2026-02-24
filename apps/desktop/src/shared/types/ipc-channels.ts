/**
 * IPC Channel Names - 所有 IPC 通道名称常量
 * 
 * 命名规范：`{module}:{action}` 或 `{module}:{entity}:{action}`
 * 
 * @module shared/types/ipc-channels
 */

// ============ Task Module Channels ============

export const TaskChannels = {
  // Template CRUD
  TEMPLATE_LIST: 'task:template:list',
  TEMPLATE_GET: 'task:template:get',
  TEMPLATE_CREATE: 'task:template:create',
  TEMPLATE_UPDATE: 'task:template:update',
  TEMPLATE_DELETE: 'task:template:delete',
  
  // Template Operations
  TEMPLATE_ARCHIVE: 'task:template:archive',
  TEMPLATE_RESTORE: 'task:template:restore',
  TEMPLATE_MOVE_TO_FOLDER: 'task:template:move-to-folder',
  TEMPLATE_REORDER: 'task:template:reorder',
  
  // Instance CRUD
  INSTANCE_LIST: 'task:instance:list',
  INSTANCE_GET: 'task:instance:get',
  INSTANCE_CREATE: 'task:instance:create',
  INSTANCE_UPDATE: 'task:instance:update',
  INSTANCE_DELETE: 'task:instance:delete',
  
  // Instance Operations
  INSTANCE_COMPLETE: 'task:instance:complete',
  INSTANCE_UNCOMPLETE: 'task:instance:uncomplete',
  INSTANCE_SKIP: 'task:instance:skip',
  INSTANCE_POSTPONE: 'task:instance:postpone',
  
  // Folder
  FOLDER_LIST: 'task:folder:list',
  FOLDER_CREATE: 'task:folder:create',
  FOLDER_UPDATE: 'task:folder:update',
  FOLDER_DELETE: 'task:folder:delete',
} as const;

// ============ Goal Module Channels ============

export const GoalChannels = {
  // CRUD
  LIST: 'goal:list',
  GET: 'goal:get',
  CREATE: 'goal:create',
  UPDATE: 'goal:update',
  DELETE: 'goal:delete',
  
  // Operations
  ARCHIVE: 'goal:archive',
  RESTORE: 'goal:restore',
  MOVE_TO_FOLDER: 'goal:move-to-folder',
  UPDATE_PROGRESS: 'goal:update-progress',
  
  // Folder
  FOLDER_LIST: 'goal:folder:list',
  FOLDER_CREATE: 'goal:folder:create',
  FOLDER_UPDATE: 'goal:folder:update',
  FOLDER_DELETE: 'goal:folder:delete',
  
  // Focus (专注功能)
  FOCUS_START: 'goal:focus:start',
  FOCUS_PAUSE: 'goal:focus:pause',
  FOCUS_RESUME: 'goal:focus:resume',
  FOCUS_STOP: 'goal:focus:stop',
  FOCUS_GET_STATUS: 'goal:focus:status',
  FOCUS_GET_HISTORY: 'goal:focus:history',
} as const;

// ============ Schedule Module Channels ============

export const ScheduleChannels = {
  // CRUD
  LIST: 'schedule:list',
  LIST_BY_DATE_RANGE: 'schedule:list-by-date-range',
  GET: 'schedule:get',
  CREATE: 'schedule:create',
  UPDATE: 'schedule:update',
  DELETE: 'schedule:delete',
  
  // Operations
  COMPLETE: 'schedule:complete',
  CANCEL: 'schedule:cancel',
  RESCHEDULE: 'schedule:reschedule',
  
  // Recurring
  RECURRING_LIST: 'schedule:recurring:list',
  RECURRING_CREATE: 'schedule:recurring:create',
  RECURRING_UPDATE: 'schedule:recurring:update',
  RECURRING_DELETE: 'schedule:recurring:delete',
  
} as const;

// ============ Reminder Module Channels ============

export const ReminderChannels = {
  // CRUD (legacy API compatibility)
  LIST: 'reminder:list',
  GET: 'reminder:get',
  CREATE: 'reminder:create',
  UPDATE: 'reminder:update',
  DELETE: 'reminder:delete',
  
  // Operations (legacy API compatibility)
  SNOOZE: 'reminder:snooze',
  ACKNOWLEDGE: 'reminder:acknowledge',
  DISMISS: 'reminder:dismiss',
  
  // Linked Entity (legacy API compatibility)
  LIST_BY_LINKED_ENTITY: 'reminder:list-by-linked-entity',
  
  // Template CRUD
  TEMPLATE_LIST: 'reminder:template:list',
  TEMPLATE_GET: 'reminder:template:get',
  TEMPLATE_CREATE: 'reminder:template:create',
  TEMPLATE_UPDATE: 'reminder:template:update',
  TEMPLATE_DELETE: 'reminder:template:delete',
  
  // Template Operations
  TEMPLATE_TOGGLE_ENABLED: 'reminder:template:toggle-enabled',
  TEMPLATE_MOVE_TO_GROUP: 'reminder:template:move-to-group',
  
  // Instance
  INSTANCE_LIST: 'reminder:instance:list',
  INSTANCE_SNOOZE: 'reminder:instance:snooze',
  INSTANCE_DISMISS: 'reminder:instance:dismiss',
  INSTANCE_COMPLETE: 'reminder:instance:complete',
  
  // Group
  GROUP_LIST: 'reminder:group:list',
  GROUP_CREATE: 'reminder:group:create',
  GROUP_UPDATE: 'reminder:group:update',
  GROUP_DELETE: 'reminder:group:delete',
  
  // Events
  EVENT_TRIGGERED: 'reminder:event:triggered',
  EVENT_UPDATED: 'reminder:event:updated',
  EVENT_DELETED: 'reminder:event:deleted',
} as const;

// ============ Dashboard Module Channels ============

export const DashboardChannels = {
  // Overview
  GET_OVERVIEW: 'dashboard:overview',
  GET_TODAY: 'dashboard:today',
  GET_WEEK: 'dashboard:week',
  GET_SUMMARY: 'dashboard:summary',
  
  // Widgets
  WIDGET_LIST: 'dashboard:widget:list',
  WIDGET_GET: 'dashboard:widget:get',
  WIDGET_CREATE: 'dashboard:widget:create',
  WIDGET_UPDATE: 'dashboard:widget:update',
  WIDGET_DELETE: 'dashboard:widget:delete',
  WIDGET_REORDER: 'dashboard:widget:reorder',
  
  // Quick Actions
  QUICK_ADD_TASK: 'dashboard:quick-add-task',
  QUICK_ADD_REMINDER: 'dashboard:quick-add-reminder',
  QUICK_ADD_SCHEDULE: 'dashboard:quick-add-schedule',
  
  // Activities
  ACTIVITY_LIST: 'dashboard:activity:list',
  ACTIVITY_RECENT: 'dashboard:activity:recent',
} as const;

// ============ Account Module Channels ============

export const AccountChannels = {
  // Account CRUD
  LIST: 'account:list',
  GET: 'account:get',
  CREATE: 'account:create',
  UPDATE: 'account:update',
  DELETE: 'account:delete',
  GET_CURRENT: 'account:current',
  SWITCH: 'account:switch',
  UPDATE_PROFILE: 'account:update-profile',
  UPDATE_AVATAR: 'account:update-avatar',
  
  // Subscription
  GET_SUBSCRIPTION: 'account:subscription',
  UPDATE_SUBSCRIPTION: 'account:update-subscription',
  CANCEL_SUBSCRIPTION: 'account:subscription:cancel',
  
  // History & Stats
  GET_HISTORY: 'account:history',
  GET_STATS: 'account:stats',
  GET_USAGE: 'account:usage',
  
  // Preferences
  PREFERENCES_GET: 'account:preferences:get',
  PREFERENCES_UPDATE: 'account:preferences:update',
  GET_PREFERENCES: 'account:preferences',
  UPDATE_PREFERENCES: 'account:update-preferences',
  
  // Sync
  SYNC_START: 'account:sync:start',
  SYNC_STOP: 'account:sync:stop',
  SYNC_STATUS: 'account:sync:status',
  SYNC_HISTORY: 'account:sync:history',
} as const;

// ============ Auth Module Channels ============

export const AuthChannels = {
  // Authentication
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  
  // Session
  GET_CURRENT_USER: 'auth:current-user',
  CHECK_AUTH: 'auth:check',
  REFRESH_TOKEN: 'auth:refresh-token',
  
  // Password
  CHANGE_PASSWORD: 'auth:change-password',
  FORGOT_PASSWORD: 'auth:forgot-password',
  RESET_PASSWORD: 'auth:reset-password',
  
  // Social
  SOCIAL_LOGIN: 'auth:social-login',
  LINK_SOCIAL: 'auth:link-social',
  UNLINK_SOCIAL: 'auth:unlink-social',
  
  // OAuth
  OAUTH_START: 'auth:oauth:start',
  OAUTH_CALLBACK: 'auth:oauth:callback',
  OAUTH_PROVIDERS: 'auth:oauth:providers',
  
  // Two-Factor Authentication
  TWO_FACTOR_ENABLE: 'auth:2fa:enable',
  TWO_FACTOR_DISABLE: 'auth:2fa:disable',
  TWO_FACTOR_VERIFY: 'auth:2fa:verify',
  TWO_FACTOR_STATUS: 'auth:2fa:status',
  TWO_FACTOR_BACKUP_CODES: 'auth:2fa:backup-codes',
  
  // Sessions
  SESSION_LIST: 'auth:session:list',
  SESSION_REVOKE: 'auth:session:revoke',
  SESSION_REVOKE_ALL: 'auth:session:revoke-all',
} as const;

// ============ AI Module Channels ============

export const AIChannels = {
  // Chat
  CHAT: 'ai:chat',
  CHAT_STREAM: 'ai:chat:stream',
  CHAT_CANCEL: 'ai:chat:cancel',
  CHAT_STOP: 'ai:chat:stop',
  
  // Conversations
  CONVERSATION_LIST: 'ai:conversation:list',
  CONVERSATION_GET: 'ai:conversation:get',
  CONVERSATION_CREATE: 'ai:conversation:create',
  CONVERSATION_DELETE: 'ai:conversation:delete',
  CONVERSATION_CLEAR: 'ai:conversation:clear',
  
  // Analysis
  ANALYZE_TASK: 'ai:analyze:task',
  ANALYZE_GOAL: 'ai:analyze:goal',
  SUGGEST_SCHEDULE: 'ai:suggest:schedule',
  SUGGEST_BREAKDOWN: 'ai:suggest:breakdown',
  
  // Task Decomposition
  DECOMPOSE_TASK: 'ai:task:decompose',
  
  // Planning
  PLAN_DAY: 'ai:plan:day',
  PLAN_WEEK: 'ai:plan:week',
  PLAN_OPTIMIZE: 'ai:plan:optimize',
  
  // Reviews
  REVIEW_DAILY: 'ai:review:daily',
  REVIEW_WEEKLY: 'ai:review:weekly',
  REVIEW_MONTHLY: 'ai:review:monthly',
  
  // Config
  GET_CONFIG: 'ai:config:get',
  UPDATE_CONFIG: 'ai:config:update',
} as const;

// ============ Notification Module Channels ============

export const NotificationChannels = {
  // Notifications CRUD
  LIST: 'notification:list',
  GET: 'notification:get',
  CREATE: 'notification:create',
  MARK_READ: 'notification:mark-read',
  MARK_ALL_READ: 'notification:mark-all-read',
  DELETE: 'notification:delete',
  CLEAR_ALL: 'notification:clear-all',
  GET_UNREAD_COUNT: 'notification:unread-count',
  
  // Batch Operations
  SEND_BATCH: 'notification:send-batch',
  
  // Settings
  GET_SETTINGS: 'notification:settings:get',
  UPDATE_SETTINGS: 'notification:settings:update',
  SETTINGS_GET: 'notification:settings:get',
  SETTINGS_UPDATE: 'notification:settings:update',
  
  // System
  SHOW: 'notification:show',
  HIDE: 'notification:hide',
  
  // Events
  EVENT_RECEIVED: 'notification:event:received',
  EVENT_CLICKED: 'notification:event:clicked',
  EVENT_ACTION: 'notification:event:action',
  EVENT_CLOSED: 'notification:event:closed',
  EVENT_UNREAD_CHANGED: 'notification:event:unread-changed',
  
  // Subscribe
  SUBSCRIBE: 'notification:subscribe',
  UNSUBSCRIBE: 'notification:unsubscribe',
} as const;

// ============ Repository Module Channels ============

export const RepositoryChannels = {
  // Repository
  LIST: 'repository:list',
  GET: 'repository:get',
  CREATE: 'repository:create',
  UPDATE: 'repository:update',
  DELETE: 'repository:delete',
  
  // Resources
  RESOURCE_LIST: 'repository:resource:list',
  RESOURCE_GET: 'repository:resource:get',
  RESOURCE_CREATE: 'repository:resource:create',
  RESOURCE_UPDATE: 'repository:resource:update',
  RESOURCE_DELETE: 'repository:resource:delete',
  
  // Folders
  FOLDER_LIST: 'repository:folder:list',
  FOLDER_CREATE: 'repository:folder:create',
  FOLDER_UPDATE: 'repository:folder:update',
  FOLDER_DELETE: 'repository:folder:delete',
  
  // Search & Import/Export
  SEARCH: 'repository:search',
  IMPORT: 'repository:import',
  EXPORT: 'repository:export',
  
  // Backup
  BACKUP_CREATE: 'repository:backup:create',
  BACKUP_LIST: 'repository:backup:list',
  BACKUP_GET: 'repository:backup:get',
  BACKUP_DELETE: 'repository:backup:delete',
  BACKUP_RESTORE: 'repository:backup:restore',
  
  // Events
  EVENT_BACKUP_PROGRESS: 'repository:event:backup-progress',
  EVENT_RESTORE_PROGRESS: 'repository:event:restore-progress',
  EVENT_EXPORT_PROGRESS: 'repository:event:export-progress',
  EVENT_IMPORT_PROGRESS: 'repository:event:import-progress',
} as const;

// ============ Setting Module Channels ============

export const SettingChannels = {
  // General
  GET_ALL: 'setting:all',
  GET: 'setting:get',
  UPDATE: 'setting:update',
  RESET: 'setting:reset',
  
  // Sections
  SECTION_GET: 'setting:section:get',
  SECTION_UPDATE: 'setting:section:update',
  
  // Shortcuts
  SHORTCUT_LIST: 'setting:shortcut:list',
  SHORTCUT_SET: 'setting:shortcut:set',
  SHORTCUT_RESET: 'setting:shortcut:reset',
  
  // Theme
  THEME_GET: 'setting:theme:get',
  THEME_SET: 'setting:theme:set',
  THEME_LIST: 'setting:theme:list',
  
  // Language
  LANGUAGE_GET: 'setting:language:get',
  LANGUAGE_SET: 'setting:language:set',
  
  // Notification Settings
  NOTIFICATION_GET: 'setting:notification:get',
  NOTIFICATION_UPDATE: 'setting:notification:update',
  
  // Backup
  BACKUP_CREATE: 'setting:backup:create',
  BACKUP_RESTORE: 'setting:backup:restore',
  BACKUP_LIST: 'setting:backup:list',
  
  // Import/Export
  IMPORT: 'setting:import',
  EXPORT: 'setting:export',
  
  // Events
  EVENT_THEME_CHANGED: 'setting:event:theme-changed',
} as const;

// ============ Editor Module Channels ============

export const EditorChannels = {
  // Document CRUD
  DOCUMENT_LIST: 'editor:document:list',
  DOCUMENT_GET: 'editor:document:get',
  DOCUMENT_CREATE: 'editor:document:create',
  DOCUMENT_UPDATE: 'editor:document:update',
  DOCUMENT_DELETE: 'editor:document:delete',
  DOCUMENT_GET_BY_LINKED_ENTITY: 'editor:document:get-by-linked-entity',
  DOCUMENT_CREATE_FOR_LINKED_ENTITY: 'editor:document:create-for-linked-entity',
  DOCUMENT_SAVE: 'editor:document:save',
  
  // Content
  GET_CONTENT: 'editor:content:get',
  SAVE_CONTENT: 'editor:content:save',
  AUTO_SAVE: 'editor:content:auto-save',
  
  // History / Versioning
  UNDO: 'editor:undo',
  REDO: 'editor:redo',
  GET_HISTORY: 'editor:history:get',
  VERSION_LIST: 'editor:version:list',
  VERSION_GET: 'editor:version:get',
  VERSION_RESTORE: 'editor:version:restore',
  
  // Assets
  UPLOAD_IMAGE: 'editor:asset:upload-image',
  DELETE_ASSET: 'editor:asset:delete',
  
  // Search
  SEARCH: 'editor:search',
  
  // Export
  EXPORT_MARKDOWN: 'editor:export:markdown',
  EXPORT_HTML: 'editor:export:html',
  EXPORT_PDF: 'editor:export:pdf',
  
  // Events
  EVENT_AUTOSAVE_COMPLETED: 'editor:event:autosave-completed',
  EVENT_DOCUMENT_UPDATED: 'editor:event:document-updated',
} as const;

// ============ System Channels ============

export const SystemChannels = {
  // App
  APP_VERSION: 'system:app:version',
  APP_QUIT: 'system:app:quit',
  APP_MINIMIZE: 'system:app:minimize',
  APP_MAXIMIZE: 'system:app:maximize',
  
  // Window
  WINDOW_CLOSE: 'system:window:close',
  WINDOW_MINIMIZE: 'system:window:minimize',
  WINDOW_MAXIMIZE: 'system:window:maximize',
  WINDOW_FULLSCREEN: 'system:window:fullscreen',
  
  // Updates
  CHECK_UPDATE: 'system:update:check',
  DOWNLOAD_UPDATE: 'system:update:download',
  INSTALL_UPDATE: 'system:update:install',
  
  // Dev
  DEV_TOOLS: 'system:dev:tools',
  DEV_RELOAD: 'system:dev:reload',
} as const;

// ============ All Channels Type ============

export type TaskChannel = (typeof TaskChannels)[keyof typeof TaskChannels];
export type GoalChannel = (typeof GoalChannels)[keyof typeof GoalChannels];
export type ScheduleChannel = (typeof ScheduleChannels)[keyof typeof ScheduleChannels];
export type ReminderChannel = (typeof ReminderChannels)[keyof typeof ReminderChannels];
export type DashboardChannel = (typeof DashboardChannels)[keyof typeof DashboardChannels];
export type AccountChannel = (typeof AccountChannels)[keyof typeof AccountChannels];
export type AuthChannel = (typeof AuthChannels)[keyof typeof AuthChannels];
export type AIChannel = (typeof AIChannels)[keyof typeof AIChannels];
export type NotificationChannel = (typeof NotificationChannels)[keyof typeof NotificationChannels];
export type RepositoryChannel = (typeof RepositoryChannels)[keyof typeof RepositoryChannels];
export type SettingChannel = (typeof SettingChannels)[keyof typeof SettingChannels];
export type EditorChannel = (typeof EditorChannels)[keyof typeof EditorChannels];
export type SystemChannel = (typeof SystemChannels)[keyof typeof SystemChannels];

export type IPCChannel =
  | TaskChannel
  | GoalChannel
  | ScheduleChannel
  | ReminderChannel
  | DashboardChannel
  | AccountChannel
  | AuthChannel
  | AIChannel
  | NotificationChannel
  | RepositoryChannel
  | SettingChannel
  | EditorChannel
  | SystemChannel;
