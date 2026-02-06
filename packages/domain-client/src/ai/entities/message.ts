/**
 * Message Entity - Domain Client
 * 消息实体 - 领域客户端
 */

import { Entity } from '@dailyuse/utils';
import type {
  MessageClient,
  MessageClientDTO,
} from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type { AiConversationId as IAiConversationId } from '@dailyuse/contracts/primitives';
import { AiMessageId, AiConversationId } from '@dailyuse/domain-shared/ai';

export class Message extends Entity<AiMessageId> implements MessageClient {
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

  // ===== Getters =====

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

  public get version(): number {
    return this._version;
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

  // ===== 计算属性 =====

  public get isUser(): boolean {
    return this._role === MessageRole.User;
  }

  public get isAssistant(): boolean {
    return this._role === MessageRole.Assistant;
  }

  public get isSystem(): boolean {
    return this._role === MessageRole.System;
  }

  public get formattedTime(): string {
    return this._createdAt.toLocaleString();
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

  public static fromDTO(dto: MessageClientDTO): Message {
    return new Message({
      id: dto.id,
      conversationId: dto.conversationId,
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
      id: String(this.id),
      conversationId: String(this._conversationId),
      role: this._role,
      content: this._content,
      tokenCount: this._tokenCount,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      isUser: this.isUser,
      isAssistant: this.isAssistant,
      isSystem: this.isSystem,
      formattedTime: this.formattedTime,
    };
  }
}
