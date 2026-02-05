import { Entity } from '@dailyuse/utils';
import type {
  MessageClientDTO,
  MessagePersistenceDTO,
  MessageServer,
  MessageServerDTO,
} from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type { AiConversationId as IAiConversationId } from '@dailyuse/contracts/primitives';
import { AiMessageId, AiConversationId } from '@dailyuse/domain-shared/ai';

export class Message extends Entity<AiMessageId> implements MessageServer {
  private _conversationId: IAiConversationId;
  private _role: MessageRole;
  private _content: string;
  private _tokenCount: number | null;
  private _createdAt: Date;

  private constructor(params: {
    id?: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number | null;
    createdAt: Date;
  }) {
    super((params.id ?? AiMessageId.generate()) as AiMessageId);
    this._conversationId = AiConversationId.of(params.conversationId);
    this._role = params.role;
    this._content = params.content;
    this._tokenCount = params.tokenCount ?? null;
    this._createdAt = params.createdAt;
  }

  public get conversationId(): IAiConversationId {
    return this._conversationId;
  }

  public get role(): MessageRole {
    return this._role;
  }

  public get content(): string {
    return this._content;
  }

  public get tokenCount(): number | null {
    return this._tokenCount;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public static create(params: {
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
  }): Message {
    return new Message({
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      tokenCount: params.tokenCount,
      createdAt: new Date(),
    });
  }

  public static fromServerDTO(dto: MessageServerDTO): Message {
    return new Message({
      id: dto.id,
      conversationId: dto.conversationId,
      role: dto.role,
      content: dto.content,
      tokenCount: dto.tokenCount,
      createdAt: new Date(dto.createdAt),
    });
  }

  public static fromPersistenceDTO(dto: MessagePersistenceDTO): Message {
    return new Message({
      id: dto.id,
      conversationId: dto.conversationId,
      role: dto.role,
      content: dto.content,
      tokenCount: dto.tokenCount,
      createdAt: dto.createdAt,
    });
  }

  public toServerDTO(): MessageServerDTO {
    return {
      id: this.id,
      conversationId: this._conversationId,
      role: this._role,
      content: this._content,
      tokenCount: this._tokenCount,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(): MessageClientDTO {
    return {
      id: String(this.id),
      conversationId: String(this._conversationId),
      role: this._role,
      content: this._content,
      tokenCount: this._tokenCount,
      createdAt: this._createdAt.getTime(),
      isUser: this._role === MessageRole.User,
      isAssistant: this._role === MessageRole.Assistant,
      isSystem: this._role === MessageRole.System,
      formattedTime: new Date(this._createdAt).toLocaleString(),
    };
  }

  public toPersistenceDTO(): MessagePersistenceDTO {
    return {
      id: this.id,
      conversationId: this._conversationId,
      role: this._role,
      content: this._content,
      tokenCount: this._tokenCount,
      createdAt: this._createdAt,
    };
  }
}
