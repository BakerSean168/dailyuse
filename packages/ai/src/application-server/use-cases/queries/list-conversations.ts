/**
 * List Conversations Service
 *
 * 列出对话应用服务
 */

import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import type { AIConversationClientDTO } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * List Conversations Service
 */
export class ListConversations {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    identityId: string,
    limit: number,
    offset?: number,
  ): Promise<AIConversationClientDTO[]> {
    const conversations = await this.conversationRepository.findRecent(identityId, limit, offset);

    return conversations.map((c: any) => c.toClientDTO());
  }
}
