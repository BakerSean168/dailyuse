import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import { AIConversation as AIConversationServer } from '../../../domain/aggregates/ai-conversation';
import { Message as MessageServer } from '../../../domain/entities/message';
import type { MessageClientDTO } from '@memoflow/contracts/ai';
import { MessageRole } from '@memoflow/contracts/ai';
import type { ChatExecutionMessage } from '../../ports';
import { createLogger } from '@memoflow/utils/logger';
import { AIExecutionError } from '../../../../shared/ai-execution-error';

const logger = createLogger('AIChatHelpers');

export async function validateAndGetConversation(
  conversationRepository: IAIConversationRepository,
  identityId: string,
  conversationId: string,
): Promise<AIConversationServer> {
  const conversation = await conversationRepository.findByIdForIdentity(
    identityId,
    conversationId,
    {
      includeChildren: true,
    },
  );
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  return conversation;
}

export async function saveMessage(
  conversationRepository: IAIConversationRepository,
  conversation: AIConversationServer,
  role: MessageRole,
  content: string,
): Promise<MessageClientDTO> {
  const message = MessageServer.create({
    conversationId: conversation.id,
    role,
    content,
  });
  conversation.addMessage(message);
  await conversationRepository.save(conversation);

  return message.toClientDTO();
}

export async function getConversationHistory(
  conversationRepository: IAIConversationRepository,
  identityId: string,
  conversationId: string,
): Promise<MessageClientDTO[]> {
  const conversation = await conversationRepository.findByIdForIdentity(
    identityId,
    conversationId,
    {
      includeChildren: true,
    },
  );
  if (!conversation) {
    return [];
  }

  return conversation.getAllMessages().map((message) => message.toClientDTO());
}

export function toExecutionMessages(history: MessageClientDTO[]): ChatExecutionMessage[] {
  const systemMessage: ChatExecutionMessage = {
    role: 'system',
    content: 'You are a helpful assistant.',
  };

  return [
    systemMessage,
    ...history
      .filter((message) => typeof message.content === 'string' && message.content.trim().length > 0)
      .map((message) => ({
        role: toExecutionRole(message.role),
        content: message.content,
      })),
  ];
}

export function toExecutionRole(role: MessageClientDTO['role']): ChatExecutionMessage['role'] {
  switch (role) {
    case MessageRole.User:
      return 'user';
    case MessageRole.Assistant:
      return 'assistant';
    case MessageRole.System:
      return 'system';
    default:
      logger.warn('Unknown message role received, defaulting to user', { role });
      return 'user';
  }
}

export { isAbortLikeError } from '../../../../shared/is-abort-like-error';

export function createStreamAbortError(): Error {
  return new AIExecutionError('aborted', 'AI chat stream aborted by client');
}
