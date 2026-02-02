/**
 * Example Module - Value Objects Export
 * 
 * 【规范说明：模块导出】
 * - 使用 export type 和 export const 明确区分类型和值
 * - 分组导出，按逻辑分类（状态、配置、属性等）
 * - 每个分组添加注释说明作用
 */

// ============ Statuses ============
export { ExampleStatus } from './example-status';
export type { ExampleStatusCode, ExampleStatusType } from './example-status';

// ============ Properties ============
export type { ExamplePropertyDTO, ExampleProperty } from './example-property';
export { createExampleProperty } from './example-property';

// ============ Time Ranges ============
export type { ExampleTimeRangeDTO, ExampleTimeRange, ExampleTimeRangePersistenceDTO } from './example-time-range';
export { createExampleTimeRange, toExampleTimeRangeDTO, toExampleTimeRangePersistenceDTO, ExampleTimeRangeUtils } from './example-time-range';

