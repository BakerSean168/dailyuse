import type { IResultHttpClient } from '@memoflow/http-client';

import { createAIHttpAdapters } from '../infrastructure-client';
import {
  AIClientService,
  createAIClientService,
  type CreateAIClientServiceOptions,
} from './ai-client-service';

export type AIServiceFromHttpClientOptions = CreateAIClientServiceOptions;

/**
 * Create the AI client service from an HTTP result client.
 * 从 HTTP result client 创建 AI 客户端服务。
 *
 * `dispatchPolicy` is host-provided (plan §3.2 / §4.5); production default is
 * `prefer_dispatch` and this factory never reads global environment variables.
 *
 * `dispatchPolicy` 由 host 显式传入（计划 §3.2 / §4.5）；生产缺省
 * `prefer_dispatch`，本工厂从不读取全局环境变量。
 */
export function createAIServiceFromHttpClient(
  httpClient: IResultHttpClient,
  options?: AIServiceFromHttpClientOptions,
): AIClientService {
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
    adapters.agentRuntime,
    adapters.assistant,
    options,
  );
}
