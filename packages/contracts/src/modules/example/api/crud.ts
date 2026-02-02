import { z } from 'zod';
import type { ExampleClientDTO } from '../aggregates';

// ============ 创建 Example ============

/**
 * 创建 Example 请求 Schema
 * - 不包含 id（由后端生成）
 * - 不包含 status（默认为 Draft）
 * - 不包含时间戳（由后端设置）
 */
export const CreateExampleSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(256, '名称不能超过 256 字符'),
  description: z.string().max(2000, '描述不能超过 2000 字符').optional(),
  priority: z.number().int().min(1).max(10).optional().default(5),
  isPublic: z.boolean().optional().default(false),
});

export type CreateExampleReq = z.infer<typeof CreateExampleSchema>;
export type CreateExampleRes = ExampleClientDTO;

// ============ 更新 Example ============

/**
 * 更新 Example 请求 Schema
 * - 所有字段都是可选的（PATCH 语义）
 * - 支持 null 值清空字段
 */
export const UpdateExampleSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(['Draft', 'Active', 'Archived', 'Rejected']).optional(),
});

export type UpdateExampleReq = z.infer<typeof UpdateExampleSchema>;
export type UpdateExampleRes = ExampleClientDTO;

// ============ 获取单个 Example ============

export type GetExampleReq = void;
export type GetExampleRes = ExampleClientDTO;

// ============ 删除 Example ============

export type DeleteExampleReq = void;
export type DeleteExampleRes = ExampleClientDTO;

// ============ 列表查询 ============

/**
 * 列表查询 Schema
 * - 包含分页、排序、过滤参数
 * - 所有参数都是可选的
 */
export const ListExampleQuerySchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['name', 'priority', 'createdAt', 'updatedAt', 'viewCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.string().optional(),
  search: z.string().optional(),
  priorityRange: z.string().optional(),
  publicOnly: z.boolean().optional().default(false),
});

export type ListExampleQuery = z.infer<typeof ListExampleQuerySchema>;

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
