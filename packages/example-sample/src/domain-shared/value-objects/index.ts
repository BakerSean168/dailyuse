/**
 * Example Module - Value Objects Export
 * 
 * 【规范说明：value-objects模块导出】
 * - 使用 详细命名导出 模式
 * 注意只需要直接导出。如 export { ExampleStatus } from './example-status'; 不需要重复导出类型：export type { ExampleStatus };
 */

// ============ 品牌化 ID ============
export { ExampleId } from './example-id';

// ============ 枚举类型 ============
export { ExampleStatus } from './example-status';

// ============ Class 类型值对象 ============
export { ExampleProperty } from './example-property';
