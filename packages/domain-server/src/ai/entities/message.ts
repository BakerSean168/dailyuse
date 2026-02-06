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
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(params: {
    id?: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number | null;
    version?: number;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }) {
    super((params.id ?? AiMessageId.generate()) as AiMessageId);
    this._conversationId = AiConversationId.of(params.conversationId);
    this._role = params.role;
    this._content = params.content;
    this._tokenCount = params.tokenCount ?? null;
    this._version = params.version ?? 1;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt ?? params.createdAt;
    this._deletedAt = params.deletedAt ?? null;
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

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public get version(): number {
    return this._version;
  }

  public static create(params: {
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
  }): Message {
    const now = new Date();
    return new Message({
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      tokenCount: params.tokenCount,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  public static fromServerDTO(dto: MessageServerDTO): Message {
    return new Message({
      id: dto.id,
      conversationId: dto.conversationId,
      role: dto.role,
      content: dto.content,
      tokenCount: dto.tokenCount,
      version: (dto as any).version ?? 1,
      createdAt: new Date(dto.createdAt),
      updatedAt: (dto as any).updatedAt ? new Date((dto as any).updatedAt) : new Date(dto.createdAt),
      deletedAt: (dto as any).deletedAt ? new Date((dto as any).deletedAt) : null,
    });
  }

  public static fromPersistenceDTO(dto: MessagePersistenceDTO): Message {
    return new Message({
      id: dto.id,
      conversationId: dto.conversationId,
      role: dto.role,
      content: dto.content,
      tokenCount: dto.tokenCount,
      version: (dto as any).version ?? 1,
      createdAt: dto.createdAt,
      updatedAt: (dto as any).updatedAt ?? dto.createdAt,
      deletedAt: (dto as any).deletedAt ?? null,
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
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
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
