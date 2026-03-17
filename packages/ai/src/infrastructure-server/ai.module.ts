/**
 * createAIModule — explicit composition root for the AI server runtime.
 * createAIModule —— AI 模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * AI uses the governance module as its reference pattern: one composition root
 * per module, constructor injection only, no hidden service locator.
 * AI 模块以 governance 模块为参考模式：每个模块一个组合根，
 * 仅使用构造器注入，不使用隐藏的服务定位器。
 *
 * @see {@link createGovernanceModule} in @dailyuse/governance for the canonical example.
 */

import type { IAIConversationRepository, IAIProviderConfigRepository } from '../domain-server';
import type { IKnowledgeNotePersistencePort } from '../application-server/ports';

import {
  CreateConversation,
  DeleteConversation,
  SendMessage,
  GenerateGoal,
  AIConversationService,
  AIProviderConfigService,
  AIChatApplicationService,
  GoalGenerationApplicationService,
  AIKnowledgeNoteService,
} from '../application-server/use-cases';
import { ListConversations, ListProviders, GetConversation } from '../application-server/use-cases';
import { OpenAICompatibleGateway } from './gateways/openai-compatible.gateway';
import { AIKnowledgeNotePathResolver } from './services/ai-knowledge-note-path-resolver';

import type {
  AIConversationClientDTO,
  ConversationListRes,
  GetConversationRes,
  SendMessageRes,
  GenerateGoalsReq,
  GenerateGoalsRes,
  CreateConversationReq,
  UpdateConversationReq,
  UpdateConversationRes,
  CreateAIProviderConfigReq,
  CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq,
  UpdateAIProviderConfigRes,
  TestAIProviderReq,
  TestAIProviderRes,
  AIProviderConfigClientDTO,
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
} from '@dailyuse/contracts/ai';

// ---------------------------------------------------------------------------
// Dependencies — AI 模块服务端运行时向外部索取的全部依赖
// ---------------------------------------------------------------------------

/**
 * Everything the AI server runtime needs from the outside world.
 * AI 模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * - only put ports or runtime contributions here
 * - never put transport objects (Express req/res, ipcMain, Router) here
 * - never hide these dependencies behind a singleton container
 */
export interface AIModuleDependencies {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;

  /**
   * Knowledge-note persistence is an external collaborator.
   * 知识笔记持久化是一个外部协作者。
   *
   * The host application (API / Electron) decides how notes are stored.
   * 宿主应用（API / Electron）决定笔记如何存储。
   */
  readonly knowledgeNotePersistence?: IKnowledgeNotePersistencePort;

  /**
   * Resolves the knowledge-note subdirectory for a given identity.
   * 根据身份 ID 解析知识笔记子目录。
   */
  readonly getKnowledgeNoteSubpath?: (identityId: string) => Promise<string>;

  /**
   * Optional runtime side effects to start/stop with the module.
   * 可选的运行时副作用，随模块一起启动/停止。
   */
  readonly runtimeContributions?: AIRuntimeContributionsInput;
}

// ---------------------------------------------------------------------------
// Runtime contributions — 模块拥有的运行时副作用
// ---------------------------------------------------------------------------

export type AIRuntimeContributionsInput =
  | AIModuleRuntimeContribution
  | readonly AIModuleRuntimeContribution[];

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 */
export interface AIModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

// ---------------------------------------------------------------------------
// Use Cases — 已完成接线的底层 use case 集合
// ---------------------------------------------------------------------------

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * We keep this type because tests and low-level assembly sometimes need direct
 * access to use-case objects, but transports should prefer `AIApplicationPort`.
 */
export interface AIModuleUseCases {
  readonly createConversation: CreateConversation;
  readonly deleteConversation: DeleteConversation;
  readonly listConversations: ListConversations;
  readonly listProviders: ListProviders;
  readonly getConversation: GetConversation;
  readonly sendMessage: SendMessage;
  readonly generateGoal: GenerateGoal;
}

/**
 * Higher-level assembled services used by controllers.
 * 控制器使用的高层服务集合。
 *
 * These wrap use cases with richer orchestration (multi-step flows,
 * event emission, provider resolution, etc.).
 */
export interface AIModuleServices {
  readonly conversationService: AIConversationService;
  readonly providerConfigService: AIProviderConfigService;
  readonly chatService: AIChatApplicationService;
  readonly goalGenerationService: GoalGenerationApplicationService;
  readonly knowledgeNoteService: AIKnowledgeNoteService | null;
}

// ---------------------------------------------------------------------------
// Application Port — 传输层无关的可调用应用层门面
// ---------------------------------------------------------------------------

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface AIApplicationPort {
  // -- Provider Config --
  createProvider(
    identityId: string,
    req: CreateAIProviderConfigReq,
  ): Promise<CreateAIProviderConfigRes>;
  updateProvider(id: string, req: UpdateAIProviderConfigReq): Promise<UpdateAIProviderConfigRes>;
  deleteProvider(id: string): Promise<void>;
  getProvider(id: string): Promise<AIProviderConfigClientDTO>;
  listProviders(identityId: string): Promise<AIProviderConfigClientDTO[]>;
  testConnection(req: TestAIProviderReq): Promise<TestAIProviderRes>;
  setDefaultProvider(id: string, identityId: string): Promise<void>;

  // -- Conversations --
  createConversation(identityId: string, name?: string): Promise<AIConversationClientDTO>;
  updateConversation(id: string, req: UpdateConversationReq): Promise<UpdateConversationRes>;
  listConversations(
    identityId: string,
    page?: number,
    pageSize?: number,
  ): Promise<ConversationListRes>;
  getConversation(
    id: string,
    includeMessages?: boolean,
  ): ReturnType<AIConversationService['getConversation']>;
  deleteConversation(id: string): Promise<void>;

  // -- Chat --
  sendMessage(
    identityId: string,
    conversationId: string,
    content: string,
    providerId?: string,
  ): Promise<SendMessageRes>;

  // -- Goal Generation --
  generateGoal(params: GenerateGoalsReq & { identityId: string }): Promise<GenerateGoalsRes>;

  // -- Knowledge Notes --
  createKnowledgeNote(
    identityId: string,
    req: CreateKnowledgeNoteReq,
  ): Promise<CreateKnowledgeNoteRes>;
}

// ---------------------------------------------------------------------------
// Module Instance — 主组合根返回类型
// ---------------------------------------------------------------------------

/**
 * Primary AI composition root return type.
 * AI 模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `services` exposes higher-level orchestrators.
 * `start` / `dispose` own runtime side effects.
 */
export interface AIModuleInstance {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly useCases: AIModuleUseCases;
  readonly services: AIModuleServices;
  readonly api: AIApplicationPort;
  start(): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRuntimeContributions(
  runtimeContributions?: AIRuntimeContributionsInput,
): readonly AIModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as AIModuleRuntimeContribution];
}

// ---------------------------------------------------------------------------
// Use-case assembly — 纯组装函数
// ---------------------------------------------------------------------------

/**
 * Pure assembly helper used by the composition root and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
export function createAIUseCases(
  dependencies: Pick<AIModuleDependencies, 'conversationRepository' | 'providerConfigRepository'>,
): AIModuleUseCases {
  const { conversationRepository, providerConfigRepository } = dependencies;

  return {
    createConversation: new CreateConversation(conversationRepository),
    deleteConversation: new DeleteConversation(conversationRepository),
    listConversations: new ListConversations(conversationRepository),
    listProviders: new ListProviders(providerConfigRepository),
    getConversation: new GetConversation(conversationRepository),
    sendMessage: new SendMessage(conversationRepository),
    generateGoal: new GenerateGoal(providerConfigRepository),
  };
}

/**
 * Pure assembly helper for higher-level services.
 * 纯组装函数：给定依赖对象，返回已接好线的服务集合。
 */
export function createAIServices(dependencies: AIModuleDependencies): AIModuleServices {
  const { conversationRepository, providerConfigRepository } = dependencies;

  const conversationService = new AIConversationService(conversationRepository);
  const providerConfigService = new AIProviderConfigService(providerConfigRepository);
  const chatService = new AIChatApplicationService(
    conversationRepository,
    providerConfigRepository,
  );
  const goalGenerationService = new GoalGenerationApplicationService(
    null,
    providerConfigRepository,
    null,
    null,
  );

  const knowledgeNoteService =
    dependencies.knowledgeNotePersistence && dependencies.getKnowledgeNoteSubpath
      ? new AIKnowledgeNoteService(
          providerConfigRepository,
          new OpenAICompatibleGateway(),
          dependencies.knowledgeNotePersistence,
          dependencies.getKnowledgeNoteSubpath,
          new AIKnowledgeNotePathResolver(),
        )
      : null;

  return {
    conversationService,
    providerConfigService,
    chatService,
    goalGenerationService,
    knowledgeNoteService,
  };
}

// ---------------------------------------------------------------------------
// Composition Root — 规范化的 AI 模块主组合根
// ---------------------------------------------------------------------------

/**
 * Canonical composition root.
 * 规范化的 AI 模块主组合根。
 *
 * This is modelled after the governance module. The expected reading order is:
 * 1. define `Dependencies`
 * 2. define transport-neutral `ApplicationPort`
 * 3. assemble use cases once
 * 4. wrap them in `api`
 * 5. let the module instance own `start` / `dispose`
 */
export function createAIModule(dependencies: AIModuleDependencies): AIModuleInstance {
  const { conversationRepository, providerConfigRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createAIUseCases({ conversationRepository, providerConfigRepository });
  const services = createAIServices(dependencies);
  let started = false;

  const api: AIApplicationPort = {
    // -- Provider Config --
    createProvider: (identityId, req) =>
      services.providerConfigService.createProvider(identityId, req),
    updateProvider: (id, req) => services.providerConfigService.updateProvider(id, req),
    deleteProvider: (id) => services.providerConfigService.deleteProvider(id),
    getProvider: (id) => services.providerConfigService.getProvider(id),
    listProviders: (identityId) => services.providerConfigService.listProviders(identityId),
    testConnection: (req) => services.providerConfigService.testConnection(req),
    setDefaultProvider: (id, identityId) =>
      services.providerConfigService.setDefaultProvider(id, identityId),

    // -- Conversations --
    createConversation: (identityId, name) =>
      services.conversationService.createConversation(identityId, name),
    updateConversation: (id, req) => services.conversationService.updateConversation(id, req),
    listConversations: (identityId, page, pageSize) =>
      services.conversationService.listConversations(identityId, page, pageSize),
    getConversation: (id, includeMessages) =>
      services.conversationService.getConversation(id, includeMessages),
    deleteConversation: (id) => services.conversationService.deleteConversation(id),

    // -- Chat --
    sendMessage: (identityId, conversationId, content, providerId) =>
      services.chatService.sendMessage(identityId, conversationId, content, providerId),

    // -- Goal Generation --
    generateGoal: (params) => services.goalGenerationService.generateGoal(params),

    // -- Knowledge Notes --
    createKnowledgeNote: (identityId, req) => {
      if (!services.knowledgeNoteService) {
        return Promise.reject(
          new Error(
            'Knowledge-note persistence was not provided to createAIModule. ' +
              '知识笔记持久化端口未注入到 createAIModule。',
          ),
        );
      }
      return services.knowledgeNoteService.createKnowledgeNote(identityId, req);
    },
  };

  return {
    conversationRepository,
    providerConfigRepository,
    useCases,
    services,
    api,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
