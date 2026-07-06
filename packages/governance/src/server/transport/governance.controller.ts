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
 * ExecutionContext internally for the application layer.
 * 接受适配器的标准 Context，内部转换为应用层的 ExecutionContext。
 */

import type { Result } from '@dailyuse/contracts/result';
import { error } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import {
  CreateRuleSchema,
  DeleteRuleSchema,
  GetRuleRevisionsQuerySchema,
  GetRuleSchema,
  ListRulesQuerySchema,
  SearchRulesQuerySchema,
  UpdateRuleSchema,
} from '@dailyuse/contracts/governance';
import type {
  CreateRuleRes,
  DeleteRuleReq,
  DeleteRuleRes,
  GetRuleReq,
  GetRuleRevisionsQueryInput,
  GetRuleRevisionsRes,
  GetRuleRes,
  GovernanceUpdateRuleRpcRequest,
  ListRulesQueryInput,
  ListRulesRes,
  SearchRulesQueryInput,
  SearchRulesRes,
  UpdateRuleRes,
} from '@dailyuse/contracts/governance';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { ExecutionContext, GovernanceApplicationPort } from '../application';

/**
 * Thin controller that validates input with Zod schemas and delegates to the
 * transport-neutral governance application port.
 * 使用 Zod 做输入校验，并把调用委托给传输无关的治理应用门面。
 *
 * @param useCases - Callable governance application port shared by HTTP and Electron.
 */
export class GovernanceController {
  constructor(private readonly useCases: GovernanceApplicationPort) {}

  /** Convert standard Context to Governance ExecutionContext */
  private toExecutionContext(ctx: Context): ExecutionContext {
    return { identityId: ctx.identityId as IdentityId };
  }

  async createRule(input: unknown, ctx: Context): Promise<Result<CreateRuleRes>> {
    const parsed = CreateRuleSchema.safeParse(input);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.createRule(parsed.data, this.toExecutionContext(ctx));
  }

  async updateRule(
    input: GovernanceUpdateRuleRpcRequest,
    ctx: Context,
  ): Promise<Result<UpdateRuleRes>> {
    const parsed = UpdateRuleSchema.safeParse(input.body);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.updateRule(input.ruleId, parsed.data, this.toExecutionContext(ctx));
  }

  async updateRuleById(
    ruleId: string,
    input: unknown,
    ctx: Context,
  ): Promise<Result<UpdateRuleRes>> {
    return this.updateRule({ ruleId, body: input } as GovernanceUpdateRuleRpcRequest, ctx);
  }

  async deleteRule(input: DeleteRuleReq, ctx: Context): Promise<Result<DeleteRuleRes>> {
    const parsed = DeleteRuleSchema.safeParse(input);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.deleteRule(parsed.data, this.toExecutionContext(ctx));
  }

  async deleteRuleById(id: string, ctx: Context): Promise<Result<DeleteRuleRes>> {
    return this.deleteRule({ id } as DeleteRuleReq, ctx);
  }

  async getRule(input: GetRuleReq): Promise<Result<GetRuleRes>> {
    const parsed = GetRuleSchema.safeParse(input);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.getRule(parsed.data);
  }

  async getRuleByCode(code: string): Promise<Result<GetRuleRes>> {
    return this.getRule({ code } as GetRuleReq);
  }

  async getRuleById(id: string): Promise<Result<GetRuleRes>> {
    return this.getRule({ id } as GetRuleReq);
  }

  async listRules(query: ListRulesQueryInput = {}): Promise<Result<ListRulesRes>> {
    const parsed = ListRulesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.listRules(parsed.data);
  }

  async searchRules(query: SearchRulesQueryInput, ctx?: Context): Promise<Result<SearchRulesRes>> {
    const parsed = SearchRulesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }

    const executionContext = ctx ? this.toExecutionContext(ctx) : undefined;
    return this.useCases.searchRules(parsed.data, executionContext);
  }

  async getRevisions(query: GetRuleRevisionsQueryInput): Promise<Result<GetRuleRevisionsRes>> {
    const parsed = GetRuleRevisionsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));
    }
    return this.useCases.getRevisions(parsed.data);
  }

  async getRevisionsByRuleId(
    ruleId: string,
    query: Omit<GetRuleRevisionsQueryInput, 'ruleId'>,
  ): Promise<Result<GetRuleRevisionsRes>> {
    return this.getRevisions({ ruleId, ...query } as GetRuleRevisionsQueryInput);
  }
}