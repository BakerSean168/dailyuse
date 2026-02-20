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
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  DeleteRuleSchema,
  GetRuleSchema,
  ListRulesQuerySchema,
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
  UpdateRuleReq,
  UpdateRuleRes,
} from '../contracts';

// ============ Use Case Port ============

export interface GovernanceUseCases {
  createRule: (req: CreateRuleReq, cx: ExecutionContext) => Promise<Result<CreateRuleRes>>;
  updateRule: (id: string, req: UpdateRuleReq, cx: ExecutionContext) => Promise<Result<UpdateRuleRes>>;
  deleteRule: (req: DeleteRuleReq, cx: ExecutionContext) => Promise<Result<DeleteRuleRes>>;
  getRule: (req: GetRuleReq) => Promise<Result<GetRuleRes>>;
  listRules: (query: ListRulesQuery) => Promise<Result<ListRulesRes>>;
  getRevisions: (query: GetRuleRevisionsQuery) => Promise<Result<GetRuleRevisionsRes>>;
}

export class GovernanceController {
  constructor(private readonly useCases: GovernanceUseCases) {}

  /** Convert standard Context to Governance ExecutionContext */
  private toExecutionContext(ctx: Context): ExecutionContext {
    return { identityId: ctx.identityId as IdentityId };
  }

  async createRule(input: CreateRuleReq, ctx: Context): Promise<Result<CreateRuleRes>> {
    const parsed = CreateRuleSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createRule(parsed.data, this.toExecutionContext(ctx));
  }

  async updateRule(id: string, input: UpdateRuleReq, ctx: Context): Promise<Result<UpdateRuleRes>> {
    const parsed = UpdateRuleSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateRule(id, parsed.data, this.toExecutionContext(ctx));
  }

  async deleteRule(id: string, ctx: Context): Promise<Result<DeleteRuleRes>> {
    const parsed = DeleteRuleSchema.safeParse({ id });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.deleteRule(parsed.data, this.toExecutionContext(ctx));
  }

  async getRuleByCode(code: string): Promise<Result<GetRuleRes>> {
    const parsed = GetRuleSchema.safeParse({ code });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.getRule(parsed.data);
  }

  async getRuleById(id: string): Promise<Result<GetRuleRes>> {
    const parsed = GetRuleSchema.safeParse({ id });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.getRule(parsed.data);
  }

  async listRules(query: ListRulesQuery): Promise<Result<ListRulesRes>> {
    const parsed = ListRulesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.listRules(parsed.data);
  }

  async getRevisions(ruleId: string, query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>> {
    const parsed = GetRuleRevisionsQuerySchema.safeParse({
      ruleId,
      ...query,
    });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.getRevisions(parsed.data);
  }
}
