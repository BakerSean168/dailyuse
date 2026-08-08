/**
 * R5：跨模块 SubjectRef 关系基础设施（暂驻 goal 包，待 ModuleManifest 重构时抽取）。
 *
 * 连接 Note/Goal/Task/Reminder/Habit 两类主体，维护反向查询：
 * - 正向：某 subject 的关系列表；
 * - 反向：引用某 object 的所有 subject（reverse lookup）。
 */

import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { PrismaClient } from '@memoflow/database';

export const SubjectTypes = ['note', 'goal', 'task', 'reminder', 'habit', 'wallet'] as const;
export type SubjectType = (typeof SubjectTypes)[number];

export const RelationTypes = ['references', 'related', 'depends_on', 'contributes_to'] as const;
export type RelationType = (typeof RelationTypes)[number];

export interface SubjectRef {
  type: SubjectType;
  id: string;
}

export interface RelationDTO {
  id: string;
  subject: SubjectRef;
  relationType: RelationType;
  object: SubjectRef;
  createdAt: number;
}

export interface IRelationRepository {
  create(input: {
    identityId: string;
    subject: SubjectRef;
    relationType: RelationType;
    object: SubjectRef;
  }): Promise<RelationDTO>;
  deleteByIdentityId(identityId: string, id: string): Promise<void>;
  /** 正向：subject 出发的关系。 */
  findBySubject(identityId: string, subject: SubjectRef): Promise<RelationDTO[]>;
  /** 反向：谁引用了该 object。 */
  findByObject(identityId: string, object: SubjectRef): Promise<RelationDTO[]>;
}

export class PrismaRelationRepository implements IRelationRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: {
    identityId: string;
    subject: SubjectRef;
    relationType: RelationType;
    object: SubjectRef;
  }): Promise<RelationDTO> {
    const row = await this.db.relation.create({
      data: {
        id: crypto.randomUUID(),
        identityId: input.identityId,
        subjectType: input.subject.type,
        subjectId: input.subject.id,
        relationType: input.relationType,
        objectType: input.object.type,
        objectId: input.object.id,
      },
    });
    return {
      id: row.id,
      subject: { type: row.subjectType as SubjectType, id: row.subjectId },
      relationType: row.relationType as RelationType,
      object: { type: row.objectType as SubjectType, id: row.objectId },
      createdAt: row.createdAt.getTime(),
    };
  }

  async deleteByIdentityId(identityId: string, id: string): Promise<void> {
    await this.db.relation.deleteMany({ where: { id, identityId } });
  }

  async findBySubject(identityId: string, subject: SubjectRef): Promise<RelationDTO[]> {
    const rows = await this.db.relation.findMany({
      where: { identityId, subjectType: subject.type, subjectId: subject.id },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDTO);
  }

  async findByObject(identityId: string, object: SubjectRef): Promise<RelationDTO[]> {
    const rows = await this.db.relation.findMany({
      where: { identityId, objectType: object.type, objectId: object.id },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDTO);
  }
}

function toDTO(row: {
  id: string;
  subjectType: string;
  subjectId: string;
  relationType: string;
  objectType: string;
  objectId: string;
  createdAt: Date;
}): RelationDTO {
  return {
    id: row.id,
    subject: { type: row.subjectType as SubjectType, id: row.subjectId },
    relationType: row.relationType as RelationType,
    object: { type: row.objectType as SubjectType, id: row.objectId },
    createdAt: row.createdAt.getTime(),
  };
}

export class CreateRelationUseCase {
  constructor(private readonly repository: IRelationRepository) {}

  async execute(
    identityId: string,
    input: { subject: SubjectRef; relationType: RelationType; object: SubjectRef },
  ): Promise<Result<RelationDTO>> {
    if (!SubjectTypes.includes(input.subject.type) || !SubjectTypes.includes(input.object.type)) {
      return error('VALIDATION_ERROR', 'Invalid subject/object type');
    }
    if (!input.subject.id || !input.object.id) {
      return error('VALIDATION_ERROR', 'Subject and object ids are required');
    }
    try {
      const dto = await this.repository.create({ identityId, ...input });
      return ok(dto);
    } catch (e) {
      // 唯一键冲突 = 关系已存在（幂等）
      if (e instanceof Error && e.message.includes('Unique')) {
        return error('CONFLICT', 'Relation already exists');
      }
      throw e;
    }
  }
}

export class ListRelationsUseCase {
  constructor(private readonly repository: IRelationRepository) {}

  /** 正向查询。 */
  async forward(
    identityId: string,
    subject: SubjectRef,
  ): Promise<Result<RelationDTO[]>> {
    return ok(await this.repository.findBySubject(identityId, subject));
  }

  /** 反向查询（谁引用了我）。 */
  async reverse(
    identityId: string,
    object: SubjectRef,
  ): Promise<Result<RelationDTO[]>> {
    return ok(await this.repository.findByObject(identityId, object));
  }
}
