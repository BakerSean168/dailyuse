/**
 * Workspace Layout Value Object
 * 工作区布局值对�?
 */

// ============ 接口定义 ============

/**
 * 工作区布局 - Server 接口
 */
export interface IWorkspaceLayoutServer {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        IWorkspaceLayoutServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IWorkspaceLayoutServer;

  // DTO 转换方法
}

/**
 * 工作区布局 - Client 接口
 */
export interface IWorkspaceLayoutClient {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Workspace Layout Server DTO
 */
export interface WorkspaceLayoutServerDTO {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}

/**
 * Workspace Layout Client DTO
 */
export interface WorkspaceLayoutClientDTO {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}

/**
 * Workspace Layout Persistence DTO
 */
export interface WorkspaceLayoutPersistenceDTO {
  sidebar_position: 'Left' | 'Right';
  sidebar_width: number;
  panel_position: 'Bottom' | 'Right';
  panel_height: number;
  is_sidebar_visible: boolean;
  is_panel_visible: boolean;
}

// ============ 类型导出 ============

export type WorkspaceLayoutServer = IWorkspaceLayoutServer;
export type WorkspaceLayoutClient = IWorkspaceLayoutClient;

// ============ 默认�?============

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayoutServerDTO = {
  sidebarPosition: 'Left',
  sidebarWidth: 300,
  panelPosition: 'Bottom',
  panelHeight: 200,
  isSidebarVisible: true,
  isPanelVisible: false,
};
