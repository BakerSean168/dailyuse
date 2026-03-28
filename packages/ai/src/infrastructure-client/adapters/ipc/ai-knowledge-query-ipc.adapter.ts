import type { AIKnowledgeQueryApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIKnowledgeQueryIpcAdapter implements AIKnowledgeQueryApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async expandKnowledge(request: ExpandKnowledgeReq): Promise<ExpandKnowledgeRes> {
    const result = await this.ipcClient.invoke<ExpandKnowledgeRes>(AIChannels.KNOWLEDGE_EXPAND, request);
    return unwrapResultOrThrow(result);
  }

  async queryKnowledge(request: QueryKnowledgeReq): Promise<QueryKnowledgeRes> {
    const result = await this.ipcClient.invoke<QueryKnowledgeRes>(AIChannels.KNOWLEDGE_QUERY, request);
    return unwrapResultOrThrow(result);
  }

  async reindexKnowledge(request: ReindexKnowledgeReq): Promise<ReindexKnowledgeRes> {
    const result = await this.ipcClient.invoke<ReindexKnowledgeRes>(
      AIChannels.KNOWLEDGE_REINDEX,
      request,
    );
    return unwrapResultOrThrow(result);
  }
}
