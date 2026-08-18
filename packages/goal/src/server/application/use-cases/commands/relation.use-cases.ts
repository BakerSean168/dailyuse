/**
 * R5：跨模块 SubjectRef 关系 use cases（暂驻 goal 包，待 ModuleManifest 重构时抽取）。
 *
 * 连接 Note/Goal/Task/Reminder/Habit 两类主体，维护反向查询：
 * - 正向：某 subject 的关系列表；
 * - 反向：引用某 object 的所有 subject（reverse lookup）。
 *
 * 契约纪律：use case 只依赖 domain-owned `IRelationRepository` Port；
 * Prisma 实现位于 `infrastructure/adapters/prisma/relation-prisma.repository.ts`。
 */

import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type {
  IRelationRepository,
  RelationDTO,
  RelationType,
  SubjectRef,
} from '../../../domain';
import { SubjectTypes } from '../../../domain';
import { isPrismaUniqueConstraintError } from '../../errors/prisma-unique';

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
      // 唯一键冲突 = 关系已存在（幂等）— 结构化 Code P2002，非消息文本
      if (isPrismaUniqueConstraintError(e)) {
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
