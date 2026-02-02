/**
 * Example Module - Value Objects Export
 * 
 * 【规范说明：模块导出】
 * - 统一从 index.ts 导出所有值对象
 * - 使用 export * from 模式
 */

// ============ 品牌化 ID ============
export { ExampleId } from './example-id';
export type { ExampleId as ExampleIdType } from './example-id';

// ============ 枚举类型 ============
export { ExampleStatus, ExampleStatusEnum } from './example-status';
export type { ExampleStatusType } from './example-status';

// ============ Class 类型值对象 ============
export { ExampleProperty } from './example-property';
export { ExampleTag } from './example-tag';
