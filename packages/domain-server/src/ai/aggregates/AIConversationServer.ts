import { AggregateRoot } from '@dailyuse/utils';
import type {
  AIConversationClientDTO,
  AIConversationPersistenceDTO,
  AIConversationServer,
  AIConversationServerDTO,
} from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { Message } from '../entities/MessageServer';

export class AIConversation extends AggregateRoot implements AIConversationServer {
  private _accountUuid: string;
  private _title: string;
  private _status: ConversationStatus;
  private _messageCount: number;
  private _lastMessageAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private _messages: Message[];

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    status: ConversationStatus;
    messageCount: number;
    lastMessageAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._status = params.status;
    this._messageCount = params.messageCount;
    this._lastMessageAt = params.lastMessageAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt ?? null;
    this._messages = [];
  }

  public override get uuid(): string {
    return this._uuid;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get title(): string {
    return this._title;
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

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public get messages(): Message[] {
    return [...this._messages];
  }

  public static create(params: { accountUuid: string; title: string }): AIConversation {
    const now = new Date();
    const conversation = new AIConversation({
      accountUuid: params.accountUuid,
      title: params.title,
      status: ConversationStatus.ACTIVE,
      messageCount: 0,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    conversation.addDomainEvent({
      eventType: 'ai.conversation.created',
      aggregateId: conversation.uuid,
      occurredOn: now,
      accountUuid: params.accountUuid,
      payload: {
        conversation: conversation.toServerDTO(),
      },
    });

    return conversation;
  }

  public static fromServerDTO(dto: AIConversationServerDTO): AIConversation {
    const conversation = new AIConversation({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt ? new Date(dto.lastMessageAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });

    if (dto.messages) {
      conversation._messages = dto.messages.map((m) => Message.fromServerDTO(m));
    }

    return conversation;
  }

  public static fromPersistenceDTO(dto: AIConversationPersistenceDTO): AIConversation {
    return new AIConversation({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt ? new Date(dto.lastMessageAt) : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }

  public addMessage(message: Message): void {
    if (this._status !== ConversationStatus.ACTIVE) {
      throw new Error('Cannot add message to a non-active conversation');
    }
    this._messages.push(message);
    this._messageCount++;
    this._lastMessageAt = message.createdAt;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'ai.message.added',
      aggregateId: this.uuid,
      occurredOn: this._updatedAt,
      accountUuid: this._accountUuid,
      payload: {
        conversationUuid: this.uuid,
        message: message.toServerDTO(),
      },
    });
  }

  public getAllMessages(): Message[] {
    return [...this._messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  public getLatestMessage(): Message | null {
    if (this._messages.length === 0) {
      return null;
    }
    return this._messages.reduce((prev, current) =>
      prev.createdAt > current.createdAt ? prev : current,
    );
  }

  public updateStatus(status: ConversationStatus): void {
    if (this._status === status) return;
    const oldStatus = this._status;
    this._status = status;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'ai.conversation.status_changed',
      aggregateId: this.uuid,
      occurredOn: this._updatedAt,
      accountUuid: this._accountUuid,
      payload: {
        conversationUuid: this.uuid,
        oldStatus,
        newStatus: status,
      },
    });
  }

  public softDelete(): void {
    this._deletedAt = new Date();
    this._status = ConversationStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  public toServerDTO(includeChildren: boolean = false): AIConversationServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt ? this._lastMessageAt.getTime() : null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
      messages: includeChildren ? this._messages.map((m) => m.toServerDTO()) : null,
    };
  }

  public toClientDTO(): AIConversationClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt ? this._lastMessageAt.getTime() : null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      messages: null,
      isActive: this._status === ConversationStatus.ACTIVE,
      isClosed: this._status === ConversationStatus.CLOSED,
      isArchived: this._status === ConversationStatus.ARCHIVED,
      canAddMessage: this._status === ConversationStatus.ACTIVE,
      statusText: this._status,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
      formattedLastMessageAt: this._lastMessageAt
        ? this._lastMessageAt.toLocaleString()
        : null,
    };
  }

  public toPersistenceDTO(): AIConversationPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt ? this._lastMessageAt.getTime() : null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
