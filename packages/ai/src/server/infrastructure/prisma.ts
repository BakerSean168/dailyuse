/**
 * AI Module — Prisma Composition Root convenience factory.
 * AI 模块 — Prisma 组合根便捷工厂。
 *
 * Host-facing ingredient seam for the API lane: the repository set type and
 * the repository factory. Optional host ports (chat execution, goal planning,
 * knowledge ingestion, analytics, agent runtime, etc.) stay OUT of the set —
 * composers pass them explicitly.
 *
 * 面向宿主的 API lane 组合原料：仓储集合类型与仓储工厂。
 * 可选宿主 Port（chat execution、goal planning、knowledge ingestion、analytics、
 * agent runtime 等）保持在集合之外——由 composer 显式传入。
 *
 * @see {@link createAIModule} for the canonical composition root.
 */

import type { PrismaClient } from '@memoflow/database';
import type { IAIConversationRepository } from '../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../domain/repositories/i-ai-provider-config-repository';
import type {
  IAgentCheckpointPort,
  IAIExecutionLogPort,
  IKnowledgeIndexRepository,
  ILangGraphCheckpointPort,
} from '../application/ports';
import { AgentCheckpointPrismaAdapter } from './adapters/prisma/agent-checkpoint-prisma.adapter';
import {
  AIConversationPrismaRepository,
  AIExecutionLogPrismaAdapter,
  AIKnowledgeIndexPrismaRepository,
  AIProviderConfigPrismaRepository,
} from './adapters/prisma';
import { LangGraphCheckpointPrismaAdapter } from './adapters/prisma/langgraph-checkpoint-prisma.adapter';

/**
 * Host-facing AI repository set for the Prisma lane.
 * 面向宿主暴露的 Prisma lane AI 仓储集合。
 *
 * Contains the six persistence ports the Prisma lane owns: conversation,
 * provider config, knowledge index, execution log, agent checkpoint and
 * LangGraph checkpoint. The last two are API/Prisma-only ingredients consumed
 * by the internal checkpoint routes; they have no PowerSync counterpart. Host
 * capability ports (chat execution, goal planning, knowledge
 * ingestion/query/generation, analytics, agent runtime, automation tool
 * executor, evaluation report, etc.) are intentionally NOT part of the set —
 * they are host-owned ports passed to `createAIModule` explicitly.
 *
 * 包含 Prisma lane 自有的六个持久化 Port：conversation、provider config、
 * knowledge index、execution log、agent checkpoint 与 LangGraph checkpoint。
 * 后两者是仅 API/Prisma 使用的原料，供内部 checkpoint 路由消费，没有对应的
 * PowerSync 实现。宿主能力 Port（chat execution、goal planning、knowledge
 * ingestion/query/generation、analytics、agent runtime、automation tool
 * executor、evaluation report 等）刻意不在集合中——它们是宿主拥有的 Port，
 * 由调用方显式传给 `createAIModule`。
 */
export interface AIPrismaRepositorySet {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly knowledgeIndexRepository: IKnowledgeIndexRepository;
  readonly executionLogPort: IAIExecutionLogPort;
  readonly agentCheckpointPort: IAgentCheckpointPort;
  readonly langGraphCheckpointPort: ILangGraphCheckpointPort;
}

/**
 * Creates Prisma-backed AI repositories.
 * 创建基于 Prisma 的 AI 仓储。
 *
 * API counterpart of the PowerSync assembly: selects the Prisma adapters and
 * returns the repository Port shape. Host capability ports are supplied by the
 * composer, not here.
 *
 * 与 PowerSync 装配对应的 API 版本：选择 Prisma 适配器并返回仓储 Port 形状。
 * 宿主能力 Port 由 composer 提供，不在此处。
 *
 * @param db - Prisma client owned by the API runtime. API 运行时持有的 Prisma client。
 * @returns Repository set backed by the Prisma adapters.
 *          返回基于 Prisma 适配器的仓储集合。
 */
export function createAIPrismaRepositories(db: PrismaClient): AIPrismaRepositorySet {
  return {
    conversationRepository: new AIConversationPrismaRepository(db),
    providerConfigRepository: new AIProviderConfigPrismaRepository(db),
    knowledgeIndexRepository: new AIKnowledgeIndexPrismaRepository(db),
    executionLogPort: new AIExecutionLogPrismaAdapter(db),
    agentCheckpointPort: new AgentCheckpointPrismaAdapter(db),
    langGraphCheckpointPort: new LangGraphCheckpointPrismaAdapter(db),
  };
}
