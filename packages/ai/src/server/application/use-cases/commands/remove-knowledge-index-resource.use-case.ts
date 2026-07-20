import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IKnowledgeIndexRepository } from '../../ports';

/** Removes a deleted source resource from the derived AI index. */
export class RemoveKnowledgeIndexResourceUseCase {
  constructor(private readonly knowledgeIndexRepository: IKnowledgeIndexRepository) {}

  async execute(resourceId: string, cx: ExecutionContext): Promise<void> {
    await this.knowledgeIndexRepository.removeByResourceId(cx.identityId, resourceId);
  }
}
