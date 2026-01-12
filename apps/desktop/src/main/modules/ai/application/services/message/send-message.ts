import { SendMessage } from '@dailyuse/application-server';
import type { MessageResponse } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('sendMessageService');

export async function sendMessageService(
  accountUuid: string,
  conversationUuid: string,
  content: string,
): Promise<MessageResponse> {
  logger.debug('Sending message', { accountUuid, conversationUuid });
  return SendMessage.getInstance().execute(accountUuid, { conversationUuid, content });
}
