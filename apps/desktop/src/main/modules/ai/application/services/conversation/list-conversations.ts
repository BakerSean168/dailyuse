import { ListConversations } from '@dailyuse/application-server';
import type { ConversationListResponse } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listConversationsService');

export async function listConversationsService(
  accountUuid: string,
  options?: { limit?: number; offset?: number; archived?: boolean },
): Promise<ConversationListResponse> {
  logger.debug('Listing conversations', { accountUuid, options });
  return ListConversations.getInstance().execute(
    accountUuid,
    options?.limit ?? 20,
    options?.offset ?? 0,
  );
}
