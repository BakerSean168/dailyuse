/**
 * Setting Preference Types — Per-category typed interfaces
 *
 * 每个接口对应一个设置分类，字段名与 SETTING_REGISTRY key 的第二段一致。
 * 例如 `appearance.theme` → AppearancePreferences.theme
 */

// ─── 外观设置 ─────────────────────────────────────────────
export interface AppearancePreferences {
  /** 主题模式: 'light' | 'dark' | 'auto' */
  theme: string;
  /** 界面字号 (10-18) */
  fontSize: number;
  /** 紧凑模式 */
  compactMode: boolean;
  /** 强调色 (hex) */
  accentColor: string;
  /** 字体族 */
  fontFamily: string | null;
}

// ─── 区域/本地化设置 ──────────────────────────────────────
export interface LocalePreferences {
  /** 语言 (e.g., 'zh-CN', 'en-US') */
  language: string;
  /** 时区 (e.g., 'Asia/Shanghai') */
  timezone: string;
  /** 日期格式 (e.g., 'YYYY-MM-DD') */
  dateFormat: string;
  /** 时间格式: '12H' | '24H' */
  timeFormat: string;
  /** 货币 (e.g., 'CNY') */
  currency: string;
  /** 每周起始日 (0=Sunday, 1=Monday, ...) */
  weekStartsOn: number;
}

// ─── 工作流设置 ───────────────────────────────────────────
export interface WorkflowPreferences {
  /** 自动保存 */
  autoSave: boolean;
  /** 自动保存间隔 (ms) */
  autoSaveInterval: number;
  /** 删除前确认 */
  confirmBeforeDelete: boolean;
  /** 默认任务视图: 'LIST' | 'KANBAN' | 'CALENDAR' */
  defaultTaskView: string;
  /** 默认目标视图: 'LIST' | 'TREE' | 'TIMELINE' */
  defaultGoalView: string;
  /** 默认日程视图: 'DAY' | 'WEEK' | 'MONTH' */
  defaultScheduleView: string;
}

// ─── 隐私设置 ─────────────────────────────────────────────
export interface PrivacyPreferences {
  /** 个人资料可见性: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY' */
  profileVisibility: string;
  /** 显示在线状态 */
  showOnlineStatus: boolean;
  /** 分享使用数据 */
  shareUsageData: boolean;
  /** 允许通过邮箱搜索 */
  allowSearchByEmail: boolean;
  /** 允许通过手机搜索 */
  allowSearchByPhone: boolean;
}

// ─── 通知设置 ─────────────────────────────────────────────
export interface NotificationPreferences {
  /** 邮件通知 */
  email: boolean;
  /** 推送通知 */
  push: boolean;
  /** 应用内通知 */
  inApp: boolean;
  /** 声音通知 */
  sound: boolean;
}

// ─── 编辑器设置 ───────────────────────────────────────────
export interface EditorPreferences {
  /** 编辑器主题 */
  theme: string;
  /** 编辑器字号 */
  fontSize: number;
  /** Tab 大小 */
  tabSize: number;
  /** 自动换行 */
  wordWrap: boolean;
  /** 显示行号 */
  lineNumbers: boolean;
  /** 显示缩略图 */
  minimap: boolean;
}

// ─── 快捷键设置 ───────────────────────────────────────────
export interface ShortcutPreferences {
  /** 启用快捷键 */
  enabled: boolean;
  /** 自定义快捷键映射 (JSON 序列化存储) */
  custom: Record<string, string>;
}

// ─── 实验性功能 ───────────────────────────────────────────
export interface ExperimentalPreferences {
  /** 启用实验性功能 */
  enabled: boolean;
  /** 已启用的实验性功能列表 (JSON 序列化存储) */
  features: string[];
}

// ─── UI 状态偏好 ──────────────────────────────────────────
export interface UIStatePreferences {
  /** 启动页 */
  startPage: string;
  /** 侧栏是否收起 */
  sidebarCollapsed: boolean;
}

// ─── 聚合：所有偏好设置 ──────────────────────────────────
export interface UserSettingPreferences {
  appearance: AppearancePreferences;
  locale: LocalePreferences;
  workflow: WorkflowPreferences;
  privacy: PrivacyPreferences;
  notification: NotificationPreferences;
  editor: EditorPreferences;
  shortcuts: ShortcutPreferences;
  experimental: ExperimentalPreferences;
  ui: UIStatePreferences;
}
