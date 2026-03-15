/**
 * Create Rule Use Case
 * 创建规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { IRuleRevisionRepository } from '@/domain-server/repositories/i-rule-revision-repository';
import { Rule } from '@/domain-server/aggregates/rule';
import { RuleRevision } from '@/domain-server/entities/rule-revision';
import { ChangeType } from '@/domain-shared/value-objects/change-type';
import { RuleSeverity } from '@/domain-shared/value-objects/rule-severity';
import { Language } from '@/domain-shared/value-objects/language';
import type { Language as RuleLanguage } from '@/domain-shared/value-objects/language';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { CreateRuleReq, CreateRuleRes } from '../../../contracts/api/rules';
import type { ExecutionContext } from '../execution-context';

/**
 * Create Rule Use Case.
 * 创建规则用例。
 *
 * Dependencies injected via constructor (standard dependency injection).
 * 通过构造函数注入依赖（标准依赖注入）。
 */
export class CreateRuleUseCase {
  constructor(
    private readonly ruleRepository: IRuleRepository,
    private readonly revisionRepository: IRuleRevisionRepository,
  ) {}

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
      return error(
        existingResult.error.code,
        existingResult.error.message,
        existingResult.error.details,
      );
    }

    if (existingResult.data !== null) {
      return error('DUPLICATE_CODE', `Rule with code '${req.code}' already exists`);
    }

    const severityResult = RuleSeverity.create(req.severity);
    if (!severityResult.ok) {
      return error(
        severityResult.error.code,
        severityResult.error.message,
        severityResult.error.details,
      );
    }

    const goodExamples: Array<{ language: RuleLanguage; content: string; caption?: string }> = [];
    for (const example of req.goodExamples) {
      const languageResult = Language.create(example.language);
      if (!languageResult.ok) {
        return error(
          languageResult.error.code,
          languageResult.error.message,
          languageResult.error.details,
        );
      }

      goodExamples.push({
        language: languageResult.data,
        content: example.content,
        caption: example.caption ?? undefined,
      });
    }

    const badExamples: Array<{ language: RuleLanguage; content: string; caption?: string }> = [];
    for (const example of req.badExamples) {
      const languageResult = Language.create(example.language);
      if (!languageResult.ok) {
        return error(
          languageResult.error.code,
          languageResult.error.message,
          languageResult.error.details,
        );
      }

      badExamples.push({
        language: languageResult.data,
        content: example.content,
        caption: example.caption ?? undefined,
      });
    }

    // Create Rule aggregate
    const ruleResult = Rule.create({
      code: req.code,
      title: req.title,
      description: req.description,
      severity: severityResult.data,
      tags: req.tags,
      goodExamples,
      badExamples,
      liveReferenceLocation: req.liveReferenceLocation ?? undefined,
      authorId: cx.identityId,
    });

    if (!ruleResult.ok) {
      return error(ruleResult.error.code, ruleResult.error.message, ruleResult.error.details);
    }

    const rule = ruleResult.data;

    const revisionCountResult = await this.revisionRepository.countByRuleId(rule.id);
    if (!revisionCountResult.ok) {
      return error(
        revisionCountResult.error.code,
        revisionCountResult.error.message,
        revisionCountResult.error.details,
      );
    }

    const revision = RuleRevision.create({
      ruleId: rule.id,
      revisionNumber: revisionCountResult.data + 1,
      authorId: cx.identityId,
      changedFields: [
        'code',
        'title',
        'description',
        'severity',
        'status',
        'tags',
        'goodExamples',
        'badExamples',
        'liveReferenceLocation',
      ],
      previousValues: {},
      newValues: {
        code: rule.code,
        title: rule.title,
        description: rule.description,
        severity: rule.severity,
        status: rule.status,
        tags: rule.tags.map((tag) => tag.toDTO()),
        goodExamples: rule.goodExamples.map((example) => example.toDTO()),
        badExamples: rule.badExamples.map((example) => example.toDTO()),
        liveReferenceLocation: rule.liveReferenceLocation,
      },
      changeType: ChangeType.Created,
    });

    if (!revision.ok) {
      return error(revision.error.code, revision.error.message, revision.error.details);
    }

    // Persist rule + revision atomically
    const saveResult = await this.ruleRepository.saveWithRevision(rule, revision.data);
    if (!saveResult.ok) {
      return error(saveResult.error.code, saveResult.error.message, saveResult.error.details);
    }

    // Convert to ClientDTO and return
    return ok(rule.toClientDTO());
  }
}
