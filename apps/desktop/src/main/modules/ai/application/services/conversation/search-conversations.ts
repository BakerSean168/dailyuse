import { ListConversations } from '@dailyuse/ai/application-server';
import type { AIConversationClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('searchConversationsService');

export async function searchConversationsService(
  accountUuid: string,
  query: string,
  options?: { limit?: number; offset?: number },
): Promise<{ conversations: AIConversationClientDTO[]; total: number }> {
  logger.debug('Searching conversations', { accountUuid, query });
  // TODO: Implement search in application-server
  const result = await ListConversations.getInstance().execute(
    accountUuid,
    options?.limit ?? 20,
    options?.offset ?? 0,
  );
  const filtered = result.conversations.filter(
    (c) => c.title?.toLowerCase().includes(query.toLowerCase()),
  );
  return { conversations: filtered, total: filtered.length };
}
