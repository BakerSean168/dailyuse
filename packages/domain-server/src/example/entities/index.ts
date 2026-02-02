/**
 * Example 实体模块导出
 * 
 * 实体（Entity）vs 聚合根（Aggregate）：
 * - 实体：有标识符、有生命周期、从属于聚合
 * - 聚合根：聚合的入口点，对外代表整个聚合
 */
export { ExampleHistory, ExampleHistoryAction } from './ExampleHistory';
export type { ExampleHistoryAction as ExampleHistoryActionType } from './ExampleHistory';
