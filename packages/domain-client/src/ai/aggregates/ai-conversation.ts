/**
 * AIConversation Aggregate Root - Domain Client
 * AI对话聚合根 - 领域客户端
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  AIConversationClient,
  AIConversationClientDTO,
} from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';
import { AiConversationId } from '@dailyuse/domain-shared/ai';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { Message } from '../entities/message';

export class AIConversation extends AggregateRoot<AiConversationId> implements AIConversationClient {
  private _identityId: IIdentityId;
  private _name: string;
  private _status: ConversationStatus;
  private _messageCount: number;
  private _lastMessageAt: Date | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _messages: Message[] | null;

  private constructor(params: {
    id?: string;
    identityId: string;
    name: string;
    status: ConversationStatus;
    messageCount: number;
    lastMessageAt?: Date | null;
    version?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    messages?: Message[] | null;
  }) {
    super(AiConversationId.of(params.id ?? AiConversationId.generate()));
    this._identityId = IdentityId.of(params.identityId);
    this._name = params.name;
    this._status = params.status;
    this._messageCount = params.messageCount;
    this._lastMessageAt = params.lastMessageAt ?? null;
    this._version = params.version ?? 1;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt ?? null;
    this._messages = params.messages ?? null;
  }

  // ===== Getters =====

  public get identityId(): IIdentityId {
    return this._identityId;
  }

  public get name(): string {
    return this._name;
  }

  public get status(): ConversationStatus {
    return this._status;
  }

  public get messageCount(): number {
    return this._messageCount;
  }

  public get lastMessageAt(): Date | null {
    return this._lastMessageAt;
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

  public get messages(): Message[] | null {
    return this._messages ? [...this._messages] : null;
  }

  // ===== Factory Methods =====

  public static create(params: { identityId: string; name: string }): AIConversation {
    const now = new Date();
    return new AIConversation({
      identityId: params.identityId,
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

  public static fromDTO(dto: AIConversationClientDTO): AIConversation {
    return new AIConversation({
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt ? new Date(dto.lastMessageAt) : null,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      messages: dto.messages ? dto.messages.map((m) => Message.fromDTO(m)) : null,
    });
  }

  // ===== DTO Conversion =====

  public toDTO(): AIConversationClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt?.getTime() ?? null,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      messages: this._messages ? this._messages.map((m) => m.toDTO()) : null,
    };
  }

  // ===== Business Logic =====

  public rename(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  public archive(): void {
    this._status = ConversationStatus.Archived;
    this._updatedAt = new Date();
  }
}
