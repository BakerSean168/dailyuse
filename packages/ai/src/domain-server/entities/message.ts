import { Entity } from '@dailyuse/utils';
import type {
  MessageClientDTO,
  MessageServerDTO,
} from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type { AiConversationId as IAiConversationId } from '@dailyuse/contracts/primitives';
import { AiMessageId } from '../../domain-shared/value-objects/ai-message-id';
import { AiConversationId } from '../../domain-shared/value-objects/ai-conversation-id';

export interface MessageState {
  id: AiMessageId;
  conversationId: IAiConversationId;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Message extends Entity<AiMessageId> {
  private _props: MessageState;

  private constructor(state: MessageState) {
    super(state.id);
    this._props = { ...state };
  }

  public get conversationId(): IAiConversationId {
    return this._props.conversationId;
  }

  public get role(): MessageRole {
    return this._props.role;
  }

  public get content(): string {
    return this._props.content;
  }

  public get tokenCount(): number | null {
    return this._props.tokenCount;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  public get version(): number {
    return this._props.version;
  }

  public static create(params: {
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
  }): Message {
    const now = new Date();
    return new Message({
      id: AiMessageId.generate(),
      conversationId: AiConversationId.of(params.conversationId),
      role: params.role,
      content: params.content,
      tokenCount: params.tokenCount ?? null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  public static load(state: MessageState): Message {
    return new Message(state);
  }

  public toServerDTO(): MessageServerDTO {
    return {
      id: this.id,
      conversationId: this._props.conversationId,
      role: this._props.role,
      content: this._props.content,
      tokenCount: this._props.tokenCount,
      createdAt: this._props.createdAt.getTime(),
    };
  }

  public toClientDTO(): MessageClientDTO {
    return {
      id: String(this.id),
      conversationId: String(this._props.conversationId),
      role: this._props.role,
      content: this._props.content,
      tokenCount: this._props.tokenCount,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      isUser: this._props.role === MessageRole.User,
      isAssistant: this._props.role === MessageRole.Assistant,
      isSystem: this._props.role === MessageRole.System,
      formattedTime: new Date(this._props.createdAt).toLocaleString(),
    };
  }
}
