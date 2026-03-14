/**
 * Governance Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Accepts standard Context from the adapter and converts to
 * ExecutionContext internally for the domain layer.
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

export interface GovernanceUseCases {
  createRule: (req: CreateRuleReq, cx: ExecutionContext) => Promise<Result<CreateRuleRes>>;
  updateRule: (
    id: string,
    req: UpdateRuleReq,
    cx: ExecutionContext,
  ) => Promise<Result<UpdateRuleRes>>;
  deleteRule: (req: DeleteRuleReq, cx: ExecutionContext) => Promise<Result<DeleteRuleRes>>;
  getRule: (req: GetRuleReq) => Promise<Result<GetRuleRes>>;
  listRules: (query: ListRulesQuery) => Promise<Result<ListRulesRes>>;
  searchRules: (
    req: SearchRulesQueryInput,
    cx?: ExecutionContext,
  ) => Promise<Result<SearchRulesRes>>;
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
