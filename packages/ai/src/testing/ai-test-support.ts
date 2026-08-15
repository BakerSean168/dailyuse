import { ok } from '@memoflow/contracts/result';
import type { AIProviderConfigServerDTO, IProposalKernelPort } from '@memoflow/contracts/ai';
import type { IdentityId } from '@memoflow/contracts';
import type { AiProviderConfigId } from '@memoflow/contracts/primitives';

import type { IAIConversationRepository, IAIProviderConfigRepository } from '../server/domain';
import type { IAIChatExecutionPort } from '../server/application/ports';
import type { AIAssistantFacadeControllerService } from '../server/transport/ai-assistant-facade.controller';
import { AssistantFacade } from '../server/infrastructure/assistant-facade/assistant.facade';
import { DirectTurnEngine } from '../server/infrastructure/turn-engine/direct-turn.engine';
import { AIConversation } from '../server/domain/aggregates/ai-conversation';
import {
  createAIModule,
  type AIModuleDependencies,
  type AIModuleInstance,
} from '../server/infrastructure';

export function createAIConversationRepositoryStub(
  overrides: Partial<IAIConversationRepository> = {},
): IAIConversationRepository {
  return {
    save: async () => {},
    findByIdForIdentity: async () => null,
    findByIdentityId: async () => [],
    delete: async () => {},
    ...overrides,
  };
}

export function createAIProviderConfigRepositoryStub(
  overrides: Partial<IAIProviderConfigRepository> = {},
): IAIProviderConfigRepository {
  return {
    save: async () => 'SAVED',
    findByIdForIdentity: async () => null,
    findByIdentityId: async () => [],
    findDefaultByIdentityId: async () => null,
    delete: async () => {},
    setDefaultForIdentity: async () => 'NOT_FOUND',
    ...overrides,
  };
}

export function createAIProviderConfigServerDTO(
  overrides: Partial<AIProviderConfigServerDTO> = {},
): AIProviderConfigServerDTO {
  return {
    id: 'provider-1' as AiProviderConfigId,
    identityId: 'identity-1' as IdentityId,
    name: 'Main provider',
    providerType: 'openai_compatible',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'plain-secret',
    defaultModel: 'gpt-4o-mini',
    availableModels: [],
    isActive: true,
    isDefault: true,
    priority: 100,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    ...overrides,
  };
}

export function createAIModuleForTests(
  overrides: Partial<AIModuleDependencies> = {},
): AIModuleInstance {
  return createAIModule({
    conversationRepository: createAIConversationRepositoryStub(),
    providerConfigRepository: createAIProviderConfigRepositoryStub(),
    ...overrides,
  });
}

/**
 * Builds a REAL assistant dispatch chain for integration/smoke tests: an
 * `AssistantFacade` over `DirectTurnEngine` over the supplied chat execution
 * port (e.g. `AIServiceChatExecutionAdapter` → real `AIServiceInternalClient`).
 * Only the transport (HTTP router/controller) and the chat port are injected by
 * the caller; the turn engine, facade and in-memory repos are production code.
 *
 * The returned service satisfies `AIAssistantFacadeControllerService` so the
 * smoke can mount the real `registerAIAssistantRoutes` SSE route and observe the
 * entry correlation `requestId` reaching the chat port (the Python boundary).
 *
 * 为集成/smoke 测试构建「真实」的 assistant dispatch 链：`AssistantFacade` 包裹
 * `DirectTurnEngine`，再包裹调用方注入的 chat execution port（例如
 * `AIServiceChatExecutionAdapter` → 真实 `AIServiceInternalClient`）。仅传输层
 * （HTTP router/controller）与 chat port 由调用方注入；turn engine、facade 与
 * 内存仓储均为生产代码。
 *
 * 返回的 service 满足 `AIAssistantFacadeControllerService`，因此 smoke 可以挂载
 * 真实 `registerAIAssistantRoutes` SSE 路由，并观察到入口 correlation
 * `requestId` 原样到达 chat port（Python 边界）。
 *
 * @param options - identity, chat port, and optional repository overrides.
 * @returns The dispatch service plus the created conversation id and identity.
 */
export function createRealAssistantDispatchService(options: {
  readonly identityId: string;
  readonly chatPort: IAIChatExecutionPort;
  readonly conversationRepository?: IAIConversationRepository;
  readonly providerConfigRepository?: IAIProviderConfigRepository;
}): {
  readonly service: AIAssistantFacadeControllerService;
  readonly conversationId: string;
  readonly identityId: string;
} {
  const { identityId, chatPort } = options;

  const conversation = AIConversation.create({ identityId, name: 'Smoke conversation' });
  const conversationRepository =
    options.conversationRepository ??
    createAIConversationRepositoryStub({
      findByIdForIdentity: async (_ownerIdentity, conversationId) =>
        conversationId === String(conversation.id) ? conversation : null,
    });

  const provider = createAIProviderConfigServerDTO({ identityId: identityId as IdentityId });
  const providerConfigRepository =
    options.providerConfigRepository ??
    createAIProviderConfigRepositoryStub({
      findByIdForIdentity: async () => provider,
      findDefaultByIdentityId: async () => provider,
      findByIdentityId: async () => [provider],
    });

  const turnEngine = new DirectTurnEngine(
    conversationRepository,
    providerConfigRepository,
    chatPort,
  );

  const proposalKernel: IProposalKernelPort = {
    create: async (proposal) => proposal,
    revise: async (_proposalId, next) => next,
    markStale: async () => {
      throw new Error('Proposal kernel stub: markStale is unsupported.');
    },
    approve: async () => {
      throw new Error('Proposal kernel stub: approve is unsupported.');
    },
    reject: async () => {
      throw new Error('Proposal kernel stub: reject is unsupported.');
    },
    executeApproved: async () => {
      throw new Error('Proposal kernel stub: executeApproved is unsupported.');
    },
  };

  const facade = new AssistantFacade(turnEngine, turnEngine, proposalKernel, turnEngine);
  const service: AIAssistantFacadeControllerService = {
    dispatchAssistant: async (command, handlers, signal, requestId) => {
      let eventCount = 0;
      for await (const event of facade.dispatch(command, signal, requestId)) {
        eventCount += 1;
        handlers.onEvent?.(event);
      }
      const result = ok({ eventCount });
      handlers.onDone?.(result.data);
      return result;
    },
  };

  return { service, conversationId: String(conversation.id), identityId };
}
