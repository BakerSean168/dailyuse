import type { AIKnowledgeNoteApiClient, IResultHttpClient } from '../types';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';

/** HTTP adapter — returns Result, never throws (residual 98). */
export class AIKnowledgeNoteHttpAdapter implements AIKnowledgeNoteApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async createKnowledgeNote(
    request: CreateKnowledgeNoteReq,
  ): Promise<Result<CreateKnowledgeNoteRes>> {
    return this.httpClient.post<CreateKnowledgeNoteRes>('/ai/knowledge-notes', request);
  }
}
