import type {
  CreateAIProviderConfigReq,
  CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq,
  UpdateAIProviderConfigRes,
  ListAIProviderConfigsRes,
  GetAIProviderConfigRes,
  DeleteAIProviderConfigRes,
  TestAIProviderReq,
  TestAIProviderRes,
  SetDefaultAIProviderReq,
  SetDefaultAIProviderRes,
} from '../api/ai-provider-config.dto';
import type { GenerateGoalsReq, GenerateGoalsRes } from '../api/ai-goal-generation.dto';
import type {
  CreateConversationReq,
  CreateConversationRes,
  UpdateConversationReq,
  UpdateConversationRes,
  ListConversationsQuery,
  ConversationListRes,
  GetConversationRes,
  DeleteConversationRes,
  SendMessageReq,
  SendMessageRes,
  ListMessagesQuery,
  MessageListRes,
} from '../api/ai-chat.dto';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '../api/ai-knowledge-note.dto';
import type { ExpandKnowledgeReq, ExpandKnowledgeRes } from '../api/ai-knowledge-expansion.dto';
import type { QueryAnalyticsReq, QueryAnalyticsRes } from '../api/ai-analytics-query.dto';
import type { QueryKnowledgeReq, QueryKnowledgeRes } from '../api/ai-knowledge-query.dto';
import type {
  AgentEvent,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '../api/ai-agent.dto';
import type {
  AssistantRuntimeClientCommand,
  AIWorkflowCancelClientRequest,
  AIWorkflowGetClientRequest,
  AIWorkflowListClientRequest,
  AIWorkflowResumeClientRequest,
  AIWorkflowRunView,
  AIWorkflowStartClientRequest,
} from '../api/ai-runtime.dto';
import type { AiProviderConfigId, AiConversationId } from '../../../primitives';

export type AIRpcMap = {
  'ai:provider:create': [CreateAIProviderConfigReq, CreateAIProviderConfigRes];
  'ai:provider:update': [UpdateAIProviderConfigReq, UpdateAIProviderConfigRes];
  'ai:provider:list': [void, ListAIProviderConfigsRes];
  'ai:provider:get': [AiProviderConfigId, GetAIProviderConfigRes];
  'ai:provider:delete': [AiProviderConfigId, DeleteAIProviderConfigRes];
  'ai:provider:test': [TestAIProviderReq, TestAIProviderRes];
  'ai:provider:set-default': [SetDefaultAIProviderReq, SetDefaultAIProviderRes];

  'ai:goal:generate': [GenerateGoalsReq, GenerateGoalsRes];

  'ai:chat:conversation:create': [CreateConversationReq, CreateConversationRes];
  'ai:chat:conversation:update': [
    UpdateConversationReq & { id: AiConversationId },
    UpdateConversationRes,
  ];
  'ai:chat:conversation:list': [ListConversationsQuery | undefined, ConversationListRes];
  'ai:chat:conversation:get': [AiConversationId, GetConversationRes];
  'ai:chat:conversation:delete': [AiConversationId, DeleteConversationRes];
  'ai:chat:message:send': [SendMessageReq, SendMessageRes];
  'ai:chat:message:list': [ListMessagesQuery, MessageListRes];
  'ai:chat:message:stream:start': [SendMessageReq, SendMessageRes];
  'ai:chat:message:stream:cancel': [AiConversationId, void];
  'ai:runtime:assistant:start': [
    { streamId: string; command: AssistantRuntimeClientCommand },
    void,
  ];
  'ai:runtime:assistant:cancel': [AssistantRuntimeClientCommand, { cancelled: boolean }];
  'ai:runtime:workflow:start': [AIWorkflowStartClientRequest, AIWorkflowRunView];
  'ai:runtime:workflow:resume': [AIWorkflowResumeClientRequest, AIWorkflowRunView];
  'ai:runtime:workflow:get': [AIWorkflowGetClientRequest, AIWorkflowRunView | null];
  'ai:runtime:workflow:list': [AIWorkflowListClientRequest, readonly AIWorkflowRunView[]];
  'ai:runtime:workflow:cancel': [AIWorkflowCancelClientRequest, AIWorkflowRunView | null];

  'ai:knowledge-note:create': [CreateKnowledgeNoteReq, CreateKnowledgeNoteRes];
  'ai:knowledge:expand': [ExpandKnowledgeReq, ExpandKnowledgeRes];
  'ai:knowledge:query': [QueryKnowledgeReq, QueryKnowledgeRes];
  'ai:analytics:query': [QueryAnalyticsReq, QueryAnalyticsRes];
  'ai:agent:run:start': [AgentStartRunClientRequest, AgentRunResult];
  'ai:agent:run:resume': [{ runId: string; payload: AgentResumePayload }, AgentRunResult];
  'ai:agent:run:get': [string, AgentRunResult];
  'ai:agent:events:get': [string, AgentEvent[]];
};
