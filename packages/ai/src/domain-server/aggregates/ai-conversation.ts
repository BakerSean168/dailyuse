import { AggregateRoot } from '@dailyuse/utils';
import type {
  AIConversationClientDTO,
  AIConversationPersistenceDTO,
  AIConversationServer,
  AIConversationServerDTO,
} from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';
import { AiConversationId } from '../../domain-shared/value-objects/ai-conversation-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { Message } from '../entities/message';

export class AIConversation extends AggregateRoot<AiConversationId> implements AIConversationServer {
  private _identityId: IIdentityId;
  private _name: string;
  private _status: ConversationStatus;
  private _messageCount: number;
  private _lastMessageAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _version: number;

  private _messages: Message[];

  private constructor(params: {
    id?: string;
    identityId: string;
    name: string;
    status: ConversationStatus;
    messageCount: number;
    lastMessageAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    version?: number;
  }) {
    super(AiConversationId.of(params.id ?? AiConversationId.generate()));
    this._identityId = IdentityId.of(params.identityId);
    this._name = params.name;
    this._status = params.status;
    this._messageCount = params.messageCount;
    this._lastMessageAt = params.lastMessageAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt ?? null;
    this._version = params.version ?? 1;
    this._messages = [];
  }

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

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public get version(): number {
    return this._version;
  }

  public get messages(): Message[] {
    return [...this._messages];
  }

  public static create(params: { identityId: string; name: string }): AIConversation {
    const now = new Date();
    const conversation = new AIConversation({
      identityId: params.identityId,
      name: params.name,
      status: ConversationStatus.Active,
      messageCount: 0,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    conversation.addDomainEvent('ai.conversation.created', {
      identityId: params.identityId,
      conversation: conversation.toServerDTO(),
    });

    return conversation;
  }

  public static fromServerDTO(dto: AIConversationServerDTO): AIConversation {
    const conversation = new AIConversation({
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt ? new Date(dto.lastMessageAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      version: dto.version,
    });

    if (dto.messages) {
      conversation._messages = dto.messages.map((m) => Message.fromServerDTO(m));
    }

    return conversation;
  }

  public static fromPersistenceDTO(dto: AIConversationPersistenceDTO): AIConversation {
    const conversation = new AIConversation({
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      version: dto.version,
    });

    if (dto.messages) {
      conversation._messages = dto.messages.map((m) => Message.fromPersistenceDTO(m));
    }

    return conversation;
  }

  public addMessage(message: Message): void {
    if (this._status !== ConversationStatus.Active) {
      throw new Error('Cannot add message to a non-active conversation');
    }
    this._messages.push(message);
    this._messageCount++;
    this._lastMessageAt = message.createdAt;
    this._updatedAt = new Date();

    this.addDomainEvent('ai.message.added', {
      identityId: String(this._identityId),
      conversationId: String(this.id),
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
      identityId: String(this._identityId),
      conversationId: String(this.id),
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
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt ? this._lastMessageAt.getTime() : null,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
      messages: includeChildren ? this._messages.map((m) => m.toServerDTO()) : null,
    };
  }

  public toClientDTO(): AIConversationClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt ? this._lastMessageAt.getTime() : null,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      messages: null,
    };
  }

  public toPersistenceDTO(): AIConversationPersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      messages: this._messages.length > 0 ? this._messages.map((m) => m.toPersistenceDTO()) : null,
    };
  }
}
