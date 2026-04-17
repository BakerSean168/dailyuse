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
  StreamMessageDonePayload,
  ListMessagesQuery,
  MessageListRes,
} from '../api/ai-chat.dto';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '../api/ai-knowledge-note.dto';
import type { ExpandKnowledgeReq, ExpandKnowledgeRes } from '../api/ai-knowledge-expansion.dto';
import type { QueryAnalyticsReq, QueryAnalyticsRes } from '../api/ai-analytics-query.dto';
import type { QueryKnowledgeReq, QueryKnowledgeRes } from '../api/ai-knowledge-query.dto';

export type AIRpcMap = {
  'ai:provider:create': [CreateAIProviderConfigReq, CreateAIProviderConfigRes];
  'ai:provider:update': [UpdateAIProviderConfigReq, UpdateAIProviderConfigRes];
  'ai:provider:list': [void, ListAIProviderConfigsRes];
  'ai:provider:get': [string, GetAIProviderConfigRes];
  'ai:provider:delete': [string, DeleteAIProviderConfigRes];
  'ai:provider:test': [TestAIProviderReq, TestAIProviderRes];
  'ai:provider:set-default': [SetDefaultAIProviderReq, SetDefaultAIProviderRes];

  'ai:goal:generate': [GenerateGoalsReq, GenerateGoalsRes];

  'ai:chat:conversation:create': [CreateConversationReq, CreateConversationRes];
  'ai:chat:conversation:update': [UpdateConversationReq & { id: string }, UpdateConversationRes];
  'ai:chat:conversation:list': [ListConversationsQuery | undefined, ConversationListRes];
  'ai:chat:conversation:get': [string, GetConversationRes];
  'ai:chat:conversation:delete': [string, DeleteConversationRes];
  'ai:chat:message:send': [SendMessageReq, SendMessageRes];
  'ai:chat:message:list': [ListMessagesQuery, MessageListRes];
  'ai:chat:message:stream:start': [SendMessageReq, StreamMessageDonePayload];
  'ai:chat:message:stream:cancel': [string, void];

  'ai:knowledge-note:create': [CreateKnowledgeNoteReq, CreateKnowledgeNoteRes];
  'ai:knowledge:expand': [ExpandKnowledgeReq, ExpandKnowledgeRes];
  'ai:knowledge:query': [QueryKnowledgeReq, QueryKnowledgeRes];
  'ai:analytics:query': [QueryAnalyticsReq, QueryAnalyticsRes];
};
