/**
 * Message Entity - Domain Client
 * 消息实体 - 领域客户�?
 */

import { Entity } from '@dailyuse/utils';
import type {
  MessageClient,
  MessageClientDTO,
} from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type { AiConversationId as IAiConversationId } from '@dailyuse/contracts/primitives';
import { AiMessageId, AiConversationId } from '@/domain-shared';

// 内部状态接�?
interface MessageState {
  id: AiMessageId;
  conversationId: AiConversationId;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Message extends Entity<AiMessageId> implements MessageClient {
  private readonly _props: MessageState;

  private constructor(props: MessageState) {
    super(props.id);
    this._props = props;
  }

  // ===== Getters =====

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

  public get version(): number {
    return this._props.version;
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

  // ===== 计算属�?=====

  public get isUser(): boolean {
    return this._props.role === MessageRole.User;
  }

  public get isAssistant(): boolean {
    return this._props.role === MessageRole.Assistant;
  }

  public get isSystem(): boolean {
    return this._props.role === MessageRole.System;
  }

  public get formattedTime(): string {
    return this._props.createdAt.toLocaleString();
  }

  // ===== Factory Methods =====

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

  public static fromDTO(dto: MessageClientDTO): Message {
    return new Message({
      id: AiMessageId.of(dto.id),
      conversationId: AiConversationId.of(dto.conversationId),
      role: dto.role,
      content: dto.content,
      tokenCount: dto.tokenCount,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ===== DTO Conversion =====

  public toDTO(): MessageClientDTO {
    return {
      id: String(this._props.id),
      conversationId: String(this._props.conversationId),
      role: this._props.role,
      content: this._props.content,
      tokenCount: this._props.tokenCount,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      isUser: this.isUser,
      isAssistant: this.isAssistant,
      isSystem: this.isSystem,
      formattedTime: this.formattedTime,
    };
  }
}
