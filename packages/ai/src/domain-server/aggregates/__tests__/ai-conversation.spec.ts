import { describe, expect, it } from 'vitest';
import { ConversationStatus, MessageRole } from '@dailyuse/contracts/ai';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { AIConversation } from '../ai-conversation';
import { Message } from '../../entities/message';

describe('AIConversation', () => {
  it('creates an active conversation and emits a creation event', () => {
    const conversation = AIConversation.create({
      identityId: IdentityId.generate(),
      name: 'Weekly Review',
    });

    expect(conversation.status).toBe(ConversationStatus.Active);
    expect(conversation.messageCount).toBe(0);
    expect(conversation.domainEvents).toHaveLength(1);
  });

  it('tracks newly added messages and trims renamed titles', () => {
    const conversation = AIConversation.create({
      identityId: IdentityId.generate(),
      name: 'Draft',
    });
    const message = Message.create({
      conversationId: conversation.id,
      role: MessageRole.User,
      content: 'Summarize this note',
    });

    conversation.addMessage(message);
    conversation.rename('  Refined Draft  ');

    expect(conversation.name).toBe('Refined Draft');
    expect(conversation.messageCount).toBe(1);
    expect(conversation.getLatestMessage()?.id).toBe(message.id);
  });
});
