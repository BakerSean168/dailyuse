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
  type UpdateConversationReq,
  type UpdateConversationRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';
import { toAIControllerFailure } from './ai-controller-errors';

interface AIChatConversationControllerService {
  createConversation(identityId: string, name?: string): Promise<CreateConversationRes>;
  listConversations(identityId: string, page?: number, pageSize?: number): Promise<ConversationListRes>;
  getConversation(id: string, includeMessages?: boolean): Promise<{
    toClientDTO(): GetConversationRes;
    getAllMessages(): Array<{ toClientDTO(): MessageListRes['data'][number] }>;
  } | null>;
  updateConversation(id: string, input: UpdateConversationReq): Promise<UpdateConversationRes>;
  deleteConversation(id: string): Promise<void>;
}

interface AIChatMessageControllerService {
  sendMessage(
    identityId: string,
    conversationId: string,
    content: string,
    providerId?: string,
    model?: string,
  ): Promise<SendMessageRes>;
  streamMessage(
    identityId: string,
    conversationId: string,
    content: string,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
    providerId?: string,
    model?: string,
  ): Promise<{
    userMessage: SendMessageRes['userMessage'];
    assistantMessage: SendMessageRes['assistantMessage'];
    tokenUsage: SendMessageRes['tokenUsage'];
    providerId: SendMessageRes['providerId'];
    processingTimeMs: number;
  }>;
}

export class AIChatController {
  constructor(
    private readonly conversationService: AIChatConversationControllerService,
    private readonly chatService: AIChatMessageControllerService,
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

    try {
      return ok(await this.conversationService.createConversation(identityId, parsed.data.name));
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
  }

  async listConversations(
    identityId: string,
    page = 1,
    pageSize = 20,
  ): Promise<Result<ConversationListRes>> {
    try {
      return ok(await this.conversationService.listConversations(identityId, page, pageSize));
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
  }

  async getConversation(id: string): Promise<Result<GetConversationRes>> {
    try {
      const conversation = await this.conversationService.getConversation(id, true);
      if (!conversation) {
        return fail({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }
      return ok(conversation.toClientDTO());
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
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

    try {
      return ok(await this.conversationService.updateConversation(id, parsed.data));
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
  }

  async deleteConversation(id: string) {
    try {
      await this.conversationService.deleteConversation(id);
      return ok(undefined);
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
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

    try {
      return ok(
        await this.chatService.sendMessage(
          identityId,
          parsed.data.conversationId,
          parsed.data.content,
          parsed.data.providerId,
          parsed.data.model,
        ),
      );
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
  }

  async streamMessage(
    input: unknown,
    identityId: string,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
  ): Promise<Result<{
    userMessage: SendMessageRes['userMessage'];
    assistantMessage: SendMessageRes['assistantMessage'];
    tokenUsage: SendMessageRes['tokenUsage'];
    providerId: SendMessageRes['providerId'];
    processingTimeMs: number;
  }>> {
    const parsed = this.parseSendMessage(input);
    if (!parsed.ok) {
      return parsed;
    }

    try {
      return ok(
        await this.chatService.streamMessage(
          identityId,
          parsed.data.conversationId,
          parsed.data.content,
          onChunk,
          parsed.data.providerId,
          parsed.data.model,
        ),
      );
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
  }

  parseSendMessage(input: unknown): Result<{
    conversationId: string;
    content: string;
    providerId?: string;
    model?: string;
  }> {
    const parsed = SendMessageSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok({
      conversationId: parsed.data.conversationId,
      content: parsed.data.content,
      providerId: parsed.data.providerId,
      model: parsed.data.model,
    });
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

    try {
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
    } catch (error) {
      return toAIControllerFailure(error, 'AI chat failed');
    }
  }
}
