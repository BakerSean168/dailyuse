/**
 * Example Module - DTOs Export
 * 
 * 【规范说明：DTOs 文件夹】
 * 这个文件夹用于存放特殊的 DTO 定义，通常是：
 * - 统计数据 DTO
 * - 复杂查询结果 DTO
 * - 报表数据 DTO
 * 
 * 注意：普通的 DTO 应该定义在相应的地方：
 * - Client DTO → aggregates/*-client.ts
 * - Server DTO → aggregates/*-server.ts
 * - Request DTO → api/requests.ts
 * - Response DTO → api/responses.ts
 */

// 目前没有特殊的 DTO 定义
// 如果需要添加统计或报表 DTO，在这里导出

export type { ComplexExampleDTO } from './complex-example.dto';