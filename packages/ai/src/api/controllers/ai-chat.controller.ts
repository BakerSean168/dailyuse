import { fail, ok, type Result } from '@dailyuse/contracts/result';
import {
  CreateConversationSchema,
  ListMessagesSchema,
  SendMessageSchema,
  UpdateConversationSchema,
  type CreateConversationRes,
  type ConversationListRes,
  type GetConversationRes,
  type MessageListRes,
  type SendMessageRes,
  type UpdateConversationRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { AIConversationService } from '../../application-server/use-cases/commands/a-i-conversation-service';
import type { AIChatApplicationService } from '../../application-server/use-cases/commands/a-i-chat-application-service';

export class AIChatController {
  constructor(
    private readonly conversationService: AIConversationService,
    private readonly chatService: AIChatApplicationService,
  ) {}

  async createConversation(
    input: unknown,
    identityId: string,
  ): Promise<Result<CreateConversationRes>> {
    const parsed = CreateConversationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.conversationService.createConversation(identityId, parsed.data.name));
  }

  async listConversations(
    identityId: string,
    page = 1,
    pageSize = 20,
  ): Promise<Result<ConversationListRes>> {
    return ok(await this.conversationService.listConversations(identityId, page, pageSize));
  }

  async getConversation(id: string): Promise<Result<GetConversationRes>> {
    const conversation = await this.conversationService.getConversation(id, true);
    if (!conversation) {
      return fail({ code: 'NOT_FOUND', message: 'Conversation not found' });
    }
    return ok(conversation.toClientDTO());
  }

  async updateConversation(id: string, input: unknown): Promise<Result<UpdateConversationRes>> {
    const parsed = UpdateConversationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.conversationService.updateConversation(id, parsed.data));
  }

  async deleteConversation(id: string) {
    await this.conversationService.deleteConversation(id);
    return ok(undefined);
  }

  async sendMessage(input: unknown, identityId: string): Promise<Result<SendMessageRes>> {
    const parsed = SendMessageSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(
      await this.chatService.sendMessage(
        identityId,
        parsed.data.conversationId,
        parsed.data.content,
        parsed.data.providerId,
      ),
    );
  }

  async listMessages(input: unknown): Promise<Result<MessageListRes>> {
    const parsed = ListMessagesSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const conversation = await this.conversationService.getConversation(
      parsed.data.conversationId,
      true,
    );
    if (!conversation) {
      return fail({ code: 'NOT_FOUND', message: 'Conversation not found' });
    }

    const messages = conversation.getAllMessages().map((message) => message.toClientDTO());
    return ok({
      data: messages,
      total: messages.length,
      page: parsed.data.page ?? 1,
      pageSize: parsed.data.pageSize ?? 50,
    });
  }
}
