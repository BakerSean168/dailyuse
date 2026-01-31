/**
 * Workspace Layout Value Object
 * 工作区布局值对象
 */

// ============ 接口定义 ============

/**
 * 工作区布局 - Server 接口
 */
export interface IWorkspaceLayoutServer {
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  panelPosition: 'bottom' | 'right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;

  // 值对象方法
  equals(other: IWorkspaceLayoutServer): boolean;
  with(
    updates: Partial<
      Omit<
        IWorkspaceLayoutServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IWorkspaceLayoutServer;

  // DTO 转换方法}

/**
 * 工作区布局 - Client 接口
 */
export interface IWorkspaceLayoutClient {
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  panelPosition: 'bottom' | 'right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;

  // 值对象方法
  equals(other: IWorkspaceLayoutClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Workspace Layout Server DTO
 */
export interface WorkspaceLayoutServerDTO {
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  panelPosition: 'bottom' | 'right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}

/**
 * Workspace Layout Client DTO
 */
export interface WorkspaceLayoutClientDTO {
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  panelPosition: 'bottom' | 'right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}

/**
 * Workspace Layout Persistence DTO
 */
export interface WorkspaceLayoutPersistenceDTO {
  sidebar_position: 'left' | 'right';
  sidebar_width: number;
  panel_position: 'bottom' | 'right';
  panel_height: number;
  is_sidebar_visible: boolean;
  is_panel_visible: boolean;
}

// ============ 类型导出 ============

export type WorkspaceLayoutServer = IWorkspaceLayoutServer;
export type WorkspaceLayoutClient = IWorkspaceLayoutClient;

// ============ 默认值 ============

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayoutServerDTO = {
  sidebarPosition: 'left',
  sidebarWidth: 300,
  panelPosition: 'bottom',
  panelHeight: 200,
  isSidebarVisible: true,
  isPanelVisible: false,
};
