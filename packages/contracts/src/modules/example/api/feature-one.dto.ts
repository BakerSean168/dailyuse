/**
 * ============================================================================
 * Feature One - 基础 CRUD 操作示例
 * ============================================================================
 * 
 * 【文件组织原则】
 * - 按业务功能域划分文件，而非按技术类型（Request/Response）划分
 * - 相关的 Schema、Request、Response 类型都放在同一个文件中
 * - 文件名使用 kebab-case，后缀为 .dto.ts
 * 
 * 【命名规范】
 * - Schema: {Operation}{Entity}Schema  (例: CreateExampleSchema)
 * - Request: {Operation}{Entity}Req    (例: CreateExampleReq)
 * - Response: {Operation}{Entity}Res   (例: CreateExampleRes)
 * 
 * 【Zod Schema 设计原则】
 * - 使用 Zod 进行 Runtime Validation
 * - 通过 z.infer 自动推导 TypeScript 类型
 * - Schema 和 Type 成对出现，永远不分离
 */

import { z } from 'zod';
import type { ExampleClientDTO } from '../aggregates';

// ============================================================================
// CREATE Operation
// ============================================================================

/**
 * 创建 Example 请求 Schema
 * 
 * 【设计说明】
 * - 不包含 id: 由后端生成，客户端不应传递
 * - 不包含 status: 新建时默认为 'Draft'，在后端设置
 * - 不包含时间戳: createdAt/updatedAt 由后端自动设置
 * - 使用 .min()/.max() 进行数据验证
 * - 使用 .optional().default() 提供默认值
 * 
 * 【验证规则】
 * - name: 必填，1-256字符
 * - description: 可选，最多2000字符
 * - priority: 可选，1-10的整数，默认5
 * - isPublic: 可选，布尔值，默认false
 */
export const CreateExampleSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(256, '名称不能超过 256 字符'),
  description: z.string().max(2000, '描述不能超过 2000 字符').optional(),
  priority: z.number().int().min(1).max(10).optional().default(5),
  isPublic: z.boolean().optional().default(false),
});

/**
 * 创建 Example 请求类型
 * 
 * 【类型推导】
 * 使用 z.infer<typeof Schema> 从 Zod Schema 自动推导类型
 * 这样确保 Runtime Validation 和 Compile-time Type Check 完全一致
 */
export type CreateExampleReq = z.infer<typeof CreateExampleSchema>;

/**
 * 创建 Example 响应类型
 * 
 * 【响应设计】
 * - 直接返回完整的 DTO 对象
 * - DTO 来自 aggregates 或 entities 层
 * - 避免在 API 层定义内联类型
 */
export type CreateExampleRes = ExampleClientDTO;

// ============================================================================
// UPDATE Operation
// ============================================================================

/**
 * 更新 Example 请求 Schema
 * 
 * 【PATCH 语义】
 * - 所有字段都是可选的（.optional()）
 * - 支持 null 值清空字段（.nullable()）
 * - 只更新传递的字段，未传递的字段保持不变
 * 
 * 【最佳实践】
 * - 使用 PATCH 而非 PUT，避免客户端必须传递所有字段
 * - 区分 undefined（不更新）和 null（清空）
 * - status 使用 enum 限制有效值
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

// ============================================================================
// GET Operation
// ============================================================================

/**
 * 获取单个 Example 请求类型
 * 
 * 【RESTful 设计】
 * - 使用 void 表示无需请求体
 * - ID 通过 URL 路径参数传递（如 GET /api/examples/:id）
 * - 不在 Request Type 中重复定义路径参数
 */
export type GetExampleReq = void;

/**
 * 获取单个 Example 响应类型
 */
export type GetExampleRes = ExampleClientDTO;

// ============================================================================
// DELETE Operation
// ============================================================================

/**
 * 删除 Example 请求类型
 * 
 * 【软删除 vs 硬删除】
 * - 推荐使用软删除（更新 status 为 'Archived'）
 * - 如需硬删除，响应可以是 void
 * - 这里返回删除的对象，方便客户端做撤销操作
 */
export type DeleteExampleReq = void;
export type DeleteExampleRes = ExampleClientDTO;
