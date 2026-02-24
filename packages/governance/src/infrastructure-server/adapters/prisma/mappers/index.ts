/**
 * Prisma Mappers — Barrel Export
 *
 * 每个 mapper 对应一张 Prisma 表：
 * - RulePrismaMapper       ← rule 主表
 * - RuleRevisionPrismaMapper ← rule_revision 分表
 */

export { RulePrismaMapper } from './rule-prisma.mapper';
export { RuleRevisionPrismaMapper } from './rule-revision-prisma.mapper';
