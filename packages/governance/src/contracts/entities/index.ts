/**
 * Governance Module - Entities Export
 * 规则治理模块 - 实体导出
 *
 * 【规范说明：Entity（实体）】
 * Entity 是有唯一标识（ID）的领域对象
 *
 * 与 Aggregate Root 的区别：
 * - Aggregate Root（聚合根）：聚合的顶级实体，外部只能通过它访问聚合内的对象
 * - Entity（实体）：聚合内的子实体，或独立的实体
 *
 * 【Client/Server 分离】
 * - RuleRevision-Client: 前端看到的脱敏审计记录
 * - RuleRevision-Server: 后端完整的审计记录
 */

// ============ RuleRevision Entity (Client/Server 分离) ============
export type { RuleRevisionClientDTO } from './rule-revision-client';

export type {
  RuleRevisionServerDTO,
  /** @internal Persistence format — use RuleRevisionServerDTO or RuleRevisionClientDTO instead. 持久化格式 — 请使用 RuleRevisionServerDTO 或 RuleRevisionClientDTO。 */
  RuleRevisionPersistenceDTO,
} from './rule-revision-server';
