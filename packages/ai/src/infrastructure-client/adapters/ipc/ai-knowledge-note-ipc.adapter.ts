import type { AIKnowledgeNoteApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';

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
