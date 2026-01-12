import { CreateConversation } from '@dailyuse/application-server';
import type { ConversationResponse } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createConversationService');

export async function createConversationService(
  accountUuid: string,
  title?: string,
): Promise<ConversationResponse> {
  logger.debug('Creating conversation', { accountUuid, title });
  return CreateConversation.getInstance().execute(accountUuid, { title: title || 'New Conversation' });
}
