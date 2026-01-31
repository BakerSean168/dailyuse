/**
 * Session Layout Value Object
 * 会话布局值对�?
 */

// ============ 接口定义 ============

/**
 * 会话布局 - Server 接口
 */
export interface ISessionLayoutServer {
  splitType: 'horizontal' | 'vertical' | 'grid';
  groupCount: number;
  activeGroupIndex: number;

  // 值对象方�?
  equals(other: ISessionLayoutServer): boolean;
  with(
    updates: Partial<
      Omit<
        ISessionLayoutServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ISessionLayoutServer;

  // DTO 转换方法
}

/**
 * 会话布局 - Client 接口
 */
export interface ISessionLayoutClient {
  splitType: 'horizontal' | 'vertical' | 'grid';
  groupCount: number;
  activeGroupIndex: number;

  // 值对象方�?
  equals(other: ISessionLayoutClient): boolean;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Session Layout Server DTO
 */
export interface SessionLayoutServerDTO {
  splitType: 'horizontal' | 'vertical' | 'grid';
  groupCount: number;
  activeGroupIndex: number;
}

/**
 * Session Layout Client DTO
 */
export interface SessionLayoutClientDTO {
  splitType: 'horizontal' | 'vertical' | 'grid';
  groupCount: number;
  activeGroupIndex: number;
}

/**
 * Session Layout Persistence DTO
 */
export interface SessionLayoutPersistenceDTO {
  split_type: 'horizontal' | 'vertical' | 'grid';
  group_count: number;
  active_group_index: number;
}

// ============ 类型导出 ============

export type SessionLayoutServer = ISessionLayoutServer;
export type SessionLayoutClient = ISessionLayoutClient;

// ============ 默认�?============

export const DEFAULT_SESSION_LAYOUT: SessionLayoutServerDTO = {
  splitType: 'horizontal',
  groupCount: 1,
  activeGroupIndex: 0,
};
