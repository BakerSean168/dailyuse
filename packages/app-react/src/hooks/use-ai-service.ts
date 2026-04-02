import { useRef } from 'react';

import { AIClientService } from '@dailyuse/ai/application-client';
import { createAIHttpAdapters } from '@dailyuse/ai/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useAIService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<AIClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createAIHttpAdapters(apiClient);
    serviceRef.current = new AIClientService(
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

  return serviceRef.current;
}
