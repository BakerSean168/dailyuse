/**
 * DoNotDisturbConfig Value Object
 * 勿扰模式配置值对象
 *
 * Residual 851: DoNotDisturbConfigDTO dual retired — sole DoNotDisturbConfig interface + type alias.
 */

// Residual 851: sole DoNotDisturbConfig body.
export interface DoNotDisturbConfig {
  enabled: boolean;
  startTime: string; // 'HH:mm' format
  endTime: string; // 'HH:mm' format
  daysOfWeek: number[]; // 0-6 (0=Sunday)
}

// Residual 851: DoNotDisturbConfigDTO dual retired — DTO is the DoNotDisturbConfig shape.
export type DoNotDisturbConfigDTO = DoNotDisturbConfig;
