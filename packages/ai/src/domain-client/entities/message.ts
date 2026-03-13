/**
 * Message Entity - Domain Client
 * 消息实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: MessageState): Message
 * - Instance toDTO(): MessageClientDTO
 */

import { Entity } from '@dailyuse/utils';
import type { MessageClientDTO } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import { AiMessageId } from '../../domain-shared/value-objects/ai-message-id';
import { AiConversationId } from '../../domain-shared/value-objects/ai-conversation-id';

export interface MessageState {
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

export class Message extends Entity<AiMessageId> {
  private readonly _props: MessageState;

  private constructor(props: MessageState) {
    super(props.id);
    this._props = props;
  }

  // ===== Getters =====

  public get conversationId(): AiConversationId {
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

  // ===== Computed Properties =====

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

  public static load(state: MessageState): Message {
    return new Message(state);
  }

  // ===== DTO Conversion =====

  public toDTO(): MessageClientDTO {
    return {
      id: String(this._props.id) as MessageClientDTO['id'],
      conversationId: String(this._props.conversationId) as MessageClientDTO['conversationId'],
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
