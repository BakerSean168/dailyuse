/**
 * Rule DTO-to-State Mapper
 * 
 * Converts RuleClientDTO from API responses into domain state for Rule.load()
 */

import type { RuleClientDTO } from '@/contracts/aggregates/rule-client';
import { Rule } from '../../domain-client/aggregates/rule';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';

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
    tags: dto.tags.map(t => RuleTag.fromDTO(t)),
    codeSnippets: [
      ...dto.goodExamples.map(e => CodeSnippet.fromDTO(e)),
      ...dto.badExamples.map(e => CodeSnippet.fromDTO(e)),
    ],
    authorId: dto.authorId,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  });
}
