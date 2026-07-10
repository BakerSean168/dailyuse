/**
 * ============================================================================
 * Governance Module - Rules API
 * 规则治理模块 - 规则 CRUD 操作
 * ============================================================================
 *
 * 【文件组织原则】
 * - 按业务功能域划分文件，而非按技术类型（Request/Response）划分
 * - 相关的 Schema、Request、Response 类型都放在同一个文件中
 * - 文件名使用 kebab-case
 *
 * 【命名规范】
 * - Schema: {Operation}{Entity}Schema  (例: CreateRuleSchema)
 * - Request: {Operation}{Entity}Req    (例: CreateRuleReq)
 * - Response: {Operation}{Entity}Res   (例: CreateRuleRes)
 *
 * 【Zod Schema 设计原则】
 * - 使用 Zod 进行 Runtime Validation
 * - 通过 z.infer 自动推导 TypeScript 类型
 * - Schema 和 Type 成对出现，永远不分离
 *
 * 【Validation Constants / 验证常量】
 * All validation limits (min/max lengths, array bounds, page sizes) are sourced
 * from GOVERNANCE_VALIDATION_CONFIG and GOVERNANCE_VIEW_CONFIG — the single
 * source of truth. Domain entities mirror these values independently.
 * 所有验证限制（最小/最大长度、数组边界、页面大小）均来自 GOVERNANCE_VALIDATION_CONFIG
 * 和 GOVERNANCE_VIEW_CONFIG — 唯一事实来源。领域实体独立对齐这些值。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { RuleId } from '../primitives/ids';
import type { RuleClientDTO } from '../aggregates/rule-client';
import { RuleStatus } from '../value-objects/rule-status';
import { RuleSeverity } from '../value-objects/rule-severity';
import { Language } from '../value-objects/language';
import { GOVERNANCE_VIEW_CONFIG, GOVERNANCE_VALIDATION_CONFIG } from '../configs/config';

const V = GOVERNANCE_VALIDATION_CONFIG;
const RuleStatusValues = Object.values(RuleStatus);
const RuleSeverityValues = Object.values(RuleSeverity);
const LanguageValues = Object.values(Language);

// ============================================================================
// Shared Sub-Schemas — reusable building blocks. 共享子 Schema — 可复用构建块。
// ============================================================================

/**
 * Code example input schema (for create/update operations).
 * 代码示例输入 Schema（用于创建/更新操作）。
 *
 * Validates language against the Language enum to prevent typos.
 * 使用 Language 枚举验证语言字段，防止拼写错误。
 */
const CodeExampleInputSchema = z.object({
  language: z.enum(LanguageValues, { message: '语言必须是 TypeScript、JSON、YAML 或 Prisma' }),
  content: z.string().min(1, '示例内容不能为空'),
  caption: z
    .string()
    .max(V.CAPTION_MAX_LENGTH, `标题不能超过${V.CAPTION_MAX_LENGTH}字符`)
    .optional(),
});

/**
 * Pagination schema — shared by List, Search, and Revisions queries.
 * 分页 Schema — List、Search、Revisions 查询共用。
 *
 * Defaults are sourced from GOVERNANCE_VIEW_CONFIG (single source of truth).
 * 默认值来自 GOVERNANCE_VIEW_CONFIG（唯一事实来源）。
 *
 * @internal Shared within governance module only. 仅在治理模块内部共享。
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(GOVERNANCE_VIEW_CONFIG.MAX_PAGE_SIZE)
    .optional()
    .default(GOVERNANCE_VIEW_CONFIG.DEFAULT_PAGE_SIZE),
});

// ============================================================================
// CREATE Operation - 创建规则
// ============================================================================

/**
 * 创建规则请求 Schema
 *
 * 【设计说明】
 * - 不包含 id: 由后端生成
 * - 不包含 status: 新建时默认为 'Draft'
 * - 不包含时间戳: createdAt/updatedAt 由后端自动设置
 * - code 必须匹配格式：PREFIX-NUMBER (例如: DDD-001)
 * - 至少需要 1 个 Good Example 和 1 个 Bad Example
 * - 至少需要 1 个标签
 *
 * 【验证规则】
 * - code: 必填，格式 PREFIX-NUMBER
 * - title: 必填，3-100字符
 * - description: 必填，10-5000字符
 * - severity: 必填，Mandatory 或 Recommended
 * - tags: 必填数组，至少1个，每个标签1-50字符
 * - goodExamples: 必填数组，至少1个
 * - badExamples: 必填数组，至少1个
 * - liveReferenceLocation: 可选，最多500字符
 */
export const CreateRuleSchema = z.object({
  code: z.string().regex(V.CODE_PATTERN, '规则编码必须符合格式：PREFIX-NUMBER (例如: DDD-001)'),

  title: z
    .string()
    .min(V.TITLE_MIN_LENGTH, `标题至少${V.TITLE_MIN_LENGTH}个字符`)
    .max(V.TITLE_MAX_LENGTH, `标题不能超过${V.TITLE_MAX_LENGTH}字符`),

  description: z
    .string()
    .min(V.DESCRIPTION_MIN_LENGTH, `描述至少${V.DESCRIPTION_MIN_LENGTH}个字符`)
    .max(V.DESCRIPTION_MAX_LENGTH, `描述不能超过${V.DESCRIPTION_MAX_LENGTH}字符`),

  severity: z.enum(RuleSeverityValues, {
    message: '严重程度必须是 Mandatory 或 Recommended',
  }),

  tags: z.array(z.string().min(1).max(V.TAG_MAX_LENGTH)).min(1, '至少需要1个标签'),

  goodExamples: z.array(CodeExampleInputSchema).min(1, '至少需要1个 Good Example'),

  badExamples: z.array(CodeExampleInputSchema).min(1, '至少需要1个 Bad Example'),

  liveReferenceLocation: z
    .string()
    .max(V.LIVE_REFERENCE_MAX_LENGTH, `实际应用位置不能超过${V.LIVE_REFERENCE_MAX_LENGTH}字符`)
    .optional(),
});

/**
 * 创建规则请求类型
 *
 * 【类型推导】
 * 使用 z.infer<typeof Schema> 从 Zod Schema 自动推导类型
 * 这样确保 Runtime Validation 和 Compile-time Type Check 完全一致
 */
export type CreateRuleReq = z.infer<typeof CreateRuleSchema>;

/**
 * 创建规则响应类型
 *
 * 【响应设计】
 * - 直接返回完整的 RuleClientDTO 对象
 * - DTO 来自 aggregates 层
 */
export type CreateRuleRes = RuleClientDTO;

// ============================================================================
// UPDATE Operation - 更新规则
// ============================================================================

/**
 * 更新规则请求 Schema
 *
 * 【PATCH 语义】
 * - 所有字段都是可选的（.optional()）
 * - 仅更新提供的字段
 * - id 通过 URL 参数传递，不在 body 中
 *
 * 【验证规则】
 * - title: 可选，3-100字符
 * - description: 可选，10-5000字符
 * - severity: 可选，Mandatory 或 Recommended（仅 Draft 规则可变更）
 * - tags: 可选数组，如果提供则至少1个
 * - liveReferenceLocation: 可选，最多500字符
 */
export const UpdateRuleSchema = z.object({
  title: z
    .string()
    .min(V.TITLE_MIN_LENGTH, `标题至少${V.TITLE_MIN_LENGTH}个字符`)
    .max(V.TITLE_MAX_LENGTH, `标题不能超过${V.TITLE_MAX_LENGTH}字符`)
    .optional(),

  description: z
    .string()
    .min(V.DESCRIPTION_MIN_LENGTH, `描述至少${V.DESCRIPTION_MIN_LENGTH}个字符`)
    .max(V.DESCRIPTION_MAX_LENGTH, `描述不能超过${V.DESCRIPTION_MAX_LENGTH}字符`)
    .optional(),

  /** Severity change is only allowed for Draft rules. 仅草稿规则允许变更严重级别。 */
  severity: z
    .enum(RuleSeverityValues, {
      message: '严重程度必须是 Mandatory 或 Recommended',
    })
    .optional(),

  tags: z.array(z.string().min(1).max(V.TAG_MAX_LENGTH)).min(1, '标签列表不能为空').optional(),

  liveReferenceLocation: z
    .string()
    .max(V.LIVE_REFERENCE_MAX_LENGTH, `实际应用位置不能超过${V.LIVE_REFERENCE_MAX_LENGTH}字符`)
    .optional()
    .nullable(), // 允许 null 来清空字段
});

export type UpdateRuleReq = z.infer<typeof UpdateRuleSchema>;

export type UpdateRuleRes = RuleClientDTO;

// ============================================================================
// GET Operation - 获取单个规则
// ============================================================================

/**
 * 获取规则请求 Schema
 *
 * 【设计说明】
 * - id 通过 URL 参数传递
 * - 可选择通过 code 查询
 */
export const GetRuleSchema = z
  .object({
    id: brandedId<RuleId>().optional(),
    code: z
      .string()
      .regex(/^[A-Z]+-[0-9]+$/)
      .optional(),
  })
  .refine((data) => data.id || data.code, {
    message: '必须提供 id 或 code',
  });

export type GetRuleReq = z.infer<typeof GetRuleSchema>;

export type GetRuleRes = RuleClientDTO;

// ============================================================================
// DELETE Operation - 删除规则
// ============================================================================

/**
 * 删除规则请求 Schema
 *
 * 【设计说明】
 * - id 通过 URL 参数传递
 */
export const DeleteRuleSchema = z.object({
  id: brandedId<RuleId>(),
});

export type DeleteRuleReq = z.infer<typeof DeleteRuleSchema>;

export type DeleteRuleRes = { success: boolean };

// ============================================================================
// LIST Operation - 列出规则
// ============================================================================

/**
 * 列出规则查询 Schema
 *
 * 【查询参数】
 * - status: 按状态过滤（Draft, Active, Deprecated）
 * - tags: 按标签过滤（AND 逻辑）
 * - severity: 按严重程度过滤
 * - page: 页码（从1开始）
 * - pageSize: 每页数量（默认20）
 */
export const ListRulesQuerySchema = z
  .object({
    status: z.enum(RuleStatusValues).optional(),
    tags: z.array(z.string()).optional(),
    severity: z.enum(RuleSeverityValues).optional(),
  })
  .merge(PaginationSchema);

export type ListRulesQuery = z.infer<typeof ListRulesQuerySchema>;

/**
 * List query input type (before Zod defaults are applied). page/pageSize are optional.
 * 列表查询输入类型（Zod 默认值应用前）。page/pageSize 为可选。
 */
export type ListRulesQueryInput = z.input<typeof ListRulesQuerySchema>;

export type ListRulesRes = {
  items: RuleClientDTO[];
  total: number;
  page: number;
  pageSize: number;
};

// ============================================================================
// SEARCH Operation - 搜索规则
// ============================================================================

/**
 * 搜索规则查询 Schema
 *
 * 【查询参数】
 * - query: 关键词搜索（标题、描述、标签）
 * - status: 按状态过滤
 * - tags: 按标签过滤
 * - severity: 按严重程度过滤
 * - page: 页码
 * - pageSize: 每页数量
 */
export const SearchRulesQuerySchema = z
  .object({
    query: z.string().min(1, '搜索关键词不能为空'),
    status: z.enum(RuleStatusValues).optional(),
    tags: z.array(z.string()).optional(),
    severity: z.enum(RuleSeverityValues).optional(),
  })
  .merge(PaginationSchema);

/**
 * Search query input type (before Zod defaults are applied). page/pageSize are optional.
 * 搜索查询输入类型（Zod 默认值应用前）。page/pageSize 为可选。
 */
export type SearchRulesQueryInput = z.input<typeof SearchRulesQuerySchema>;

export type SearchRulesQuery = z.infer<typeof SearchRulesQuerySchema>;

export type SearchRulesRes = {
  items: RuleClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  /** 搜索用时（毫秒） */
  searchTime: number;
};
