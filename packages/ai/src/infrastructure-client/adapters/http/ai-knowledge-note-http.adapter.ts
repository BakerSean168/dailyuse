import type { AIKnowledgeNoteApiClient, IResultHttpClient } from '../types';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';

export class AIKnowledgeNoteHttpAdapter implements AIKnowledgeNoteApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes> {
    const result = await this.httpClient.post<CreateKnowledgeNoteRes>(
      '/ai/knowledge-notes',
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
