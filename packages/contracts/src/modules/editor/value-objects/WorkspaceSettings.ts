/**
 * Workspace Settings Value Object
 * 工作区设置值对象
 */

// ============ 接口定义 ============

/**
 * 工作区设置 - Server 接口
 */
export interface IWorkspaceSettingsServer {
  theme?: string | null;
  fontSize?: number | null;
  fontFamily?: string | null;
  lineHeight?: number | null;
  tabSize?: number | null;
  wordWrap?: boolean | null;
  lineNumbers?: boolean | null;
  minimap?: boolean | null;
  autoSave?: {
    enabled: boolean;
    interval: number; // 秒
  } | null;

  // 值对象方法
  equals(other: IWorkspaceSettingsServer): boolean;
  with(
    updates: Partial<
      Omit<
        IWorkspaceSettingsServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IWorkspaceSettingsServer;

  // DTO 转换方法}

/**
 * 工作区设置 - Client 接口
 */
export interface IWorkspaceSettingsClient {
  theme: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: {
    enabled: boolean;
    interval: number;
  };

  // UI 辅助属性
  autoSaveFormatted: string; // "每 30 秒"

  // 值对象方法
  equals(other: IWorkspaceSettingsClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Workspace Settings Server DTO
 */
export interface WorkspaceSettingsServerDTO {
  theme?: string | null;
  fontSize?: number | null;
  fontFamily?: string | null;
  lineHeight?: number | null;
  tabSize?: number | null;
  wordWrap?: boolean | null;
  lineNumbers?: boolean | null;
  minimap?: boolean | null;
  autoSave?: {
    enabled: boolean;
    interval: number;
  } | null;
}

/**
 * Workspace Settings Client DTO
 */
export interface WorkspaceSettingsClientDTO {
  theme: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: {
    enabled: boolean;
    interval: number;
  };
  autoSaveFormatted: string;
}

/**
 * Workspace Settings Persistence DTO
 */
export interface WorkspaceSettingsPersistenceDTO {
  theme?: string | null;
  font_size?: number | null;
  font_family?: string | null;
  line_height?: number | null;
  tab_size?: number | null;
  word_wrap?: boolean | null;
  line_numbers?: boolean | null;
  minimap?: boolean | null;
  auto_save?: string | null; // JSON string
}

// ============ 类型导出 ============

export type WorkspaceSettingsServer = IWorkspaceSettingsServer;
export type WorkspaceSettingsClient = IWorkspaceSettingsClient;

// ============ 默认值 ============

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettingsServerDTO = {
  theme: 'default',
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  lineHeight: 1.5,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  minimap: true,
  autoSave: {
    enabled: true,
    interval: 30,
  },
};
