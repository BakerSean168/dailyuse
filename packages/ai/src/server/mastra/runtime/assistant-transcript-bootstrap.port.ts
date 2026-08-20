export interface AssistantTranscriptBootstrapMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly createdAt: number;
}

export interface AssistantTranscriptBootstrapSnapshot {
  readonly title?: string;
  readonly messages: readonly AssistantTranscriptBootstrapMessage[];
}

/**
 * Temporary migration seam used only to bootstrap an owned Conversation shell
 * into Mastra memory exactly once. Returning null means the authenticated
 * identity does not own (or cannot see) the requested conversation.
 */
export interface AssistantTranscriptBootstrapSource {
  load(input: {
    identityId: string;
    conversationId: string;
  }): Promise<AssistantTranscriptBootstrapSnapshot | null>;
}
