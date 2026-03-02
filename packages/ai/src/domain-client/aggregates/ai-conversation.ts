/**
 * AIConversation Aggregate Root - Domain Client
 * AI对话聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: AIConversationState): AIConversation
 * - Instance toDTO(): AIConversationClientDTO
 */

import { AggregateRoot } from '@dailyuse/utils';
import type { AIConversationClientDTO } from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { AiConversationId } from '../../domain-shared/value-objects/ai-conversation-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { Message } from '../entities/message';

export interface AIConversationState {
  id: AiConversationId;
  identityId: IdentityId;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  messages: Message[] | null;
}

export class AIConversation extends AggregateRoot<AiConversationId> {
  private _props: AIConversationState;

  private constructor(props: AIConversationState) {
    super(props.id);
    this._props = props;
  }

  // ===== Getters =====

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.name;
  }

  public get status(): ConversationStatus {
    return this._props.status;
  }

  public get messageCount(): number {
    return this._props.messageCount;
  }

  public get lastMessageAt(): Date | null {
    return this._props.lastMessageAt;
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

  public get messages(): Message[] | null {
    return this._props.messages ? [...(this._props.messages as Message[])] : null;
  }

  // ===== Factory Methods =====

  public static create(params: { identityId: string; name: string }): AIConversation {
    const now = new Date();
    return new AIConversation({
      id: AiConversationId.of(AiConversationId.generate()),
      identityId: IdentityId.of(params.identityId),
      name: params.name,
      status: ConversationStatus.Active,
      messageCount: 0,
      lastMessageAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      messages: [],
    });
  }

  public static load(state: AIConversationState): AIConversation {
    return new AIConversation(state);
  }

  // ===== DTO Conversion =====

  public toDTO(): AIConversationClientDTO {
    return {
      id: String(this._props.id) as AIConversationClientDTO['id'],
      identityId: String(this._props.identityId) as AIConversationClientDTO['identityId'],
      name: this._props.name,
      status: this._props.status,
      messageCount: this._props.messageCount,
      lastMessageAt: this._props.lastMessageAt?.getTime() ?? null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      messages: this._props.messages
        ? (this._props.messages as Message[]).map((m) => m.toDTO())
        : null,
    };
  }

  // ===== Business Logic =====

  public rename(name: string): void {
    (this._props as { name: string }).name = name;
    (this._props as { updatedAt: Date }).updatedAt = new Date();
  }

  public archive(): void {
    (this._props as { status: ConversationStatus }).status = ConversationStatus.Archived;
    (this._props as { updatedAt: Date }).updatedAt = new Date();
  }
}
