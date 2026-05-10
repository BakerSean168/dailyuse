import type { IResultHttpClient } from '@dailyuse/http-client';

import { createAIHttpAdapters } from '../infrastructure-client';
import { AIClientService, createAIClientService } from './ai-client-service';

export function createAIServiceFromHttpClient(httpClient: IResultHttpClient): AIClientService {
  const adapters = createAIHttpAdapters(httpClient);
  return createAIClientService(
    adapters.capabilities,
    adapters.evaluationReport,
    adapters.providerConfig,
    adapters.conversation,
    adapters.message,
    adapters.goal,
    adapters.knowledge,
    adapters.knowledgeNote,
    adapters.analytics,
  );
}
