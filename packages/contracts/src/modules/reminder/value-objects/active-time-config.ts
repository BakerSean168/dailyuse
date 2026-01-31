/**
 * Active Time Config Value Object
 * 生效时间配置值对�?
 * 
 * 重构说明�?
 * - 移除 endDate 字段（生效控制改�?status 字段负责�?
 * - startDate 重命名为 activatedAt（语义更清晰�?
 * - activatedAt 作为循环提醒的计算基�?
 */

// ============ 接口定义 ============

/**
 * 生效时间配置 - Server 接口
 */
export interface IActiveTimeConfigServer {
  /** 启动时间 (epoch ms) - 最后一次启用的时间�?*/
  activatedAt: number;

  // 值对象方�?
  equals(other: IActiveTimeConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IActiveTimeConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IActiveTimeConfigServer;

  // DTO 转换方法
}

/**
 * 生效时间配置 - Client 接口
 */
export interface IActiveTimeConfigClient {
  /** 启动时间 (epoch ms) */
  activatedAt: number;

  // UI 辅助属�?
  displayText: string; // "启动�?2024-01-01 10:30"

  // 值对象方�?
  equals(other: IActiveTimeConfigClient): boolean;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Active Time Config Server DTO
 */
export interface ActiveTimeConfigServerDTO {
  /** 启动时间�?*/
  activatedAt: number;
}

/**
 * Active Time Config Client DTO
 */
export interface ActiveTimeConfigClientDTO {
  /** 启动时间�?*/
  activatedAt: number;
  /** 显示文本 */
  displayText: string;
}

/**
 * Active Time Config Persistence DTO
 */
export interface ActiveTimeConfigPersistenceDTO {
  /** 启动时间�?*/
  activatedAt: number;
}

// ============ 类型导出 ============

export type ActiveTimeConfigServer = IActiveTimeConfigServer;
export type ActiveTimeConfigClient = IActiveTimeConfigClient;
