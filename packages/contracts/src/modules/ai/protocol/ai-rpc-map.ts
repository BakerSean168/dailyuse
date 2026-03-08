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
  GenerateGoalsReq,
  GenerateGoalsRes,
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
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
} from '../api';

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

  'ai:knowledge-note:create': [CreateKnowledgeNoteReq, CreateKnowledgeNoteRes];
};
