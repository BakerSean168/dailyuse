import { Entity } from '@dailyuse/utils';
import type {
  MessageClientDTO,
  MessagePersistenceDTO,
  MessageServer,
  MessageServerDTO,
} from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';

export class Message extends Entity implements MessageServer {
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
    createdAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._conversationUuid = params.conversationUuid;
    this._role = params.role;
    this._content = params.content;
    this._tokenCount = params.tokenCount ?? null;
    this._createdAt = params.createdAt;
  }

  public override get uuid(): string {
    return this._uuid;
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
      createdAt: new Date(dto.createdAt),
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
      isUser: this._role === MessageRole.USER,
      isAssistant: this._role === MessageRole.ASSISTANT,
      isSystem: this._role === MessageRole.SYSTEM,
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
      createdAt: this._createdAt.getTime(),
    };
  }
}
