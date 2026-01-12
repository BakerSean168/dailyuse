import { GetConversation } from '@dailyuse/application-server';
import type { ConversationResponse } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getConversationService');

export async function getConversationService(
  accountUuid: string,
  conversationUuid: string,
  includeMessages = false,
): Promise<ConversationResponse> {
  logger.debug('Getting conversation', { accountUuid, conversationUuid });
  return GetConversation.getInstance().execute(conversationUuid, accountUuid);
}
