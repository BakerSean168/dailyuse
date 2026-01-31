/**
 * DoNotDisturbConfig Value Object
 * 勿扰模式配置值对象
 */

// ============ 接口定义 ============

/**
 * DoNotDisturbConfig Server Interface
 */
export interface IDoNotDisturbConfig {
  enabled: boolean;
  startTime: string; // 'HH:mm' format
  endTime: string; // 'HH:mm' format
  daysOfWeek: number[]; // 0-6 (0=Sunday)

  // 值对象方法
  with(
    updates: Partial<
      Omit<
        IDoNotDisturbConfig,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IDoNotDisturbConfig;

  // 工具方法

  // DTO 转换方法
}

/**
 * DoNotDisturbConfig Client Interface
 */
export interface IDoNotDisturbConfigClient {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];

  // UI 计算属性
  timeRangeText: string; // "22:00 - 08:00"
  daysOfWeekText: string; // "周一, 周二, 周三"
  isActive: boolean; // 当前是否处于勿扰时间段

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * DoNotDisturbConfig DTO (Server)
 */
export interface DoNotDisturbConfigDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

/**
 * DoNotDisturbConfig Client DTO
 */
export interface DoNotDisturbConfigClientDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timeRangeText: string;
  daysOfWeekText: string;
  isActive: boolean;
}

/**
 * DoNotDisturbConfig Persistence DTO
 */
export interface DoNotDisturbConfigPersistenceDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: string; // JSON.stringify(number[])
}

// ============ 实现类型 ============

export type DoNotDisturbConfig = IDoNotDisturbConfig;
export type DoNotDisturbConfigClient = IDoNotDisturbConfigClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use DoNotDisturbConfigDTO instead
 */
export type DoNotDisturbConfigServerDTO = DoNotDisturbConfigDTO;

/**
 * @deprecated Use IDoNotDisturbConfig instead
 */
export type IDoNotDisturbConfigServer = IDoNotDisturbConfig;

/**
 * @deprecated Use DoNotDisturbConfig instead
 */
export type DoNotDisturbConfigServer = DoNotDisturbConfig;
