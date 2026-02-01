/**
 * DoNotDisturbConfig Value Object
 * 勿扰模式配置值对象
 */

// ============ 接口定义 ============

/**
 * DoNotDisturbConfig 接口
 */
export interface DoNotDisturbConfig {
  enabled: boolean;
  startTime: string; // 'HH:mm' format
  endTime: string; // 'HH:mm' format
  daysOfWeek: number[]; // 0-6 (0=Sunday)
}

// ============ DTO 定义 ============

/**
 * DoNotDisturbConfig DTO (传输层)
 */
export interface DoNotDisturbConfigDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

/**
 * DoNotDisturbConfig Persistence DTO (持久层)
 */
export interface DoNotDisturbConfigPersistenceDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: string; // JSON.stringify(number[])
}
