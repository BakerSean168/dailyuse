/**
 * RulePrismaMapper — Bidirectional mapping between Prisma Rule rows and domain Rule aggregate.
 * RulePrismaMapper —— Prisma Rule 行数据与领域 Rule 聚合根之间的双向映射。
 *
 * Responsibilities:
 * 职责：
 * - toDomain: PrismaRule → Rule aggregate (deserialize JSON fields, restore value objects)
 *   toDomain: PrismaRule → Rule 聚合根（反序列化 JSON 字段，重建值对象）
 * - toPersistence: Rule → Prisma write format (serialize value objects to JSON strings)
 *   toPersistence: Rule → Prisma 写入格式（将值对象序列化为 JSON 字符串）
 * - JSON serialization for tags, goodExamples, badExamples (stored as TEXT in SQLite)
 *   标签、goodExamples、badExamples 的 JSON 序列化（SQLite 中存储为 TEXT）
 *
 * SQLite compatibility notes:
 * SQLite 兼容性说明：
 * - DateTime fields: Prisma returns JS Date objects on both PostgreSQL and SQLite drivers
 *   DateTime 字段：Prisma 在 PostgreSQL 和 SQLite 驱动下都返回 JS Date 对象
 * - JSON fields: stored as TEXT, deserialized via parseJson with typed fallback
 *   JSON 字段：存储为 TEXT，通过 parseJson 带类型化回退值反序列化
 *
 * @internal Persistence mapper — not part of the public API.
 * @internal 持久化映射器 — 非公开 API。
 */

import type { Rule as PrismaRule } from '@dailyuse/database';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { Rule } from '@/server/domain/aggregates/rule';
import { RuleId } from '@/server/domain/value-objects/rule-id';
import { RuleTag } from '@/server/domain/value-objects/rule-tag';
import { CodeSnippet } from '@/server/domain/value-objects/code-snippet';
import type { RuleStatus } from '@/server/domain/value-objects/rule-status';
import type { RuleSeverity } from '@/server/domain/value-objects/rule-severity';
import type { CodeSnippetPersistenceDTO } from '@/server/domain/value-objects/code-snippet';
import { fromDbDate, parseJson } from '@dailyuse/utils/shared';

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/** Converts between Prisma Rule rows and domain Rule aggregates. */
export class RulePrismaMapper {
  /**
   * Converts a Prisma row to a domain Rule aggregate.
   * 将 Prisma 行数据转换为领域 Rule 聚合根。
   *
   * Deserializes JSON fields (tags, goodExamples, badExamples) and
   * reconstructs value objects (RuleTag, CodeSnippet).
   * 反序列化 JSON 字段（tags、goodExamples、badExamples）并重建值对象。
   *
   * @param raw - Prisma Rule row from database 从数据库获取的 Prisma Rule 行数据
   * @returns Hydrated Rule domain aggregate 水合后的 Rule 领域聚合根
   * @throws If tag values or code snippets in the database are invalid
   *         如果数据库中的标签值或代码片段无效则抛出异常
   */
  static toDomain(raw: PrismaRule): Rule {
    const tags = parseJson<string[]>(raw.tags, []);
    const goodExamplesJson = parseJson<CodeSnippetPersistenceDTO[]>(raw.goodExamples, []);
    const badExamplesJson = parseJson<CodeSnippetPersistenceDTO[]>(raw.badExamples, []);

    const tagObjects = tags.map((tagValue) => {
      const result = RuleTag.create(tagValue);
      if (!result.ok) {
        throw new Error(`Invalid tag in database: ${tagValue}`);
      }
      return result.data;
    });

    const codeSnippets = [
      ...goodExamplesJson.map((dto) => {
        const result = CodeSnippet.fromPersistenceDTO(dto);
        if (!result.ok)
          throw new Error(`Invalid good-example in database: ${result.error.message}`);
        return result.data;
      }),
      ...badExamplesJson.map((dto) => {
        const result = CodeSnippet.fromPersistenceDTO(dto);
        if (!result.ok) throw new Error(`Invalid bad-example in database: ${result.error.message}`);
        return result.data;
      }),
    ];

    return Rule.load({
      id: raw.id as RuleId,
      code: raw.code,
      title: raw.title,
      description: raw.description,
      severity: raw.severity as RuleSeverity,
      status: raw.status as RuleStatus,
      deprecationReason: raw.deprecationReason ?? undefined,
      replacementRuleId: raw.replacementRuleId as RuleId | undefined,
      liveReferenceLocation: raw.liveReferenceLocation ?? undefined,
      tags: tagObjects,
      codeSnippets,
      authorId: raw.authorId as IdentityId,
      createdAt: fromDbDate(raw.createdAt),
      updatedAt: fromDbDate(raw.updatedAt),
    });
  }

  /**
   * Converts a domain Rule aggregate to Prisma write format.
   * 将领域 Rule 聚合根转换为 Prisma 写入格式。
   *
   * Excludes createdAt / updatedAt (managed by caller or Prisma).
   * 排除 createdAt / updatedAt（由调用方或 Prisma 自动管理）。
   *
   * @param rule - Domain Rule aggregate 领域 Rule 聚合根
   * @returns Object suitable for Prisma create/update operations
   *          适用于 Prisma create/update 操作的对象
   */
  static toPersistence(rule: Rule): Omit<PrismaRule, 'createdAt' | 'updatedAt'> {
    return {
      id: rule.id,
      code: rule.code,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      status: rule.status,
      deprecationReason: rule.deprecationReason ?? null,
      replacementRuleId: rule.replacementRuleId ?? null,
      liveReferenceLocation: rule.liveReferenceLocation ?? null,
      tags: JSON.stringify(rule.tags.map((tag) => tag.value)),
      goodExamples: JSON.stringify(rule.goodExamples.map((s) => s.toPersistenceDTO())),
      badExamples: JSON.stringify(rule.badExamples.map((s) => s.toPersistenceDTO())),
      authorId: rule.authorId,
    };
  }

  /** Batch converts multiple rows to domain aggregates. 批量将多行数据转换为领域聚合根。 */
  static toDomainMany(raws: PrismaRule[]): Rule[] {
    return raws.map((raw) => RulePrismaMapper.toDomain(raw));
  }
}
