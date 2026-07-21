import { fail, ok, type Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
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
interface AIChatConversationControllerService {
  createConversation(cx: ExecutionContext, name?: string): Promise<Result<CreateConversationRes>>;
  listConversations(cx: ExecutionContext, page?: number, pageSize?: number): Promise<Result<ConversationListRes>>;
  getConversation(
    id: string,
    cx: ExecutionContext,
    includeMessages?: boolean,
  ): Promise<Result<GetConversationRes | null>>;
  updateConversation(
    id: string,
    input: UpdateConversationReq,
    cx: ExecutionContext,
  ): Promise<Result<UpdateConversationRes>>;
  deleteConversation(id: string, cx: ExecutionContext): Promise<Result<void>>;
}

interface AIChatMessageControllerService {
  sendMessage(
    conversationId: string,
    content: string,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
  ): Promise<Result<SendMessageRes>>;
  streamMessage(
    conversationId: string,
    content: string,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
    signal?: AbortSignal,
  ): Promise<Result<{
    userMessage: SendMessageRes['userMessage'];
    assistantMessage: SendMessageRes['assistantMessage'];
    tokenUsage: SendMessageRes['tokenUsage'];
    providerId: SendMessageRes['providerId'];
    processingTimeMs: number;
  }>>;
}

export class AIChatController {
  constructor(
    private readonly conversationService: AIChatConversationControllerService,
    private readonly chatService: AIChatMessageControllerService,
  ) {}

  async createConversation(
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<CreateConversationRes>> {
    const parsed = CreateConversationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.conversationService.createConversation(cx, parsed.data.name);
  }

  async listConversations(
    cx: ExecutionContext,
    page = 1,
    pageSize = 20,
  ): Promise<Result<ConversationListRes>> {
    return this.conversationService.listConversations(cx, page, pageSize);
  }

  async getConversation(id: string, cx: ExecutionContext): Promise<Result<GetConversationRes>> {
    const result = await this.conversationService.getConversation(id, cx, true);
    if (!result.ok) return result;
    if (!result.data) {
      return fail({ code: 'NOT_FOUND', message: 'Conversation not found' });
    }
    return ok(result.data);
  }

  async updateConversation(
    id: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<UpdateConversationRes>> {
    const parsed = UpdateConversationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.conversationService.updateConversation(id, parsed.data, cx);
  }

  async deleteConversation(id: string, cx: ExecutionContext): Promise<Result<null>> {
    const result = await this.conversationService.deleteConversation(id, cx);
    if (!result.ok) return result;
    // Serialize as data:null so HttpResponse keeps the data key (no ActionSuccess dual-track).
    return ok(null);
  }

  async sendMessage(input: unknown, cx: ExecutionContext): Promise<Result<SendMessageRes>> {
    const parsed = SendMessageSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.chatService.sendMessage(
      parsed.data.conversationId,
      parsed.data.content,
      cx,
      parsed.data.providerId,
      parsed.data.model,
    );
  }

  async streamMessage(
    input: unknown,
    cx: ExecutionContext,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
    signal?: AbortSignal,
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

    return this.chatService.streamMessage(
      parsed.data.conversationId,
      parsed.data.content,
      onChunk,
      cx,
      parsed.data.providerId,
      parsed.data.model,
      signal,
    );
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

  async listMessages(input: unknown, cx: ExecutionContext): Promise<Result<MessageListRes>> {
    const parsed = ListMessagesSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const result = await this.conversationService.getConversation(
      parsed.data.conversationId,
      cx,
      true,
    );
    if (!result.ok) return result;
    if (!result.data) {
      return fail({ code: 'NOT_FOUND', message: 'Conversation not found' });
    }

    const messages = result.data.messages ?? [];
    return ok({
      data: messages,
      total: messages.length,
      page: parsed.data.page ?? 1,
      pageSize: parsed.data.pageSize ?? 50,
    });
  }
}
