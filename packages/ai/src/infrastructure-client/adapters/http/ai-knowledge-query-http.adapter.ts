import type { AIKnowledgeQueryApiClient, IResultHttpClient } from '../types';
import type {
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIKnowledgeQueryHttpAdapter implements AIKnowledgeQueryApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async expandKnowledge(request: ExpandKnowledgeReq): Promise<ExpandKnowledgeRes> {
    const result = await this.httpClient.post<ExpandKnowledgeRes>('/ai/knowledge/expand', request);
    return unwrapResultOrThrow(result);
  }

  async queryKnowledge(request: QueryKnowledgeReq): Promise<QueryKnowledgeRes> {
    const result = await this.httpClient.post<QueryKnowledgeRes>('/ai/knowledge/query', request);
    return unwrapResultOrThrow(result);
  }

  async reindexKnowledge(request: ReindexKnowledgeReq): Promise<ReindexKnowledgeRes> {
    const result = await this.httpClient.post<ReindexKnowledgeRes>('/ai/knowledge/reindex', request);
    return unwrapResultOrThrow(result);
  }
}
