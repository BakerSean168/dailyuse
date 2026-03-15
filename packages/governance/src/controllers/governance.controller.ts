/**
 * Governance Controller
 * 治理控制器
 *
 * Encapsulates Zod validation and use case orchestration.
 * 封装 Zod 验证和用例编排。
 *
 * Shared by both Express (HTTP) and IPC transport layers.
 * 供 Express（HTTP）和 IPC 传输层共用。
 *
 * Accepts standard Context from the adapter and converts to
 * ExecutionContext internally for the domain layer.
 * 接受适配器的标准 Context，内部转换为领域层的 ExecutionContext。
 */

import type { Result } from '@dailyuse/contracts/result';
import { error } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  DeleteRuleSchema,
  GetRuleSchema,
  ListRulesQuerySchema,
  SearchRulesQuerySchema,
  GetRuleRevisionsQuerySchema,
} from '../contracts';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { ExecutionContext } from '../application-server';
import type {
  CreateRuleReq,
  CreateRuleRes,
  DeleteRuleReq,
  DeleteRuleRes,
  GetRuleReq,
  GetRuleRes,
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
  ListRulesQuery,
  ListRulesRes,
  SearchRulesQuery,
  SearchRulesQueryInput,
  SearchRulesRes,
  UpdateRuleReq,
  UpdateRuleRes,
} from '../contracts';

// ============ Use Case Port ============

/**
 * Use case port — contract for the controller's use case dependencies.
 * 用例端口 — 控制器用例依赖的契约。
 *
 * @internal Controller implementation detail. 控制器实现细节。
 */
export interface GovernanceUseCases {
  /** Creates a new rule. 创建新规则。 */
  createRule: (req: CreateRuleReq, cx: ExecutionContext) => Promise<Result<CreateRuleRes>>;
  /** Updates an existing rule. 更新已有规则。 */
  updateRule: (
    id: string,
    req: UpdateRuleReq,
    cx: ExecutionContext,
  ) => Promise<Result<UpdateRuleRes>>;
  /** Deletes a rule (soft or hard). 删除规则（软删除或硬删除）。 */
  deleteRule: (req: DeleteRuleReq, cx: ExecutionContext) => Promise<Result<DeleteRuleRes>>;
  /** Gets a single rule by ID or code. 根据 ID 或代码获取单个规则。 */
  getRule: (req: GetRuleReq) => Promise<Result<GetRuleRes>>;
  /** Lists rules with optional filters and pagination. 列出规则（可选筛选和分页）。 */
  listRules: (query: ListRulesQuery) => Promise<Result<ListRulesRes>>;
  /** Searches rules by keyword with relevance scoring. 按关键词搜索规则（含相关性评分）。 */
  searchRules: (
    req: SearchRulesQueryInput,
    cx?: ExecutionContext,
  ) => Promise<Result<SearchRulesRes>>;
  /** Gets revision history for a rule. 获取规则的修订历史。 */
  getRevisions: (query: GetRuleRevisionsQuery) => Promise<Result<GetRuleRevisionsRes>>;
}

export class GovernanceController {
  constructor(private readonly useCases: GovernanceUseCases) {}

  private normalizeRuleMutationError<T>(result: Result<T>): Result<T> {
    if (result.ok) {
      return result;
    }

    const message = result.error.message ?? '';

    if (result.error.code === 'CONFLICT' && /code|duplicate|exists/i.test(message)) {
      return error('DUPLICATE_CODE', '规则编码重复，请使用唯一 code', result.error.details);
    }

    if (
      (result.error.code === 'BUSINESS_ERROR' || result.error.code === 'VALIDATION_ERROR') &&
      /transition|cannot transition|deprecat|reactivat|draft|active|status/i.test(message)
    ) {
      return error('INVALID_TRANSITION', '规则状态流转不合法', [
        { code: 'INVALID_TRANSITION', message: message },
        ...(result.error.details ?? []),
      ]);
    }

    return result;
  }

  /** Convert standard Context to Governance ExecutionContext */
  private toExecutionContext(ctx: Context): ExecutionContext {
    return { identityId: ctx.identityId as IdentityId };
  }

  async createRule(input: unknown, ctx: Context): Promise<Result<CreateRuleRes>> {
    const parsed = CreateRuleSchema.safeParse(input);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.normalizeRuleMutationError(
      await this.useCases.createRule(parsed.data, this.toExecutionContext(ctx)),
    );
  }

  async updateRule(id: string, input: unknown, ctx: Context): Promise<Result<UpdateRuleRes>> {
    const parsed = UpdateRuleSchema.safeParse(input);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.normalizeRuleMutationError(
      await this.useCases.updateRule(id, parsed.data, this.toExecutionContext(ctx)),
    );
  }

  async deleteRule(id: string, ctx: Context): Promise<Result<DeleteRuleRes>> {
    const parsed = DeleteRuleSchema.safeParse({ id });
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.deleteRule(parsed.data, this.toExecutionContext(ctx));
  }

  async getRuleByCode(code: string): Promise<Result<GetRuleRes>> {
    const parsed = GetRuleSchema.safeParse({ code });
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.getRule(parsed.data);
  }

  async getRuleById(id: string): Promise<Result<GetRuleRes>> {
    const parsed = GetRuleSchema.safeParse({ id });
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.getRule(parsed.data);
  }

  async listRules(query: ListRulesQuery): Promise<Result<ListRulesRes>> {
    const parsed = ListRulesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.listRules(parsed.data);
  }

  async searchRules(query: SearchRulesQuery, ctx?: Context): Promise<Result<SearchRulesRes>> {
    const parsed = SearchRulesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }

    const executionContext = ctx ? this.toExecutionContext(ctx) : undefined;
    return this.useCases.searchRules(parsed.data, executionContext);
  }

  async getRevisions(
    ruleId: string,
    query: Omit<GetRuleRevisionsQuery, 'ruleId'>,
  ): Promise<Result<GetRuleRevisionsRes>> {
    const parsed = GetRuleRevisionsQuerySchema.safeParse({
      ruleId,
      ...query,
    });
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.getRevisions(parsed.data);
  }
}
