import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';

/**
 * 时间范围 Value Object
 * 
 * 【规范说明：复杂值对象 - 时间范围】
 * 展示如何处理时间范围这种复杂值对象
 * 
 * 【时间类型选择示例 - 防腐层设计】
 * 1. 传输层（DTO）：TransferDate = number（Unix 时间戳，高效传输）
 * 2. 业务逻辑层：DomainDate = Date（领域计算和规则验证）
 * 3. 持久化层：PersistenceDate = Date（数据库 ORM）
 * 
 * 防腐层优势：
 * - 隔离外部依赖变化（如从 ISO 字符串改为时间戳）
 * - 类型安全（编译时检查）
 * - 统一项目时间处理规范
 * 
 * 【验证规则】
 * - startDate 必须在 endDate 之前
 * - 时间范围不能为负数
 */

/**
 * 时间范围 DTO - 用于 API 传输
 * 使用 TransferDate（number 时间戳）
 */
export interface ExampleTimeRangeDTO {
  startDate: TransferDate; // Unix 时间戳（毫秒）
  endDate: TransferDate;
}

/**
 * 时间范围 Value Object - 用于业务逻辑
 * 使用 DomainDate（Date 对象）
 */
export interface ExampleTimeRange {
  startDate: DomainDate;
  endDate: DomainDate;
}

/**
 * 时间范围 - 持久化 DTO
 * 用于数据库存储
 */
export interface ExampleTimeRangePersistenceDTO {
  startDate: PersistenceDate;
  endDate: PersistenceDate;
}

/**
 * 创建时间范围的工厂函数
 * 
 * @param startDate - 开始时间（支持 TransferDate 或 DomainDate）
 * @param endDate - 结束时间（支持 TransferDate 或 DomainDate）
 * @returns 验证后的时间范围或错误信息
 * 
 * @example
 * ```typescript
 * // 使用 TransferDate（从 API 接收）
 * const result = createExampleTimeRange(
 *   1704067200000,  // 2024-01-01 的时间戳
 *   1735689599000   // 2024-12-31 的时间戳
 * );
 * 
 * // 使用 DomainDate（业务逻辑）
 * const result2 = createExampleTimeRange(
 *   new Date('2024-01-01'),
 *   new Date('2024-12-31')
 * );
 * 
 * if (result.success) {
 *   console.log(result.value.startDate);
 * }
 * ```
 */
export function createExampleTimeRange(
  startDate: TransferDate | DomainDate,
  endDate: TransferDate | DomainDate,
): { success: true; value: ExampleTimeRange } | { success: false; error: string } {
  // 类型转换：统一转为 DomainDate
  const start = typeof startDate === 'number' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'number' ? new Date(endDate) : endDate;

  // 验证：开始时间必须在结束时间之前
  if (start >= end) {
    return {
      success: false,
      error: 'startDate 必须在 endDate 之前（时间范围不能为零或负数）',
    };
  }

  return {
    success: true,
    value: {
      startDate: start,
      endDate: end,
    },
  };
}

/**
 * 将 ExampleTimeRange 转换为 DTO（用于 API 传输）
 * 
 * @example
 * ```typescript
 * const timeRange = createExampleTimeRange(...).value;
 * const dto = toExampleTimeRangeDTO(timeRange);
 * // dto = { startDate: 1704067200000, endDate: 1735689599000 }
 * ```
 */
export function toExampleTimeRangeDTO(timeRange: ExampleTimeRange): ExampleTimeRangeDTO {
  return {
    startDate: timeRange.startDate.getTime(),
    endDate: timeRange.endDate.getTime(),
  };
}

/**
 * 将 ExampleTimeRange 转换为 PersistenceDTO（用于数据库存储）
 */
export function toExampleTimeRangePersistenceDTO(
  timeRange: ExampleTimeRange,
): ExampleTimeRangePersistenceDTO {
  return {
    startDate: timeRange.startDate,
    endDate: timeRange.endDate,
  };
}

/**
 * 时间范围工具函数
 */
export const ExampleTimeRangeUtils = {
  /**
   * 获取时间范围的持续天数
   */
  getDurationDays(timeRange: ExampleTimeRange): number {
    const diffMs = timeRange.endDate.getTime() - timeRange.startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  },

  /**
   * 获取时间范围的持续毫秒数
   */
  getDurationMs(timeRange: ExampleTimeRange): number {
    return timeRange.endDate.getTime() - timeRange.startDate.getTime();
  },

  /**
   * 检查某个时间点是否在范围内（包含边界）
   */
  contains(timeRange: ExampleTimeRange, date: DomainDate | TransferDate): boolean {
    const timestamp = typeof date === 'number' ? date : date.getTime();
    return (
      timestamp >= timeRange.startDate.getTime() &&
      timestamp <= timeRange.endDate.getTime()
    );
  },

  /**
   * 检查两个时间范围是否重叠
   */
  overlaps(range1: ExampleTimeRange, range2: ExampleTimeRange): boolean {
    return (
      range1.startDate.getTime() < range2.endDate.getTime() &&
      range1.endDate.getTime() > range2.startDate.getTime()
    );
  },
};
