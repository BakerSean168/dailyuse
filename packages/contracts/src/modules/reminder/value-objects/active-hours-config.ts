/**
 * Active Hours Config Value Object
 * 活跃时间段配置值对�?
 */

// ============ 接口定义 ============

/**
 * 活跃时间段配�?- Server 接口
 */
export interface IActiveHoursConfigServer {
  enabled: boolean;
  /** 开始小�?(0-23) */
  startHour: number;
  /** 结束小时 (0-23) */
  endHour: number;

  // 值对象方�?
  equals(other: IActiveHoursConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IActiveHoursConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IActiveHoursConfigServer;

  // DTO 转换方法
}

/**
 * 活跃时间段配�?- Client 接口
 */
export interface IActiveHoursConfigClient {
  enabled: boolean;
  startHour: number;
  endHour: number;

  // UI 辅助属�?
  displayText: string; // "09:00 - 21:00" | "全天"

  // 值对象方�?
  equals(other: IActiveHoursConfigClient): boolean;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Active Hours Config Server DTO
 */
export interface ActiveHoursConfigServerDTO {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

/**
 * Active Hours Config Client DTO
 */
export interface ActiveHoursConfigClientDTO {
  enabled: boolean;
  startHour: number;
  endHour: number;
  displayText: string;
}

/**
 * Active Hours Config Persistence DTO
 */
export interface ActiveHoursConfigPersistenceDTO {
  enabled: boolean;
  start_hour: number;
  end_hour: number;
}

// ============ 类型导出 ============

export type ActiveHoursConfigServer = IActiveHoursConfigServer;
export type ActiveHoursConfigClient = IActiveHoursConfigClient;
