/**
 * Governance Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Note: Governance handlers return Result<T> directly, so
 * the controller passes through the Result from the handler.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  DeleteRuleSchema,
  GetRuleSchema,
  ListRulesQuerySchema,
  GetRuleRevisionsQuerySchema,
} from '../contracts';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { GovernanceCrudHandlers } from './routes';
import type { ExecutionContext } from '../application-server';

export class GovernanceController {
  constructor(private readonly handlers: GovernanceCrudHandlers) {}

  async createRule(input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = CreateRuleSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.handlers.createRule(parsed.data, cx);
  }

  async updateRule(id: string, input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = UpdateRuleSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.handlers.updateRule(id, parsed.data, cx);
  }

  async deleteRule(id: string, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = DeleteRuleSchema.safeParse({ id });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.handlers.deleteRule(parsed.data, cx);
  }

  async getRuleByCode(code: string): Promise<Result<unknown>> {
    const parsed = GetRuleSchema.safeParse({ code });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.handlers.getRule(parsed.data);
  }

  async getRuleById(id: string): Promise<Result<unknown>> {
    const parsed = GetRuleSchema.safeParse({ id });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.handlers.getRule(parsed.data);
  }

  async listRules(query: Record<string, unknown>): Promise<Result<unknown>> {
    const parsed = ListRulesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.handlers.listRules(parsed.data);
  }

  async getRevisions(ruleId: string, query: Record<string, unknown>): Promise<Result<unknown>> {
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
    return this.handlers.getRevisions(parsed.data);
  }
}
