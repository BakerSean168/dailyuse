import { MessageRole } from '@memoflow/contracts/ai';
import type { IAIConversationRepository } from '../../domain/repositories/i-ai-conversation-repository';
import type {
  AssistantTranscriptBootstrapSnapshot,
  AssistantTranscriptBootstrapSource,
} from '../../mastra/runtime';

/**
 * Read-only one-time bridge from the legacy Conversation aggregate into Mastra
 * memory. It never writes AiMessage and therefore cannot become a dual-write
 * path after cutover.
 */
export class ConversationTranscriptBootstrapSource implements AssistantTranscriptBootstrapSource {
  constructor(private readonly conversations: IAIConversationRepository) {}

  async load(input: {
    identityId: string;
    conversationId: string;
  }): Promise<AssistantTranscriptBootstrapSnapshot | null> {
    const conversation = await this.conversations.findByIdForIdentity(
      input.identityId,
      input.conversationId,
      { includeChildren: true },
    );
    if (!conversation || conversation.deletedAt) return null;

    return {
      title: conversation.name,
      messages: conversation
        .getAllMessages()
        .filter((message) => !message.deletedAt)
        .map((message) => ({
          id: String(message.id),
          role:
            message.role === MessageRole.User
              ? ('user' as const)
              : message.role === MessageRole.System
                ? ('system' as const)
                : ('assistant' as const),
          content: message.content,
          createdAt: message.createdAt.getTime(),
        })),
    };
  }
}
