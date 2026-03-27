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

export class AIKnowledgeQueryIpcAdapter implements AIKnowledgeQueryApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async expandKnowledge(request: ExpandKnowledgeReq): Promise<ExpandKnowledgeRes> {
    const result = await this.ipcClient.invoke<ExpandKnowledgeRes>(AIChannels.KNOWLEDGE_EXPAND, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async queryKnowledge(request: QueryKnowledgeReq): Promise<QueryKnowledgeRes> {
    const result = await this.ipcClient.invoke<QueryKnowledgeRes>(AIChannels.KNOWLEDGE_QUERY, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async reindexKnowledge(request: ReindexKnowledgeReq): Promise<ReindexKnowledgeRes> {
    const result = await this.ipcClient.invoke<ReindexKnowledgeRes>(
      AIChannels.KNOWLEDGE_REINDEX,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
