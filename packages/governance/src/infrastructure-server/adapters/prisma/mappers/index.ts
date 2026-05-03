/**
 * Prisma Mappers — Barrel Export.
 * Prisma 映射器 —— 统一导出。
 *
 * Each mapper handles bidirectional conversion for one Prisma table:
 * 每个映射器负责一张 Prisma 表的双向转换：
 * - RulePrismaMapper          ← rule table / 规则主表
 * - RuleRevisionPrismaMapper  ← rule_revision table / 规则修订版本分表
 *
 * @internal Mapper classes are persistence implementation details.
 * @internal 映射器类为持久化实现细节。
 */

export { RulePrismaMapper } from './rule-prisma.mapper';
export { RuleRevisionPrismaMapper } from './rule-revision-prisma.mapper';
