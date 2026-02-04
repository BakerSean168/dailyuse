import { Entity } from '@dailyuse/utils';
import type {
  MessageClientDTO,
  MessagePersistenceDTO,
  MessageServer,
  MessageServerDTO,
} from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import { AiMessageId } from '@dailyuse/domain-shared/ai';

export class Message extends Entity<AiMessageId> implements MessageServer {
  private _conversationUuid: string;
  private _role: MessageRole;
  private _content: string;
  private _tokenCount: number | null;
  private _createdAt: Date;

  private constructor(params: {
    uuid?: string;
    conversationUuid: string;
    role: MessageRole;
    content: string;
    tokenCount?: number | null;
    createdAt: Date;
  }) {
    super((params.uuid ?? AiMessageId.generate()) as AiMessageId);
    this._conversationUuid = params.conversationUuid;
    this._role = params.role;
    this._content = params.content;
    this._tokenCount = params.tokenCount ?? null;
    this._createdAt = params.createdAt;
  }

  public get uuid(): string {
    return String(this.id);
  }

  public get conversationUuid(): string {
    return this._conversationUuid;
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
    conversationUuid: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
  }): Message {
    return new Message({
      conversationUuid: params.conversationUuid,
      role: params.role,
      content: params.content,
      tokenCount: params.tokenCount,
      createdAt: new Date(),
    });
  }

  public static fromServerDTO(dto: MessageServerDTO): Message {
    return new Message({
      uuid: dto.uuid,
      conversationUuid: dto.conversationUuid,
      role: dto.role,
      content: dto.content,
      tokenCount: dto.tokenCount,
      createdAt: new Date(dto.createdAt),
    });
  }

  public static fromPersistenceDTO(dto: MessagePersistenceDTO): Message {
    return new Message({
      uuid: dto.uuid,
      conversationUuid: dto.conversationUuid,
      role: dto.role,
      content: dto.content,
      tokenCount: dto.tokenCount,
      createdAt: dto.createdAt,
    });
  }

  public toServerDTO(): MessageServerDTO {
    return {
      uuid: this.uuid,
      conversationUuid: this._conversationUuid,
      role: this._role,
      content: this._content,
      tokenCount: this._tokenCount,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(): MessageClientDTO {
    return {
      uuid: this.uuid,
      conversationUuid: this._conversationUuid,
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
      uuid: this.uuid,
      conversationUuid: this._conversationUuid,
      role: this._role,
      content: this._content,
      tokenCount: this._tokenCount,
      createdAt: this._createdAt,
    };
  }
}
