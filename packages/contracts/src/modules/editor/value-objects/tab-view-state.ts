/**
 * Tab View State Value Object
 * 标签页视图状态值对�?
 */

// ============ 接口定义 ============

/**
 * 标签页视图状�?- Server 接口
 */
export interface ITabViewStateServer {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;

  // 值对象方�?
  equals(other: ITabViewStateServer): boolean;
  with(
    updates: Partial<
      Omit<
        ITabViewStateServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ITabViewStateServer;

  // DTO 转换方法
}

/**
 * 标签页视图状�?- Client 接口
 */
export interface ITabViewStateClient {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;

  // 值对象方�?
  equals(other: ITabViewStateClient): boolean;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Tab View State Server DTO
 */
export interface TabViewStateServerDTO {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;
}

/**
 * Tab View State Client DTO
 */
export interface TabViewStateClientDTO {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;
}

/**
 * Tab View State Persistence DTO
 */
export interface TabViewStatePersistenceDTO {
  scroll_top: number;
  scroll_left: number;
  cursor_position: string; // JSON string
  selections: string | null; // JSON string
}

// ============ 类型导出 ============

export type TabViewStateServer = ITabViewStateServer;
export type TabViewStateClient = ITabViewStateClient;
