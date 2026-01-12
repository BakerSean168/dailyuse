import { DeleteConversation } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteConversationService');

export async function deleteConversationService(
  accountUuid: string,
  conversationUuid: string,
): Promise<void> {
  logger.debug('Deleting conversation', { accountUuid, conversationUuid });
  await DeleteConversation.getInstance().execute(conversationUuid, accountUuid);
}
