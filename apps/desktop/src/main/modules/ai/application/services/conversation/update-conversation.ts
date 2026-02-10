import { GetConversation } from '@dailyuse/ai/application-server';
import type { AIConversationClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateConversationService');

export async function updateConversationService(
  accountUuid: string,
  conversationUuid: string,
  updates: { title?: string; archived?: boolean },
): Promise<AIConversationClientDTO | null> {
  logger.debug('Updating conversation', { accountUuid, conversationUuid, updates });
  // TODO: Implement updateConversation in application-server
  // For now, return the updated conversation
  const result = await GetConversation.getInstance().execute(conversationUuid, accountUuid);
  return result.conversation;
}
