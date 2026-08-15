import type { PrismaClient } from '@memoflow/database';
import type {
  IRelationRepository,
  RelationDTO,
  RelationType,
  SubjectRef,
} from '../../../domain';
import { PrismaRelationMapper } from './mappers/prisma-relation.mapper';

/**
 * Prisma 关系仓储（R5）/ Prisma relation repository (R5).
 *
 * 只负责 Prisma 调用；行转换交给 `PrismaRelationMapper`。
 * `findBySubject`/`findByObject` 保持 createdAt ASC，delete 保持
 * `{ id, identityId }` 作用域的 deleteMany。
 * Owns only the Prisma calls; row conversion is delegated to
 * `PrismaRelationMapper`. `findBySubject`/`findByObject` stay createdAt ASC and
 * delete stays a `{ id, identityId }`-scoped deleteMany.
 */
export class RelationPrismaRepository implements IRelationRepository {
  constructor(private readonly db: PrismaClient) {}

  /** 创建关系（id 由实现生成）/ Creates a relation with an implementation-generated id. */
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
    return PrismaRelationMapper.toDTO(row);
  }

  /** 按 `{ id, identityId }` 作用域删除 / Deletes scoped by `{ id, identityId }`. */
  async deleteByIdentityId(identityId: string, id: string): Promise<void> {
    await this.db.relation.deleteMany({ where: { id, identityId } });
  }

  /** 正向查询（createdAt ASC）/ Forward lookup ordered by createdAt ASC. */
  async findBySubject(identityId: string, subject: SubjectRef): Promise<RelationDTO[]> {
    const rows = await this.db.relation.findMany({
      where: { identityId, subjectType: subject.type, subjectId: subject.id },
      orderBy: { createdAt: 'asc' },
    });
    return PrismaRelationMapper.toDTOList(rows);
  }

  /** 反向查询（createdAt ASC）/ Reverse lookup ordered by createdAt ASC. */
  async findByObject(identityId: string, object: SubjectRef): Promise<RelationDTO[]> {
    const rows = await this.db.relation.findMany({
      where: { identityId, objectType: object.type, objectId: object.id },
      orderBy: { createdAt: 'asc' },
    });
    return PrismaRelationMapper.toDTOList(rows);
  }
}
