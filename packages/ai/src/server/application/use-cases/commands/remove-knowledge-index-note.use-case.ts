import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IKnowledgeIndexRepository } from '../../ports';

/** Removes a deleted source resource from the derived AI index. */
export class RemoveKnowledgeIndexNoteUseCase {
  constructor(private readonly knowledgeIndexRepository: IKnowledgeIndexRepository) {}

  async execute(resourceId: string, cx: ExecutionContext): Promise<void> {
    await this.knowledgeIndexRepository.removeByNoteId(cx.identityId, resourceId);
  }
}
