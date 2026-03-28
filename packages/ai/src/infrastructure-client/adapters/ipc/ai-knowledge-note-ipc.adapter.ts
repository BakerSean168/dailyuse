import type { AIKnowledgeNoteApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIKnowledgeNoteIpcAdapter implements AIKnowledgeNoteApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes> {
    const result = await this.ipcClient.invoke<CreateKnowledgeNoteRes>(
      AIChannels.KNOWLEDGE_NOTE_CREATE,
      request,
    );
    return unwrapResultOrThrow(result);
  }
}
