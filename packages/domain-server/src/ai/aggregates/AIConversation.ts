import { AggregateRoot } from '@dailyuse/utils';
import type {
  AIConversationClientDTO,
  AIConversationPersistenceDTO,
  AIConversationServer,
  AIConversationServerDTO,
} from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { Message } from '../entities/Message';

export class AIConversation extends AggregateRoot implements AIConversationServer {
  private _accountUuid: string;
  private _name: string;
  private _status: ConversationStatus;
  private _messageCount: number;
  private _lastMessageAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt: number | null;

  private _messages: Message[];

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    status: ConversationStatus;
    messageCount: number;
    lastMessageAt?: number | null;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
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

  public get name(): string {
    return this._name;
  }

  public get status(): ConversationStatus {
    return this._status;
  }

  public get messageCount(): number {
    return this._messageCount;
  }

  public get lastMessageAt(): number | null {
    return this._lastMessageAt;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get deletedAt(): number | null {
    return this._deletedAt;
  }

  public get messages(): Message[] {
    return [...this._messages];
  }

  public static create(params: { accountUuid: string; name: string }): AIConversation {
    const now = Date.now();
    const conversation = new AIConversation({
      accountUuid: params.accountUuid,
      name: params.name,
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
      occurredOn: new Date(now),
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
      name: dto.name,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
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
      name: dto.name,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt,
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
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'ai.message.added',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        conversationUuid: this.uuid,
        message: message.toServerDTO(),
      },
    });
  }

  public getAllMessages(): Message[] {
    return [...this._messages].sort((a, b) => a.createdAt - b.createdAt);
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
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'ai.conversation.status_changed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        conversationUuid: this.uuid,
        oldStatus,
        newStatus: status,
      },
    });
  }

  public softDelete(): void {
    this._deletedAt = Date.now();
    this._status = ConversationStatus.ARCHIVED;
    this._updatedAt = Date.now();
  }

  public toServerDTO(includeChildren: boolean = false): AIConversationServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      messages: includeChildren ? this._messages.map((m) => m.toServerDTO()) : null,
    };
  }

  public toClientDTO(): AIConversationClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      messages: null,
    };
  }

  public toPersistenceDTO(): AIConversationPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
