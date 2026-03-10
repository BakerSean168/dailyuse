import { Rule } from '../../../../domain-server/aggregates/rule';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleTag } from '../../../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../../../domain-shared/value-objects/code-snippet';
import type { RuleStatus } from '../../../../domain-shared/value-objects/rule-status';
import type { RuleSeverity } from '../../../../domain-shared/value-objects/rule-severity';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import type { CodeSnippetPersistenceDTO } from '../../../../contracts/value-objects/code-snippet';

export interface PowerSyncRuleRow {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  deprecation_reason: string | null;
  replacement_rule_id: string | null;
  live_reference_location: string | null;
  tags: string;
  good_examples: string;
  bad_examples: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface PowerSyncRuleWriteRow extends PowerSyncRuleRow {}

function toDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export class PowerSyncRuleMapper {
  static toDomain(row: PowerSyncRuleRow): Rule {
    const tags = (JSON.parse(row.tags || '[]') as string[]).map((tagValue) => {
      const result = RuleTag.create(tagValue);
      if (!result.ok) throw new Error(`Invalid tag in persistence: ${tagValue}`);
      return result.data;
    });

    const goodExamples = (JSON.parse(row.good_examples || '[]') as CodeSnippetPersistenceDTO[]).map(
      (dto) => CodeSnippet.fromPersistenceDTO(dto),
    );

    const badExamples = (JSON.parse(row.bad_examples || '[]') as CodeSnippetPersistenceDTO[]).map(
      (dto) => CodeSnippet.fromPersistenceDTO(dto),
    );

    return Rule.load({
      id: row.id as RuleId,
      code: row.code,
      title: row.title,
      description: row.description,
      severity: row.severity as RuleSeverity,
      status: row.status as RuleStatus,
      deprecationReason: row.deprecation_reason ?? undefined,
      replacementRuleId: (row.replacement_rule_id as RuleId | null) ?? undefined,
      liveReferenceLocation: row.live_reference_location ?? undefined,
      tags,
      codeSnippets: [...goodExamples, ...badExamples],
      authorId: row.author_id as IdentityId,
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }

  static toPersistence(rule: Rule): PowerSyncRuleWriteRow {
    return {
      id: rule.id,
      code: rule.code,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      status: rule.status,
      deprecation_reason: rule.deprecationReason ?? null,
      replacement_rule_id: rule.replacementRuleId ?? null,
      live_reference_location: rule.liveReferenceLocation ?? null,
      tags: JSON.stringify(rule.tags.map((t) => t.value)),
      good_examples: JSON.stringify(rule.goodExamples.map((s) => s.toPersistenceDTO())),
      bad_examples: JSON.stringify(rule.badExamples.map((s) => s.toPersistenceDTO())),
      author_id: rule.authorId,
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString(),
    };
  }

  static toDomainMany(rows: PowerSyncRuleRow[]): Rule[] {
    return rows.map((row) => PowerSyncRuleMapper.toDomain(row));
  }
}
