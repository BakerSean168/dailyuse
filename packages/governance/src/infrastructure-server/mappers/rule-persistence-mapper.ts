/**
 * RulePersistenceMapper - Prisma ↔ Domain Conversion
 * 规则持久化映射器 - Prisma与领域对象转换
 * 
 * Converts between:
 * - Prisma Rule model ↔ Rule domain aggregate
 * - Handles JSON serialization/deserialization for complex fields
 * 
 * Responsibilities:
 * - Type-safe conversion between Prisma and domain models
 * - JSON parsing for tags, code snippets
 * - Value object reconstruction
 * - Date handling
 */

import type { Rule as PrismaRule } from '@dailyuse/database';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { Rule } from '../../domain-server/aggregates/rule';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import { RuleTag } from '../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../domain-shared/value-objects/code-snippet';
import type { RuleStatus } from '../../domain-shared/value-objects/rule-status';
import type { RuleSeverity } from '../../domain-shared/value-objects/rule-severity';
import type { CodeSnippetPersistenceDTO } from '../../contracts/value-objects/code-snippet';

/**
 * Rule Persistence Mapper
 * 
 * Static utility class for mapping between Prisma and domain
 */
export class RulePersistenceMapper {
  /**
   * Converts Prisma Rule model to Domain aggregate
   * 
   * Used when loading rules from database
   */
  static toDomain(prismaRule: PrismaRule): Rule {
    // Parse JSON fields
    const tags = JSON.parse(prismaRule.tags) as string[];
    const goodExamplesJson = JSON.parse(prismaRule.goodExamples) as CodeSnippetPersistenceDTO[];
    const badExamplesJson = JSON.parse(prismaRule.badExamples) as CodeSnippetPersistenceDTO[];

    // Reconstruct value objects
    const tagObjects = tags.map(tagValue => {
      const result = RuleTag.create(tagValue);
      if (!result.ok) {
        throw new Error(`Invalid tag in database: ${tagValue}`);
      }
      return result.data;
    });

    const goodExamples = goodExamplesJson.map(dto => {
      return CodeSnippet.fromPersistenceDTO(dto);
    });

    const badExamples = badExamplesJson.map(dto => {
      return CodeSnippet.fromPersistenceDTO(dto);
    });

    const codeSnippets = [...goodExamples, ...badExamples];

    // Restore Rule aggregate from persistence
    return Rule.fromPersistence({
      id: prismaRule.id as RuleId,
      code: prismaRule.code,
      title: prismaRule.title,
      description: prismaRule.description,
      severity: prismaRule.severity as RuleSeverity,
      status: prismaRule.status as RuleStatus,
      deprecationReason: prismaRule.deprecationReason ?? undefined,
      replacementRuleId: prismaRule.replacementRuleId as RuleId | undefined,
      liveReferenceLocation: prismaRule.liveReferenceLocation ?? undefined,
      tags: tagObjects,
      codeSnippets,
      authorId: prismaRule.authorId as IdentityId,
      createdAt: prismaRule.createdAt,
      updatedAt: prismaRule.updatedAt,
    });
  }

  /**
   * Converts Domain aggregate to Prisma model format
   * 
   * Used when saving rules to database
   */
  static toPrisma(rule: Rule): Omit<PrismaRule, 'createdAt' | 'updatedAt'> {
    const persistenceDTO = rule.toPersistenceDTO();

    return {
      id: persistenceDTO.id,
      code: persistenceDTO.code,
      title: persistenceDTO.title,
      description: persistenceDTO.description,
      severity: persistenceDTO.severity,
      status: persistenceDTO.status,
      deprecationReason: persistenceDTO.deprecationReason,
      replacementRuleId: persistenceDTO.replacementRuleId,
      liveReferenceLocation: persistenceDTO.liveReferenceLocation,
      tags: persistenceDTO.tags, // Already JSON string
      goodExamples: persistenceDTO.goodExamples, // Already JSON string
      badExamples: persistenceDTO.badExamples, // Already JSON string
      authorId: persistenceDTO.authorId,
      // createdAt and updatedAt handled by Prisma
    };
  }

  /**
   * Bulk conversion helper
   */
  static toDomainMany(prismaRules: PrismaRule[]): Rule[] {
    return prismaRules.map(prismaRule => RulePersistenceMapper.toDomain(prismaRule));
  }
}
