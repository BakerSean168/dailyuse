/**
 * ============================================================================
 * Feature Two - 列表查询和复杂操作示例
 * ============================================================================
 * 
 * 【高级功能】
 * 本文件展示如何设计复杂的查询操作：
 * - 分页查询
 * - 多维度排序
 * - 多条件过滤
 * - 聚合数据响应
 * 
 * 【文件拆分原则】
 * 当一个文件超过 200 行时，考虑拆分成多个文件：
 * - feature-one.dto.ts: 基础 CRUD
 * - feature-two.dto.ts: 查询和统计
 * - feature-three.dto.ts: 批量操作
 */

import { z } from 'zod';
import type { ExampleClientDTO } from '../aggregates';
import type { ComplexExampleDTO } from '../dtos';

// ============================================================================
// LIST Query - 分页列表查询
// ============================================================================

/**
 * 列表查询 Schema
 * 
 * 【分页参数设计】
 * - page: 页码，从 1 开始（默认 1）
 * - limit: 每页数量，1-100（默认 20）
 * 
 * 【排序参数设计】
 * - sortBy: 使用 enum 限制可排序字段
 * - sortOrder: 'asc' 或 'desc'
 * 
 * 【过滤参数设计】
 * - status: 单个状态过滤
 * - search: 全文搜索（搜索 name/description）
 * - priorityRange: 范围过滤（如 "5-10"）
 * - publicOnly: 布尔过滤
 * 
 * 【默认值策略】
 * - 提供合理的默认值，减少客户端必传参数
 * - 使用 .optional().default() 链式调用
 */
export const ListExampleQuerySchema = z.object({
  // 分页参数
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  
  // 排序参数
  sortBy: z
    .enum(['name', 'priority', 'createdAt', 'updatedAt', 'viewCount'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // 过滤参数
  status: z.string().optional(),
  search: z.string().optional(),
  priorityRange: z.string().optional(), // 格式: "min-max"
  publicOnly: z.boolean().optional().default(false),
});

/**
 * 列表查询请求类型
 */
export type ListExampleQuery = z.infer<typeof ListExampleQuerySchema>;

/**
 * 列表查询响应类型
 * 
 * 【响应结构设计】
 * - data: 实际数据数组
 * - pagination: 分页元数据
 * 
 * 【分页元数据】
 * - page: 当前页码
 * - limit: 每页数量
 * - total: 总记录数
 * - hasMore: 是否有下一页（方便无限滚动）
 * - totalPages: 总页数（方便页码导航）
 * 
 * 【接口 vs Type】
 * - 复杂的响应结构使用 interface
 * - 简单的使用 type
 * - interface 可以被扩展，type 不能
 */
export interface ListExampleRes {
  data: ExampleClientDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

// ============================================================================
// COMPLEX Query - 复杂查询示例
// ============================================================================

/**
 * 复杂查询 Schema
 * 
 * 【使用场景】
 * - 需要关联数据的查询
 * - 需要额外计算的查询
 * - 需要聚合统计的查询
 * 
 * 【参数设计】
 * - includeDetails: 是否包含详细信息（控制响应大小）
 * - filterByDescription: 按描述过滤
 */
export const ComplexExampleQuerySchema = z.object({
  includeDetails: z.boolean().optional().default(false),
  filterByDescription: z.string().optional(),
});

export type ComplexExampleQuery = z.infer<typeof ComplexExampleQuerySchema>;

/**
 * 复杂查询响应类型
 * 
 * 【复杂 DTO 管理】
 * - ComplexExampleDTO 定义在 dtos/ 文件夹中
 * - dtos/ 存放组合型、临时性的 DTO
 * - aggregates/ 存放领域聚合根的 DTO
 * - entities/ 存放领域实体的 DTO
 * 
 * 【响应包含统计信息】
 * - items: 数据项
 * - totalCount: 总数（与 items.length 可能不同，因为有分页）
 */
export interface ComplexExampleRes {
  items: ComplexExampleDTO[];
  totalCount: number;
}

// ============================================================================
// 批量操作示例（如需要，可继续添加）
// ============================================================================

/**
 * 批量更新 Schema
 * 
 * 【批量操作设计原则】
 * - 使用数组接收多个 ID
 * - 限制批量操作的数量（防止性能问题）
 * - 返回操作结果摘要
 */
export const BatchUpdateExampleSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, '至少需要选择一项').max(100, '单次最多处理 100 项'),
  updates: z.object({
    status: z.enum(['Draft', 'Active', 'Archived', 'Rejected']).optional(),
    priority: z.number().int().min(1).max(10).optional(),
  }),
});

export type BatchUpdateExampleReq = z.infer<typeof BatchUpdateExampleSchema>;

/**
 * 批量操作响应
 * 
 * 【结果反馈】
 * - successCount: 成功数量
 * - failedCount: 失败数量
 * - errors: 失败详情（可选）
 */
export interface BatchUpdateExampleRes {
  successCount: number;
  failedCount: number;
  errors?: Array<{
    id: string;
    reason: string;
  }>;
}
