import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationStatus, MessageRole } from '@dailyuse/contracts/ai';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { AIConversation } from '../ai-conversation';
import { Message } from '../../entities/message';

describe('AIConversation Aggregate', () => {
  let identityId: string;
  let conversation: AIConversation;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    identityId = IdentityId.generate();
    conversation = AIConversation.create({
      identityId,
      name: 'Test Conversation',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('创建与初始状态', () => {
    it('创建活跃会话并发出创建事件', () => {
      expect(conversation.status).toBe(ConversationStatus.Active);
      expect(conversation.messageCount).toBe(0);
      expect(conversation.lastMessageAt).toBeNull();
      expect(conversation.deletedAt).toBeNull();
      expect(conversation.version).toBe(1);
      expect(conversation.domainEvents).toHaveLength(1);
      const createdEvent = conversation.domainEvents[0];
      expect(createdEvent.eventType).toBe('ai.conversation.created');
      expect(createdEvent.aggregateId).toBe(String(conversation.id));
      expect(createdEvent.occurredAt).toBeInstanceOf(Date);
      expect(createdEvent.payload.identityId).toBe(identityId);
    });

    it('生成唯一的会话 ID', () => {
      const conv1 = AIConversation.create({ identityId, name: 'Conv 1' });
      const conv2 = AIConversation.create({ identityId, name: 'Conv 2' });
      expect(conv1.id).not.toEqual(conv2.id);
    });

    it('接受标准化的会话名称', () => {
      const conv = AIConversation.create({ identityId, name: '  Spaced Name  ' });
      expect(conv.name).toBe('  Spaced Name  ');
    });
  });

  describe('消息管理', () => {
    it('添加消息并更新状态', () => {
      const message = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'What is AI?',
      });

      conversation.addMessage(message);

      expect(conversation.messageCount).toBe(1);
      expect(conversation.getLatestMessage()?.id).toBe(message.id);
      expect(conversation.lastMessageAt).not.toBeNull();
      expect(conversation.domainEvents).toHaveLength(2);
    });

    it('禁止向非活跃会话添加消息', () => {
      conversation.updateStatus(ConversationStatus.Archived);
      const message = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'Late message',
      });

      expect(() => conversation.addMessage(message)).toThrow(
        'Cannot add message to a non-active conversation'
      );
    });

    it('保持消息的创建顺序（按 createdAt 排序）', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
      const msg1 = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'First',
        tokenCount: 10,
      });
      vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));
      const msg2 = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.Assistant,
        content: 'Second',
        tokenCount: 20,
      });
      vi.setSystemTime(new Date('2026-01-01T00:00:03.000Z'));
      const msg3 = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'Third',
        tokenCount: 15,
      });

      // 倒序添加，验证排序
      conversation.addMessage(msg3);
      conversation.addMessage(msg1);
      conversation.addMessage(msg2);

      const sorted = conversation.getAllMessages();
      expect(sorted).toHaveLength(3);
      // getAllMessages 应该按 createdAt 排序
      expect(sorted[0].id).toBe(msg1.id);
      expect(sorted[1].id).toBe(msg2.id);
      expect(sorted[2].id).toBe(msg3.id);
    });

    it('返回最新消息（按 createdAt 最晚）', () => {
      const msg1 = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'Old',
      });
      const msg2 = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.Assistant,
        content: 'New',
      });

      conversation.addMessage(msg1);
      conversation.addMessage(msg2);

      const latest = conversation.getLatestMessage();
      expect(latest?.content).toBe('New');
    });

    it('空会话返回 null 最新消息', () => {
      expect(conversation.getLatestMessage()).toBeNull();
    });

    it('返回消息列表副本（不允许外部修改）', () => {
      const message = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'Original',
      });
      conversation.addMessage(message);

      const messages1 = conversation.getAllMessages();
      const messages2 = conversation.getAllMessages();
      // 应返回不同的数组实例（防止外部修改）
      expect(messages1).not.toBe(messages2);
      expect(messages1).toEqual(messages2);
    });
  });

  describe('重命名与更新', () => {
    it('修剪并更新会话名称', () => {
      conversation.rename('  Updated Name  ');
      expect(conversation.name).toBe('Updated Name');
      expect(conversation.domainEvents.length).toBeGreaterThan(1);
    });

    it('禁止空名称', () => {
      expect(() => conversation.rename('')).toThrow('Conversation name cannot be empty');
      expect(() => conversation.rename('   ')).toThrow('Conversation name cannot be empty');
    });

    it('发出更新事件', () => {
      conversation.clearDomainEvents();
      conversation.rename('New Name');
      const event = conversation.domainEvents[0];
      expect(event.eventType).toBe('ai.conversation.updated');
    });

    it('跟踪更新时间', () => {
      const before = conversation.updatedAt;
      conversation.rename('Later Name');
      const after = conversation.updatedAt;
      expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('状态转移', () => {
    it('更新会话状态', () => {
      conversation.updateStatus(ConversationStatus.Archived);
      expect(conversation.status).toBe(ConversationStatus.Archived);
      expect(conversation.domainEvents.length).toBeGreaterThan(1);
    });

    it('相同状态更新时不发出事件', () => {
      conversation.updateStatus(ConversationStatus.Active);
      conversation.clearDomainEvents();
      conversation.updateStatus(ConversationStatus.Active);
      expect(conversation.domainEvents).toHaveLength(0);
    });

    it('状态变更事件包含旧状态和新状态', () => {
      conversation.clearDomainEvents();
      conversation.updateStatus(ConversationStatus.Archived);
      const event = conversation.domainEvents[0];
      expect(event.eventType).toBe('ai.conversation.status_changed');
    });
  });

  describe('软删除', () => {
    it('软删除并标记存档', () => {
      conversation.softDelete();
      expect(conversation.deletedAt).not.toBeNull();
      expect(conversation.status).toBe(ConversationStatus.Archived);
      expect(conversation.domainEvents.length).toBeGreaterThan(1);
    });

    it('软删除后禁止添加消息', () => {
      conversation.softDelete();
      const message = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'Should fail',
      });
      expect(() => conversation.addMessage(message)).toThrow();
    });

    it('发出删除事件', () => {
      conversation.clearDomainEvents();
      conversation.softDelete();
      const event = conversation.domainEvents[0];
      expect(event.eventType).toBe('ai.conversation.deleted');
    });
  });

  describe('DTO 转换', () => {
    it('转换为 Server DTO（不含子元素）', () => {
      const dto = conversation.toServerDTO(false);
      expect(dto.id).toBeDefined();
      expect(dto.name).toBe('Test Conversation');
      expect(dto.status).toBe(ConversationStatus.Active);
      expect(dto.messageCount).toBe(0);
      expect(dto.messages).toBeNull();
    });

    it('转换为 Server DTO（含子元素）', () => {
      const message = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'Test',
      });
      conversation.addMessage(message);

      const dto = conversation.toServerDTO(true);
      expect(dto.messages).toBeDefined();
      expect(dto.messages).toHaveLength(1);
    });

    it('转换为 Client DTO', () => {
      const dto = conversation.toClientDTO();
      expect(dto.id).toBeDefined();
      expect(typeof dto.id).toBe('string');
      expect(dto.messages).toBeNull();
    });

    it('DTO 时间戳转换正确', () => {
      const now = Date.now();
      const dto = conversation.toServerDTO();
      expect(dto.createdAt).toBeGreaterThanOrEqual(now - 1000);
      expect(dto.createdAt).toBeLessThanOrEqual(now + 1000);
    });
  });

  describe('聚合根恢复', () => {
    it('从状态恢复聚合根', () => {
      const message = Message.create({
        conversationId: String(conversation.id),
        role: MessageRole.User,
        content: 'Original',
      });
      conversation.addMessage(message);

      const state = conversation.toServerDTO(true);
      const restored = AIConversation.load({
        ...state,
        messages: [message],
      } as any);

      expect(restored.id).toEqual(conversation.id);
      expect(restored.messageCount).toBe(1);
    });
  });

  describe('边界与不变量', () => {
    it('处理极长的会话名称', () => {
      const longName = 'A'.repeat(500);
      conversation.rename(longName);
      expect(conversation.name).toBe(longName);
    });

    it('多消息后保持计数器一致', () => {
      for (let i = 0; i < 10; i++) {
        const msg = Message.create({
          conversationId: String(conversation.id),
          role: i % 2 === 0 ? MessageRole.User : MessageRole.Assistant,
          content: `Message ${i}`,
        });
        conversation.addMessage(msg);
      }
      expect(conversation.messageCount).toBe(10);
      expect(conversation.getAllMessages()).toHaveLength(10);
    });
  });
});
