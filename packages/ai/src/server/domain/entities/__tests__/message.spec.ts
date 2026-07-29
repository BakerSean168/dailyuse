import { describe, expect, it, beforeEach } from 'vitest';
import { MessageRole } from '@memoflow/contracts/ai';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { AIConversation } from '../../aggregates/ai-conversation';
import { Message } from '../message';

describe('Message Entity', () => {
  let conversation: AIConversation;
  let conversationId: string;

  beforeEach(() => {
    conversation = AIConversation.create({
      identityId: IdentityId.generate(),
      name: 'Test Conversation',
    });
    conversationId = String(conversation.id);
  });

  describe('创建与初始状态', () => {
    it('创建新消息', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Hello, AI!',
      });

      expect(message.role).toBe(MessageRole.User);
      expect(message.content).toBe('Hello, AI!');
      expect(message.conversationId).toBe(conversationId);
      expect(message.tokenCount).toBeNull();
      expect(message.version).toBe(1);
      expect(message.deletedAt).toBeNull();
    });

    it('创建带 token 计数的消息', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.Assistant,
        content: 'Response',
        tokenCount: 150,
      });

      expect(message.tokenCount).toBe(150);
    });

    it('生成唯一的消息 ID', () => {
      const msg1 = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'First',
      });
      const msg2 = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Second',
      });

      expect(msg1.id).not.toEqual(msg2.id);
    });

    it('记录创建时间戳', () => {
      const before = new Date();
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Timestamped',
      });
      const after = new Date();

      expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(message.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('消息角色验证', () => {
    it('接受所有有效的消息角色', () => {
      const userMsg = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'User message',
      });
      const assistantMsg = Message.create({
        conversationId,
        role: MessageRole.Assistant,
        content: 'Assistant response',
      });
      const systemMsg = Message.create({
        conversationId,
        role: MessageRole.System,
        content: 'System notice',
      });

      expect(userMsg.role).toBe(MessageRole.User);
      expect(assistantMsg.role).toBe(MessageRole.Assistant);
      expect(systemMsg.role).toBe(MessageRole.System);
    });
  });

  describe('内容验证', () => {
    it('接受标准内容', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Standard message content',
      });
      expect(message.content).toBe('Standard message content');
    });

    it('接受长内容', () => {
      const longContent = 'A'.repeat(10000);
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: longContent,
      });
      expect(message.content).toHaveLength(10000);
    });

    it('接受空字符串内容', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: '',
      });
      expect(message.content).toBe('');
    });

    it('接受特殊字符和 Unicode', () => {
      const specialContent = '你好 🌟 <script>alert("XSS")</script> @#$%^&*()';
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: specialContent,
      });
      expect(message.content).toBe(specialContent);
    });
  });

  describe('DTO 转换', () => {
    it('转换为 Server DTO', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Test content',
        tokenCount: 100,
      });

      const dto = message.toServerDTO();
      expect(dto.id).toBeDefined();
      expect(dto.conversationId).toBe(conversationId);
      expect(dto.role).toBe(MessageRole.User);
      expect(dto.content).toBe('Test content');
      expect(dto.tokenCount).toBe(100);
      expect(typeof dto.createdAt).toBe('number');
    });

    it('转换为 Client DTO', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.Assistant,
        content: 'Response',
      });

      const dto = message.toClientDTO();
      expect(typeof dto.id).toBe('string');
      expect(typeof dto.conversationId).toBe('string');
      expect(dto.isAssistant).toBe(true);
      expect(dto.isUser).toBe(false);
      expect(dto.isSystem).toBe(false);
      expect(dto.formattedTime).toBeDefined();
    });

    it('Client DTO 包含便利标志', () => {
      const user = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Hi',
      });
      const assistant = Message.create({
        conversationId,
        role: MessageRole.Assistant,
        content: 'Hello',
      });

      const userDto = user.toClientDTO();
      const assistantDto = assistant.toClientDTO();

      expect(userDto.isUser).toBe(true);
      expect(userDto.isAssistant).toBe(false);
      expect(assistantDto.isUser).toBe(false);
      expect(assistantDto.isAssistant).toBe(true);
    });

    it('Client DTO 时间戳正确转换', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Timestamp test',
      });

      const dto = message.toClientDTO();
      const createdAtFromDto = new Date(dto.createdAt);
      const originalTime = message.createdAt.getTime();

      expect(createdAtFromDto.getTime()).toBe(originalTime);
    });
  });

  describe('实体恢复', () => {
    it('从状态加载消息', () => {
      const now = new Date();
      const state = {
        id: 'test-id' as any,
        conversationId: 'test-conv-id' as any,
        role: MessageRole.User,
        content: 'Loaded message',
        tokenCount: 50,
        version: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      const message = Message.load(state);
      expect(message.content).toBe('Loaded message');
      expect(message.tokenCount).toBe(50);
      expect(message.version).toBe(2);
    });
  });

  describe('时间管理', () => {
    it('更新时间初始等于创建时间', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Time test',
      });

      expect(message.updatedAt.getTime()).toBe(message.createdAt.getTime());
    });

    it('未删除时 deletedAt 为 null', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Not deleted',
      });

      expect(message.deletedAt).toBeNull();
    });

    it('支持删除状态跟踪', () => {
      const now = new Date();
      const state = {
        id: 'msg-id' as any,
        conversationId: 'conv-id' as any,
        role: MessageRole.User,
        content: 'Will be deleted',
        tokenCount: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: now,
      };

      const message = Message.load(state);
      expect(message.deletedAt).not.toBeNull();
    });
  });

  describe('边界与不变量', () => {
    it('保持版本号跟踪', () => {
      const state = {
        id: 'msg-id' as any,
        conversationId: 'conv-id' as any,
        role: MessageRole.User,
        content: 'Content',
        tokenCount: null,
        version: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const message = Message.load(state);
      expect(message.version).toBe(5);
    });

    it('处理零 token 计数', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.System,
        content: 'No tokens',
        tokenCount: 0,
      });

      expect(message.tokenCount).toBe(0);
    });

    it('处理大 token 计数', () => {
      const message = Message.create({
        conversationId,
        role: MessageRole.User,
        content: 'Expensive',
        tokenCount: 1000000,
      });

      expect(message.tokenCount).toBe(1000000);
    });
  });
});
