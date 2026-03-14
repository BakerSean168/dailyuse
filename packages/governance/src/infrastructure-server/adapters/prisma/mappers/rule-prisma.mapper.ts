/**
 * RulePrismaMapper — Prisma ↔ Domain 转换
 *
 * 职责：
 * - Rule 主表（PrismaRule）与 Rule 领域聚合根之间的双向映射
 * - JSON 字段的序列化 / 反序列化（tags、goodExamples、badExamples）
 * - SQLite 兼容：日期字段统一使用 toSqliteDate / fromSqliteDate 处理，
 *   Prisma 在 SQLite 下返回的 DateTime 已是 JS Date，但 JSON.stringify 对
 *   Date 无损，因此写入时统一转为 ISO 字符串以保证跨驱动一致性。
 *
 * 不负责：
 * - 子实体 RuleRevision 的映射（见 rule-revision-prisma.mapper.ts）
 * - 数据库查询逻辑
 */

import type { Rule as PrismaRule } from '@dailyuse/database';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { Rule } from '../../../../domain-server/aggregates/rule';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleTag } from '../../../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../../../domain-shared/value-objects/code-snippet';
import type { RuleStatus } from '../../../../domain-shared/value-objects/rule-status';
import type { RuleSeverity } from '../../../../domain-shared/value-objects/rule-severity';
import type { CodeSnippetPersistenceDTO } from '../../../../domain-shared/value-objects/code-snippet';

// ---------------------------------------------------------------------------
// SQLite 兼容帮助函数
// ---------------------------------------------------------------------------

/**
 * 从数据库字段安全地还原 Date。
 *
 * SQLite 通过 Prisma 返回的 DateTime 已是 JS Date，但如果原始值来自
 * 手动插入的 ISO 字符串（seed / 测试固件），Prisma 有时会以 string 返回。
 * 统一处理两种情况，避免 Invalid Date。
 */
function fromDbDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`Invalid date from DB: ${String(value)}`);
  return d;
}

/**
 * 将 JSON 字段字符串安全反序列化。
 * SQLite 不支持原生 JSON 类型，Prisma 以 String 列存储，此处统一处理。
 */
function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export class RulePrismaMapper {
  /**
   * Prisma Rule → Domain Rule 聚合根
   *
   * 用于从数据库加载规则。
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
      ...goodExamplesJson.map((dto) => CodeSnippet.fromPersistenceDTO(dto)),
      ...badExamplesJson.map((dto) => CodeSnippet.fromPersistenceDTO(dto)),
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
   * Domain Rule 聚合根 → Prisma 写入格式
   *
   * 排除 createdAt / updatedAt（由调用方或 Prisma 自动管理）。
   *
   * SQLite 注意事项：tags / goodExamples / badExamples 以 JSON 字符串写入，
   * Prisma 映射为 String 列，查询时使用 contains 做字符串匹配。
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

  /** 批量转换（read-side 常用） */
  static toDomainMany(raws: PrismaRule[]): Rule[] {
    return raws.map((raw) => RulePrismaMapper.toDomain(raw));
  }
}
