/**
 * Create Rule Use Case
 * 创建规则用例
 */

import type { IRuleRepository } from '../../domain-server/repositories/i-rule-repository';
import { Rule } from '../../domain-server/aggregates/rule';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { CreateRuleReq, CreateRuleRes } from '@/contracts/api';
import type { RuleClientDTO } from '@/contracts/aggregates';
import type { IdentityId } from '@dailyuse/contracts/primitives';

/**
 * Execution Context
 * 执行上下文 - 由中间件从 token 中提取
 */
export interface ExecutionContext {
  identityId: IdentityId;
}

/**
 * Create Rule Use Case
 * 
 * Dependencies injected via constructor (standard dependency injection)
 */
export class CreateRuleUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Creates new rule in Draft status
   * 
   * @param req - Create rule request from API
   * @param cx - Execution context with identityId from auth middleware
   * 
   * Flow:
   * 1. Check for duplicate code
   * 2. Create Rule aggregate via factory method
   * 3. Persist to repository
   * 4. Convert to RuleClientDTO and return
   */
  async execute(req: CreateRuleReq, cx: ExecutionContext): Promise<Result<CreateRuleRes>> {
    // Check for duplicate code
    const existingResult = await this.ruleRepository.findByCode(req.code);
    if (!existingResult.ok) {
      return existingResult as any;
    }

    if (existingResult.data !== null) {
      return error('CONFLICT', `Rule with code '${req.code}' already exists`);
    }

    // Create Rule aggregate
    const ruleResult = Rule.create({
      code: req.code,
      title: req.title,
      description: req.description,
      severity: req.severity as any,
      tags: req.tags,
      goodExamples: req.goodExamples.map((ex: { language: string; content: string; caption?: string }) => ({
        language: ex.language,
        content: ex.content,
        caption: ex.caption ?? undefined,
      })),
      badExamples: req.badExamples.map((ex: { language: string; content: string; caption?: string }) => ({
        language: ex.language,
        content: ex.content,
        caption: ex.caption ?? undefined,
      })),
      liveReferenceLocation: req.liveReferenceLocation ?? undefined,
      authorId: cx.identityId,
    });

    if (!ruleResult.ok) {
      return ruleResult as any;
    }

    const rule = ruleResult.data;

    // Persist to repository
    const saveResult = await this.ruleRepository.save(rule);
    if (!saveResult.ok) {
      return saveResult as any;
    }

    // Convert to ClientDTO and return
    const dto: RuleClientDTO = {
      id: rule.id,
      code: rule.code,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      status: rule.status,
      deprecationReason: rule.deprecationReason,
      replacementRuleId: rule.replacementRuleId,
      liveReferenceLocation: rule.liveReferenceLocation,
      tags: rule.tags.map(tag => tag.toDTO()),
      goodExamples: rule.goodExamples.map(ex => ex.toDTO()),
      badExamples: rule.badExamples.map(ex => ex.toDTO()),
      authorId: rule.authorId,
      createdAt: rule.createdAt.getTime(),
      updatedAt: rule.updatedAt.getTime(),
    };

    return ok(dto);
  }
}
