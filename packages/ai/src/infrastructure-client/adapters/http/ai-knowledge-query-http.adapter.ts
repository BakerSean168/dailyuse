import type { AIKnowledgeQueryApiClient, IResultHttpClient } from '../types';
import type {
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';

export class AIKnowledgeQueryHttpAdapter implements AIKnowledgeQueryApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async expandKnowledge(request: ExpandKnowledgeReq): Promise<ExpandKnowledgeRes> {
    const result = await this.httpClient.post<ExpandKnowledgeRes>('/ai/knowledge/expand', request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async queryKnowledge(request: QueryKnowledgeReq): Promise<QueryKnowledgeRes> {
    const result = await this.httpClient.post<QueryKnowledgeRes>('/ai/knowledge/query', request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async reindexKnowledge(request: ReindexKnowledgeReq): Promise<ReindexKnowledgeRes> {
    const result = await this.httpClient.post<ReindexKnowledgeRes>('/ai/knowledge/reindex', request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
