import type { AIKnowledgeNoteApiClient, IResultIpcClient } from '../types';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';

export class AIKnowledgeNoteIpcAdapter implements AIKnowledgeNoteApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes> {
    const result = await this.ipcClient.invoke<CreateKnowledgeNoteRes>(
      'ai:knowledge-note:create',
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
