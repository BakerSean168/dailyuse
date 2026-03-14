/**
 * Rule DTO-to-State Mapper.
 * 规则 DTO 到状态的映射器。
 *
 * Converts RuleClientDTO from API responses into domain state for Rule.load().
 * 将 API 响应中的 RuleClientDTO 转换为领域状态供 Rule.load() 使用。
 *
 * @internal Mapper helper — consumers should use RuleClientService instead.
 * @internal 映射器辅助函数 — 消费者应使用 RuleClientService。
 */

import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import { Rule } from '../../domain-client/aggregates/rule';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';

/**
 * Converts a RuleClientDTO to a client-side Rule aggregate.
 * 将 RuleClientDTO 转换为客户端 Rule 聚合根。
 *
 * @internal
 */
export function ruleFromDTO(dto: RuleClientDTO): Rule {
  return Rule.load({
    id: dto.id,
    code: dto.code,
    title: dto.title,
    description: dto.description,
    severity: dto.severity,
    status: dto.status,
    deprecationReason: dto.deprecationReason,
    replacementRuleId: dto.replacementRuleId,
    liveReferenceLocation: dto.liveReferenceLocation,
    tags: dto.tags.map((t) => RuleTag.fromDTO(t)),
    codeSnippets: [
      ...dto.goodExamples.map((e) => {
        const result = CodeSnippet.fromDTO(e);
        if (!result.ok) throw new Error(`Invalid good-example in DTO: ${result.error.message}`);
        return result.data;
      }),
      ...dto.badExamples.map((e) => {
        const result = CodeSnippet.fromDTO(e);
        if (!result.ok) throw new Error(`Invalid bad-example in DTO: ${result.error.message}`);
        return result.data;
      }),
    ],
    authorId: dto.authorId,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  });
}
