import { AggregateRoot } from '@dailyuse/utils';
import type { AIConversationClientDTO, AIConversationServerDTO } from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';
import { AiConversationId } from '../../domain-shared/value-objects/ai-conversation-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { Message } from '../entities/message';

export interface AIConversationState {
  id: AiConversationId;
  identityId: IIdentityId;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
  messages: Message[];
}

export class AIConversation extends AggregateRoot<AiConversationId> {
  private _props: Omit<AIConversationState, 'id'>;

  private constructor(state: AIConversationState) {
    super(state.id);
    const { id: _, ...rest } = state;
    this._props = { ...rest };
  }

  public get identityId(): IIdentityId {
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

  public get messages(): Message[] {
    return [...this._props.messages];
  }

  public static create(params: { identityId: string; name: string }): AIConversation {
    const now = new Date();
    const conversation = new AIConversation({
      id: AiConversationId.generate(),
      identityId: IdentityId.of(params.identityId),
      name: params.name,
      status: ConversationStatus.Active,
      messageCount: 0,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      messages: [],
    });

    conversation.addDomainEvent('ai.conversation.created', {
      identityId: params.identityId,
      conversation: conversation.toServerDTO(),
    });

    return conversation;
  }

  public static load(state: AIConversationState): AIConversation {
    return new AIConversation(state);
  }

  public addMessage(message: Message): void {
    if (this._props.status !== ConversationStatus.Active) {
      throw new Error('Cannot add message to a non-active conversation');
    }
    this._props.messages.push(message);
    this._props.messageCount++;
    this._props.lastMessageAt = message.createdAt;
    this._props.updatedAt = new Date();

    this.addDomainEvent('ai.message.added', {
      identityId: String(this._props.identityId),
      conversationId: String(this.id),
      message: message.toServerDTO(),
    });
  }

  public getAllMessages(): Message[] {
    return [...this._props.messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  public getLatestMessage(): Message | null {
    if (this._props.messages.length === 0) {
      return null;
    }
    return this._props.messages.reduce((prev, current) =>
      prev.createdAt.getTime() > current.createdAt.getTime() ? prev : current,
    );
  }

  public updateStatus(status: ConversationStatus): void {
    if (this._props.status === status) return;
    const oldStatus = this._props.status;
    this._props.status = status;
    this._props.updatedAt = new Date();

    this.addDomainEvent('ai.conversation.status_changed', {
      identityId: String(this._props.identityId),
      conversationId: String(this.id),
      oldStatus,
      newStatus: status,
    });
  }

  public rename(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Conversation name cannot be empty');
    }

    this._props.name = trimmed;
    this._props.updatedAt = new Date();
  }

  public softDelete(): void {
    this._props.deletedAt = new Date();
    this._props.status = ConversationStatus.Archived;
    this._props.updatedAt = new Date();
  }

  public toServerDTO(includeChildren: boolean = false): AIConversationServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      status: this._props.status,
      messageCount: this._props.messageCount,
      lastMessageAt: this._props.lastMessageAt ? this._props.lastMessageAt.getTime() : null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      messages: includeChildren ? this._props.messages.map((m) => m.toServerDTO()) : null,
    };
  }

  public toClientDTO(): AIConversationClientDTO {
    return {
      id: String(this.id) as AIConversationClientDTO['id'],
      identityId: String(this._props.identityId) as AIConversationClientDTO['identityId'],
      name: this._props.name,
      status: this._props.status,
      messageCount: this._props.messageCount,
      lastMessageAt: this._props.lastMessageAt ? this._props.lastMessageAt.getTime() : null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      messages: null,
    };
  }
}
