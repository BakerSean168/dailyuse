import type { AIKnowledgeNoteApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@memoflow/contracts/electron';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@memoflow/contracts/ai';
import type { Result } from '@memoflow/contracts/result';

/** IPC adapter — returns Result, never throws (residual 98). */
export class AIKnowledgeNoteIpcAdapter implements AIKnowledgeNoteApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createKnowledgeNote(
    request: CreateKnowledgeNoteReq,
  ): Promise<Result<CreateKnowledgeNoteRes>> {
    return this.ipcClient.invoke<CreateKnowledgeNoteRes>(
      AIChannels.KNOWLEDGE_NOTE_CREATE,
      request,
    );
  }
}
