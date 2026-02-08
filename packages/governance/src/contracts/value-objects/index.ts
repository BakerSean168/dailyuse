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

// ============ Properties ============
export type {  ExampleProperty, ExamplePropertyDTO, ExamplePropertyPersistenceDTO } from './example-property';

