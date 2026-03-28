import type { AIKnowledgeNoteApiClient, IResultHttpClient } from '../types';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIKnowledgeNoteHttpAdapter implements AIKnowledgeNoteApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes> {
    const result = await this.httpClient.post<CreateKnowledgeNoteRes>(
      '/ai/knowledge-notes',
      request,
    );
    return unwrapResultOrThrow(result);
  }
}
