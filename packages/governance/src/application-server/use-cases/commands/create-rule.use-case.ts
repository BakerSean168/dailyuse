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
import { toResultErrorException, unwrapOrThrowError } from '@dailyuse/contracts/result';
import { resultify } from '@dailyuse/utils/result';
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
    return resultify(async () => {
      const existingRule = await this.ruleRepository.findByCode(req.code);
      if (existingRule !== null) {
        throw toResultErrorException(
          { code: 'DUPLICATE_CODE', message: `Rule with code '${req.code}' already exists` },
          409,
        );
      }

      const severity = unwrapOrThrowError(RuleSeverity.create(req.severity));

      const goodExamples: Array<{ language: RuleLanguage; content: string; caption?: string }> = [];
      for (const example of req.goodExamples) {
        const language = unwrapOrThrowError(Language.create(example.language));
        goodExamples.push({
          language,
          content: example.content,
          caption: example.caption ?? undefined,
        });
      }

      const badExamples: Array<{ language: RuleLanguage; content: string; caption?: string }> = [];
      for (const example of req.badExamples) {
        const language = unwrapOrThrowError(Language.create(example.language));
        badExamples.push({
          language,
          content: example.content,
          caption: example.caption ?? undefined,
        });
      }

      const rule = unwrapOrThrowError(
        Rule.create({
          code: req.code,
          title: req.title,
          description: req.description,
          severity,
          tags: req.tags,
          goodExamples,
          badExamples,
          liveReferenceLocation: req.liveReferenceLocation ?? undefined,
          authorId: cx.identityId,
        }),
      );

      const revisionCount = await this.revisionRepository.countByRuleId(rule.id);
      const revision = unwrapOrThrowError(
        RuleRevision.create({
          ruleId: rule.id,
          revisionNumber: revisionCount + 1,
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
        }),
      );

      await this.ruleRepository.saveWithRevision(rule, revision);
      return rule.toClientDTO();
    }, 'Failed to create rule');
  }
}
