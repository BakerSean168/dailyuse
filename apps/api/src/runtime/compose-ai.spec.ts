/**
 * AI API runtime composer spec.
 * AI API runtime composer 测试。
 *
 * Verifies composeAI():
 * - assembles AI in the mandated plan §2.3 order
 *   (Prisma set → config resolve → host adapters → service adapters →
 *   createAIModule → createAIApiModule({ instance }))
 * - creates the Prisma repository set exactly once with the exact db identity
 * - resolves config with both injected and lazy (omitted/undefined) semantics
 *   and treats explicit `null` as disabled without an environment read
 * - forwards the six-field repository set (incl. the checkpoint pair) and the
 *   five host ports into createAIModule with exact object identity
 * - constructs the executor with the injected Goal/Task/Reminder application
 *   ports plus the SAME knowledge-source / analytics-read adapters used by the
 *   AI module (single module instance set)
 *
 * 验证 composeAI()：
 * - 按计划 §2.3 顺序装配 AI（Prisma 集合 → config 解析 → 宿主 adapter →
 *   服务 adapter → createAIModule → createAIApiModule({ instance })）
 * - 恰好一次创建 Prisma 仓储集合，且传入的 db 对象 identity 精确
 * - 同时覆盖注入与延迟（省略/undefined）两种 config 解析语义，显式 `null`
 *   视为禁用且不做环境读取
 * - 把六字段仓储集合（含 checkpoint pair）与五个宿主 port 以精确对象 identity
 *   传入 createAIModule
 * - 用注入的 Goal/Task/Reminder application port 加上与 AI 模块相同的
 *   knowledge-source / analytics-read adapter（单套 module instance）构造 executor
 *
 * All package factories/classes and the app-local host adapters are mocked with
 * vi.fn() so the spec can assert invocation order and constructor arguments.
 *
 * 所有 package 工厂/类与 app-local 宿主 adapter 都用 vi.fn() mock，以便断言
 * 调用顺序与构造参数。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { RepositoryApplicationPort } from '@memoflow/repository';
import type { GoalApplicationPort } from '@memoflow/goal';
import type { TaskApplicationPort } from '@memoflow/task';
import type { ReminderApplicationPort } from '@memoflow/reminder';

vi.mock('@memoflow/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/ai')>();
  return {
    ...actual,
    AIEvaluationReportFileAdapter: vi.fn(),
    AIServiceAgentRuntimeAdapter: vi.fn(),
    AIServiceAnalyticsQueryAdapter: vi.fn(),
    AIServiceChatExecutionAdapter: vi.fn(),
    AIServiceGoalAutomationAdapter: vi.fn(),
    AIServiceGoalPlanningAdapter: vi.fn(),
    AIServiceKnowledgeIngestionAdapter: vi.fn(),
    AIServiceKnowledgeNoteGenerationAdapter: vi.fn(),
    AIServiceKnowledgeQueryAdapter: vi.fn(),
    createAIModule: vi.fn(),
    createAIPrismaRepositories: vi.fn(),
    createMastraStorage: vi.fn(() => ({ tag: 'mastra-storage' })),
    ConversationTranscriptBootstrapSource: vi.fn(
      function ConversationTranscriptBootstrapSourceMock() {
        return { tag: 'transcript-bootstrap-source' };
      },
    ),
    MastraModelResolver: vi.fn(function MastraModelResolverMock() {
      return { tag: 'mastra-model-resolver' };
    }),
    MastraAIRuntime: vi.fn(function MastraAIRuntimeMock(input: unknown) {
      return { tag: 'mastra-runtime', input };
    }),
    getAIServiceRuntimeConfig: vi.fn(),
  };
});

vi.mock('@memoflow/ai/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/ai/api')>();
  return {
    ...actual,
    createAIApiModule: vi.fn(),
  };
});

vi.mock('../modules/ai/repository-knowledge-note-persistence.adapter', () => ({
  RepositoryKnowledgeNotePersistenceAdapter: vi.fn(),
}));
vi.mock('../modules/ai/repository-knowledge-source.adapter', () => ({
  RepositoryKnowledgeSourceAdapter: vi.fn(),
}));
vi.mock('../modules/ai/repository-knowledge-index-status.adapter', () => ({
  RepositoryKnowledgeIndexStatusAdapter: vi.fn(),
}));
vi.mock('../modules/ai/controlled-analytics-read.adapter', () => ({
  ControlledAnalyticsReadAdapter: vi.fn(),
}));
vi.mock('../modules/ai/backend-automation-tool-executor.adapter', () => ({
  BackendAutomationToolExecutorAdapter: vi.fn(),
}));

import { composeAI } from './compose-ai';
import {
  AIEvaluationReportFileAdapter,
  AIServiceAgentRuntimeAdapter,
  AIServiceAnalyticsQueryAdapter,
  AIServiceChatExecutionAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
  AIServiceKnowledgeQueryAdapter,
  createAIModule,
  createAIPrismaRepositories,
  createMastraStorage,
  ConversationTranscriptBootstrapSource,
  MastraAIRuntime,
  MastraModelResolver,
  getAIServiceRuntimeConfig,
  type AIServiceRuntimeConfig,
} from '@memoflow/ai';
import { createAIApiModule } from '@memoflow/ai/api';
import { BackendAutomationToolExecutorAdapter } from '../modules/ai/backend-automation-tool-executor.adapter';
import { ControlledAnalyticsReadAdapter } from '../modules/ai/controlled-analytics-read.adapter';
import { RepositoryKnowledgeIndexStatusAdapter } from '../modules/ai/repository-knowledge-index-status.adapter';
import { RepositoryKnowledgeNotePersistenceAdapter } from '../modules/ai/repository-knowledge-note-persistence.adapter';
import { RepositoryKnowledgeSourceAdapter } from '../modules/ai/repository-knowledge-source.adapter';

const fakeDb = { tag: 'fake-db' } as unknown as PrismaClient;
const fakeRepositoryApiPort = {
  tag: 'fake-repository-port',
} as unknown as RepositoryApplicationPort;
const fakeGoalApplicationPort = { tag: 'fake-goal-port' } as unknown as GoalApplicationPort;
const fakeTaskApplicationPort = { tag: 'fake-task-port' } as unknown as TaskApplicationPort;
const fakeReminderApplicationPort = {
  tag: 'fake-reminder-port',
} as unknown as ReminderApplicationPort;
const fakeStorageBaseDir = '/tmp/fake-repository-storage';
const fakeMastraStorage = {
  kind: 'postgres' as const,
  connectionString: 'postgresql://memoflow:test@127.0.0.1:5432/memoflow_test',
};

const aiDependencies = {
  db: fakeDb,
  repositoryApiPort: fakeRepositoryApiPort,
  repositoryStorageBaseDir: fakeStorageBaseDir,
  goalApplicationPort: fakeGoalApplicationPort,
  taskApplicationPort: fakeTaskApplicationPort,
  reminderApplicationPort: fakeReminderApplicationPort,
  mastraStorage: fakeMastraStorage,
};

const mockRepositorySet = {
  conversationRepository: { tag: 'conversation' },
  providerConfigRepository: { tag: 'provider-config' },
  knowledgeIndexRepository: { tag: 'knowledge-index' },
  executionLogPort: { tag: 'execution-log' },
  agentCheckpointPort: { tag: 'agent-checkpoint' },
  langGraphCheckpointPort: { tag: 'langgraph-checkpoint' },
};

const serviceAdapterMocks = [
  AIServiceGoalPlanningAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeQueryAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
  AIServiceAnalyticsQueryAdapter,
  AIServiceAgentRuntimeAdapter,
];

const hostAdapterMocks = [
  RepositoryKnowledgeNotePersistenceAdapter,
  RepositoryKnowledgeSourceAdapter,
  RepositoryKnowledgeIndexStatusAdapter,
  ControlledAnalyticsReadAdapter,
  BackendAutomationToolExecutorAdapter,
];

const servicePortKeys = new Map<unknown, string>([
  [AIServiceGoalPlanningAdapter, 'goalPlanningPort'],
  [AIServiceGoalAutomationAdapter, 'goalAutomationPlanningPort'],
  [AIServiceKnowledgeIngestionAdapter, 'knowledgeIngestionPort'],
  [AIServiceKnowledgeQueryAdapter, 'knowledgeQueryPort'],
  [AIServiceKnowledgeNoteGenerationAdapter, 'knowledgeNoteGenerationPort'],
  [AIServiceAnalyticsQueryAdapter, 'analyticsQueryPort'],
  [AIServiceAgentRuntimeAdapter, 'agentRuntimePort'],
]);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createAIPrismaRepositories).mockReturnValue(
    mockRepositorySet as ReturnType<typeof createAIPrismaRepositories>,
  );
  vi.mocked(createAIApiModule).mockReturnValue({
    name: 'AI',
    register: vi.fn(),
    destroy: vi.fn(),
  });
  vi.mocked(createAIModule).mockReturnValue({
    api: {},
    start: vi.fn(),
    dispose: vi.fn(),
  } as ReturnType<typeof createAIModule>);
});

describe('composeAI assembly order', () => {
  it('assembles in plan §2.3 order and returns an IApiModule-compatible handle', () => {
    composeAI(aiDependencies);

    const prismaOrder = vi.mocked(createAIPrismaRepositories).mock.invocationCallOrder[0];
    const storageOrder = vi.mocked(createMastraStorage).mock.invocationCallOrder[0];
    const resolverOrder = vi.mocked(MastraModelResolver).mock.invocationCallOrder[0];
    const bootstrapOrder = vi.mocked(ConversationTranscriptBootstrapSource).mock
      .invocationCallOrder[0];
    const mastraRuntimeOrder = vi.mocked(MastraAIRuntime).mock.invocationCallOrder[0];
    const configOrder = vi.mocked(getAIServiceRuntimeConfig).mock.invocationCallOrder[0];
    const firstHostOrder = hostAdapterMocks
      .map((adapter) => vi.mocked(adapter).mock.invocationCallOrder[0])
      .filter((order) => order !== undefined)
      .sort((a, b) => a - b)[0];
    const moduleOrder = vi.mocked(createAIModule).mock.invocationCallOrder[0];
    const apiModuleOrder = vi.mocked(createAIApiModule).mock.invocationCallOrder[0];

    expect(prismaOrder).toBeLessThan(storageOrder);
    expect(storageOrder).toBeLessThan(resolverOrder);
    expect(resolverOrder).toBeLessThan(bootstrapOrder);
    expect(bootstrapOrder).toBeLessThan(mastraRuntimeOrder);
    expect(mastraRuntimeOrder).toBeLessThan(configOrder);
    expect(configOrder).toBeLessThan(firstHostOrder);
    expect(firstHostOrder).toBeLessThan(moduleOrder);
    expect(moduleOrder).toBeLessThan(apiModuleOrder);

    const handle = vi.mocked(createAIApiModule).mock.results[0].value;
    expect(handle).toMatchObject({ name: 'AI' });
    expect(typeof handle.register).toBe('function');
    expect(typeof handle.destroy).toBe('function');
  });

  it('composes one Postgres-backed Mastra runtime from the host storage config and identity-scoped provider repository', () => {
    composeAI(aiDependencies);

    expect(createMastraStorage).toHaveBeenCalledTimes(1);
    expect(createMastraStorage).toHaveBeenCalledWith(fakeMastraStorage);
    expect(MastraModelResolver).toHaveBeenCalledTimes(1);
    expect(MastraModelResolver).toHaveBeenCalledWith(mockRepositorySet.providerConfigRepository);

    const storage = vi.mocked(createMastraStorage).mock.results[0].value;
    const resolver = vi.mocked(MastraModelResolver).mock.results[0].value;
    expect(ConversationTranscriptBootstrapSource).toHaveBeenCalledTimes(1);
    expect(ConversationTranscriptBootstrapSource).toHaveBeenCalledWith(
      mockRepositorySet.conversationRepository,
    );
    const transcriptBootstrapSource = vi.mocked(ConversationTranscriptBootstrapSource).mock
      .results[0].value;
    expect(MastraAIRuntime).toHaveBeenCalledTimes(1);
    expect(MastraAIRuntime).toHaveBeenCalledWith({
      storage,
      modelResolver: resolver,
      transcriptBootstrapSource,
    });

    const runtime = vi.mocked(MastraAIRuntime).mock.results[0].value;
    expect(vi.mocked(createAIModule).mock.calls[0][0].mastraRuntime).toBe(runtime);
  });

  it('constructs the five app-local host adapters from the exact db / repository port / storage dir identities', () => {
    composeAI(aiDependencies);

    expect(RepositoryKnowledgeNotePersistenceAdapter).toHaveBeenCalledTimes(1);
    expect(RepositoryKnowledgeNotePersistenceAdapter).toHaveBeenCalledWith(fakeRepositoryApiPort);

    expect(RepositoryKnowledgeSourceAdapter).toHaveBeenCalledTimes(1);
    expect(RepositoryKnowledgeSourceAdapter).toHaveBeenCalledWith(fakeDb, fakeStorageBaseDir);

    expect(RepositoryKnowledgeIndexStatusAdapter).toHaveBeenCalledTimes(1);
    expect(RepositoryKnowledgeIndexStatusAdapter).toHaveBeenCalledWith(fakeRepositoryApiPort);

    expect(ControlledAnalyticsReadAdapter).toHaveBeenCalledTimes(1);
    expect(ControlledAnalyticsReadAdapter).toHaveBeenCalledWith(fakeDb);

    expect(BackendAutomationToolExecutorAdapter).toHaveBeenCalledTimes(1);
    expect(BackendAutomationToolExecutorAdapter).toHaveBeenCalledWith({
      goalApplicationPort: fakeGoalApplicationPort,
      taskApplicationPort: fakeTaskApplicationPort,
      reminderApplicationPort: fakeReminderApplicationPort,
      knowledgeSource: vi.mocked(RepositoryKnowledgeSourceAdapter).mock.results[0].value,
      analyticsRead: vi.mocked(ControlledAnalyticsReadAdapter).mock.results[0].value,
    });
  });

  it('creates the Prisma repository set exactly once with the exact db identity', () => {
    composeAI(aiDependencies);

    expect(createAIPrismaRepositories).toHaveBeenCalledTimes(1);
    expect(createAIPrismaRepositories).toHaveBeenCalledWith(fakeDb);
  });

  it('forwards the six-field repository set (incl. checkpoint pair) and host ports into createAIModule', () => {
    composeAI(aiDependencies);

    const moduleCall = vi.mocked(createAIModule).mock.calls[0][0];
    expect(moduleCall.conversationRepository).toBe(mockRepositorySet.conversationRepository);
    expect(moduleCall.providerConfigRepository).toBe(mockRepositorySet.providerConfigRepository);
    expect(moduleCall.knowledgeIndexRepository).toBe(mockRepositorySet.knowledgeIndexRepository);
    expect(moduleCall.executionLogPort).toBe(mockRepositorySet.executionLogPort);
    expect(moduleCall.agentCheckpointPort).toBe(mockRepositorySet.agentCheckpointPort);
    expect(moduleCall.langGraphCheckpointPort).toBe(mockRepositorySet.langGraphCheckpointPort);

    const hostResults = hostAdapterMocks.map((adapter) => vi.mocked(adapter).mock.results[0].value);
    expect(moduleCall.knowledgeNotePersistence).toBe(hostResults[0]);
    expect(moduleCall.knowledgeSourcePort).toBe(hostResults[1]);
    expect(moduleCall.knowledgeIndexStatusPort).toBe(hostResults[2]);
    expect(moduleCall.analyticsReadPort).toBe(hostResults[3]);
    expect(moduleCall.automationToolExecutorPort).toBe(hostResults[4]);
  });

  it('passes the assembled instance into createAIApiModule({ instance })', () => {
    composeAI(aiDependencies);

    const instance = vi.mocked(createAIModule).mock.results[0].value;
    expect(createAIApiModule).toHaveBeenCalledTimes(1);
    expect(createAIApiModule).toHaveBeenCalledWith({ instance });
  });
});

describe('composeAI config branches', () => {
  it('builds the seven remaining config-backed service adapters and never composes Python chat for open chat', () => {
    const config: AIServiceRuntimeConfig = {
      baseUrl: 'http://ai.test',
      serviceSecret: 'secret',
      serviceName: 'memoflow-api-test',
      timeoutMs: 1000,
    };

    composeAI({ ...aiDependencies, aiServiceRuntimeConfig: config });

    expect(getAIServiceRuntimeConfig).not.toHaveBeenCalled();

    for (const adapter of serviceAdapterMocks) {
      expect(vi.mocked(adapter)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(adapter)).toHaveBeenCalledWith(config);
    }
    expect(AIServiceChatExecutionAdapter).not.toHaveBeenCalled();

    const moduleCall = vi.mocked(createAIModule).mock.calls[0][0];
    expect(moduleCall.chatExecutionPort).toBeUndefined();
    for (const adapter of serviceAdapterMocks) {
      expect(moduleCall[servicePortKeys.get(adapter) as string]).toBe(
        vi.mocked(adapter).mock.results[0].value,
      );
    }
  });

  it('constructs host adapters before the config-backed service adapters', () => {
    const config: AIServiceRuntimeConfig = {
      baseUrl: 'http://ai.test',
      serviceSecret: 'secret',
      serviceName: 'memoflow-api-test',
      timeoutMs: 1000,
    };

    composeAI({ ...aiDependencies, aiServiceRuntimeConfig: config });

    const hostOrder = hostAdapterMocks
      .map((adapter) => vi.mocked(adapter).mock.invocationCallOrder[0])
      .sort((a, b) => a - b);
    const serviceOrder = serviceAdapterMocks
      .map((adapter) => vi.mocked(adapter).mock.invocationCallOrder[0])
      .sort((a, b) => a - b);
    expect(hostOrder[0]).toBeLessThan(serviceOrder[0]);
  });

  it('reads config lazily when omitted (undefined) and builds the service adapters from the resolved config', () => {
    const resolvedConfig: AIServiceRuntimeConfig = {
      baseUrl: 'http://ai.lazy.test',
      serviceSecret: 'secret',
      serviceName: 'memoflow-api-lazy',
      timeoutMs: 2000,
    };
    vi.mocked(getAIServiceRuntimeConfig).mockReturnValue(resolvedConfig);

    composeAI(aiDependencies);

    expect(getAIServiceRuntimeConfig).toHaveBeenCalledTimes(1);
    expect(AIServiceChatExecutionAdapter).not.toHaveBeenCalled();
    for (const adapter of serviceAdapterMocks) {
      expect(vi.mocked(adapter)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(adapter)).toHaveBeenCalledWith(resolvedConfig);
    }
  });

  it('treats explicit null as disabled: no env read and every optional service port stays undefined', () => {
    composeAI({ ...aiDependencies, aiServiceRuntimeConfig: null });

    expect(getAIServiceRuntimeConfig).not.toHaveBeenCalled();
    expect(AIServiceChatExecutionAdapter).not.toHaveBeenCalled();
    for (const adapter of serviceAdapterMocks) {
      expect(vi.mocked(adapter)).not.toHaveBeenCalled();
    }

    const moduleCall = vi.mocked(createAIModule).mock.calls[0][0];
    for (const adapter of serviceAdapterMocks) {
      expect(moduleCall[servicePortKeys.get(adapter) as string]).toBeUndefined();
    }
  });

  it('treats a missing config as disabled: no service adapter and every optional service port stays undefined', () => {
    vi.mocked(getAIServiceRuntimeConfig).mockReturnValue(null);

    composeAI(aiDependencies);

    expect(getAIServiceRuntimeConfig).toHaveBeenCalledTimes(1);
    expect(AIServiceChatExecutionAdapter).not.toHaveBeenCalled();
    for (const adapter of serviceAdapterMocks) {
      expect(vi.mocked(adapter)).not.toHaveBeenCalled();
    }

    const moduleCall = vi.mocked(createAIModule).mock.calls[0][0];
    for (const adapter of serviceAdapterMocks) {
      expect(moduleCall[servicePortKeys.get(adapter) as string]).toBeUndefined();
    }
  });

  it('always constructs the evaluation-report file adapter in both branches', () => {
    composeAI(aiDependencies);
    expect(AIEvaluationReportFileAdapter).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createAIModule).mock.calls[0][0].evaluationReportPort).toBe(
      vi.mocked(AIEvaluationReportFileAdapter).mock.results[0].value,
    );

    vi.clearAllMocks();
    vi.mocked(createAIPrismaRepositories).mockReturnValue(
      mockRepositorySet as ReturnType<typeof createAIPrismaRepositories>,
    );
    vi.mocked(createAIApiModule).mockReturnValue({
      name: 'AI',
      register: vi.fn(),
      destroy: vi.fn(),
    });
    vi.mocked(createAIModule).mockReturnValue({
      api: {},
      start: vi.fn(),
      dispose: vi.fn(),
    } as ReturnType<typeof createAIModule>);

    const config: AIServiceRuntimeConfig = {
      baseUrl: 'http://ai.test',
      serviceSecret: 'secret',
      serviceName: 'memoflow-api-test',
      timeoutMs: 1000,
    };
    composeAI({ ...aiDependencies, aiServiceRuntimeConfig: config });
    expect(AIEvaluationReportFileAdapter).toHaveBeenCalledTimes(1);
  });
});
