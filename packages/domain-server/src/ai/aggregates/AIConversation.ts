import { AggregateRoot } from '@dailyuse/utils';
import type {
  AIConversationClientDTO,
  AIConversationPersistenceDTO,
  AIConversationServer,
  AIConversationServerDTO,
} from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { AiConversationId } from '@dailyuse/domain-shared/ai';
import { Message } from '../entities/Message';

export class AIConversation extends AggregateRoot<AiConversationId> implements AIConversationServer {
  private _accountUuid: string;
  private _name: string;
  private _status: ConversationStatus;
  private _messageCount: number;
  private _lastMessageAt: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private _messages: Message[];

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    status: ConversationStatus;
    messageCount: number;
    lastMessageAt?: number | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }) {
    super(AiConversationId.of(params.uuid ?? AiConversationId.generate()));
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

  public get uuid(): string {
    return String(this.id);
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

  public static create(params: { accountUuid: string; name: string }): AIConversation {
    const now = new Date();
    const conversation = new AIConversation({
      accountUuid: params.accountUuid,
      name: params.name,
      status: ConversationStatus.Active,
      messageCount: 0,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    conversation.addDomainEvent('ai.conversation.created', {
      accountUuid: params.accountUuid,
      conversation: conversation.toServerDTO(),
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
      lastMessageAt: dto.lastMessageAt ?? null,
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
    if (this._status !== ConversationStatus.Active) {
      throw new Error('Cannot add message to a non-active conversation');
    }
    this._messages.push(message);
    this._messageCount++;
    this._lastMessageAt = message.createdAt.getTime();
    this._updatedAt = new Date();

    this.addDomainEvent('ai.message.added', {
      accountUuid: this._accountUuid,
      conversationUuid: this.uuid,
      message: message.toServerDTO(),
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
      prev.createdAt.getTime() > current.createdAt.getTime() ? prev : current,
    );
  }

  public updateStatus(status: ConversationStatus): void {
    if (this._status === status) return;
    const oldStatus = this._status;
    this._status = status;
    this._updatedAt = new Date();

    this.addDomainEvent('ai.conversation.status_changed', {
      accountUuid: this._accountUuid,
      conversationUuid: this.uuid,
      oldStatus,
      newStatus: status,
    });
  }

  public softDelete(): void {
    this._deletedAt = new Date();
    this._status = ConversationStatus.Archived;
    this._updatedAt = new Date();
  }

  public toServerDTO(includeChildren: boolean = false): AIConversationServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt,
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
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
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
