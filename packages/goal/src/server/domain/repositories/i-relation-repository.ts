/**
 * R5 关系仓储 Port（domain-owned）。
 * R5 Relation repository Port (domain-owned).
 *
 * 连接 Note/Goal/Task/Reminder/Habit/Wallet 两类主体（subject → object），
 * 维护正向与反向查询；Prisma 实现位于 infrastructure/adapters/prisma。
 * Connects two subject references (subject → object) across
 * Note/Goal/Task/Reminder/Habit/Wallet and maintains forward and reverse
 * lookups; the Prisma implementation lives in infrastructure/adapters/prisma.
 */

/** 支持的主体类型 / Supported subject types. */
export const SubjectTypes = ['note', 'goal', 'task', 'reminder', 'habit', 'wallet'] as const;
export type SubjectType = (typeof SubjectTypes)[number];

/** 支持的关系类型 / Supported relation types. */
export const RelationTypes = ['references', 'related', 'depends_on', 'contributes_to'] as const;
export type RelationType = (typeof RelationTypes)[number];

/** 主体引用 / Subject reference. */
export interface SubjectRef {
  type: SubjectType;
  id: string;
}

/** 关系 DTO（createdAt 为毫秒时间戳）/ Relation DTO (createdAt in epoch milliseconds). */
export interface RelationDTO {
  id: string;
  subject: SubjectRef;
  relationType: RelationType;
  object: SubjectRef;
  createdAt: number;
}

/**
 * 关系仓储 Port / Relation repository Port.
 *
 * @remarks
 * - `create` 的唯一约束冲突由 `CreateRelationUseCase` 解释为 `CONFLICT`；
 *   本 Port 保持原始错误抛出。Unique constraint violations are interpreted
 *   by `CreateRelationUseCase` as `CONFLICT`; this Port keeps throwing raw errors.
 * - 所有查询按 identityId 隔离（identity scoping）。
 *   All queries are scoped by identityId.
 */
export interface IRelationRepository {
  create(input: {
    identityId: string;
    subject: SubjectRef;
    relationType: RelationType;
    object: SubjectRef;
  }): Promise<RelationDTO>;
  deleteByIdentityId(identityId: string, id: string): Promise<void>;
  /** 正向：从 subject 出发的关系 / Forward: relations starting from subject. */
  findBySubject(identityId: string, subject: SubjectRef): Promise<RelationDTO[]>;
  /** 反向：谁引用了该 object / Reverse: who references this object. */
  findByObject(identityId: string, object: SubjectRef): Promise<RelationDTO[]>;
}
