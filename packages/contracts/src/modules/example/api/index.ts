/**
 * Example Module - API Export
 * 
 * 【规范说明：API 层导出】
 * 按功能分组，每个文件包含相关的 Schema、Req、Res 类型
 */

export {
  // Create
  CreateExampleSchema,
  type CreateExampleReq,
  type CreateExampleRes,
  // Update
  UpdateExampleSchema,
  type UpdateExampleReq,
  type UpdateExampleRes,
  // Get
  type GetExampleReq,
  type GetExampleRes,
  // Delete
  type DeleteExampleReq,
  type DeleteExampleRes,
  // List
  ListExampleQuerySchema,
  type ListExampleQuery,
  type ListExampleRes,

  ComplexExampleQuerySchema,
  type ComplexExampleQuery,
  type ComplexExampleRes,
} from './crud';
