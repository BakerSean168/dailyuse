import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId, AiConversationId, AiMessageId } from '../../../primitives';
import {
  GenerateGoalResultDTOSchema,
  GeneratedGoalDraftSchema,
  KeyResultPreviewSchema,
} from '../dtos/goal-generation-result.dto';
import { TestAIProviderResultDTOSchema } from '../dtos/provider-test-result.dto';
import {
  GoalAutomationActionSchema,
  GoalAutomationExecutedActionSchema,
  GoalAutomationReminderPreviewSchema,
  GoalAutomationTaskTemplatePreviewSchema,
} from './ai-goal-automation.dto';
import { ConversationStatus } from '../value-objects/conversation-status';
import { MessageRole } from '../value-objects/message-role';
import { AIProviderType } from '../value-objects/ai-provider-type';

// Residual 719: draft/preview/result schemas owned by goal-generation-result.dto.ts
// (GenerateGoalResultDTOSchema re-exported for OpenAPI route consumers).
export { GenerateGoalResultDTOSchema, GeneratedGoalDraftSchema, KeyResultPreviewSchema };

const TokenUsageSchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
});

const GoalClarificationQuestionSchema = z.object({
  question: z.string(),
  context: z.string().nullable().optional(),
});

const GoalClarificationSchema = z.object({
  needsClarification: z.literal(true),
  questions: z.array(GoalClarificationQuestionSchema).min(2).max(4),
  rationale: z.string().nullable().optional(),
});

export const GoalWorkflowDraftResultDTOSchema = GenerateGoalResultDTOSchema.extend({
  state: z.literal('draft'),
});

export const GoalWorkflowClarificationResultDTOSchema = z.object({
  state: z.literal('clarification'),
  clarification: GoalClarificationSchema,
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
  providerUsed: z.string().optional(),
  modelUsed: z.string().optional(),
});

const GoalWorkflowPlanPayloadSchema = z.object({
  summary: z.string(),
  plan: z.object({
    goal: GeneratedGoalDraftSchema,
    keyResults: z.array(KeyResultPreviewSchema).optional(),
    taskTemplates: z.array(GoalAutomationTaskTemplatePreviewSchema).optional(),
    reminders: z.array(GoalAutomationReminderPreviewSchema).optional(),
  }),
  actions: z.array(GoalAutomationActionSchema),
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
  providerUsed: z.string().optional(),
  modelUsed: z.string().optional(),
});

const GoalWorkflowExecutionSummaryDTOSchema = z.object({
  status: z.enum(['success', 'partial', 'failed']),
  executedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
});

const GoalWorkflowRecoveryDTOSchema = z.object({
  canRetry: z.boolean(),
  failedActions: z.array(GoalAutomationExecutedActionSchema),
  suggestions: z.array(z.string()),
});

export const GoalWorkflowConfirmResultDTOSchema = GoalWorkflowPlanPayloadSchema.extend({
  state: z.literal('confirm'),
});

export const GoalWorkflowExecutionResultDTOSchema = GoalWorkflowPlanPayloadSchema.extend({
  state: z.literal('result'),
  executedActions: z.array(GoalAutomationExecutedActionSchema),
  executionSummary: GoalWorkflowExecutionSummaryDTOSchema,
  recovery: GoalWorkflowRecoveryDTOSchema,
});

export const GoalWorkflowResultDTOSchema = z.discriminatedUnion('state', [
  GoalWorkflowClarificationResultDTOSchema,
  GoalWorkflowDraftResultDTOSchema,
  GoalWorkflowConfirmResultDTOSchema,
  GoalWorkflowExecutionResultDTOSchema,
]);

// ============ Route Response Schemas ============

export const MessageClientDTOSchema = z.object({
  id: brandedId<AiMessageId>(),
  conversationId: brandedId<AiConversationId>(),
  role: z.enum(Object.values(MessageRole)),
  content: z.string(),
  tokenCount: z.number().nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  isUser: z.boolean(),
  isAssistant: z.boolean(),
  isSystem: z.boolean(),
  formattedTime: z.string(),
});

export const AIConversationClientDTOSchema = z.object({
  id: brandedId<AiConversationId>(),
  identityId: z.string(),
  name: z.string(),
  status: z.enum(Object.values(ConversationStatus)),
  messageCount: z.number(),
  lastMessageAt: z.number().nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  messages: z.array(MessageClientDTOSchema).nullable(),
});

const AIModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  contextWindow: z.number().optional(),
  inputCostPer1M: z.number().optional(),
  outputCostPer1M: z.number().optional(),
});

export const AIProviderConfigClientDTOSchema = z.object({
  id: brandedId<AiProviderConfigId>(),
  identityId: z.string(),
  name: z.string(),
  providerType: z.enum(Object.values(AIProviderType)),
  baseUrl: z.string(),
  apiKeyMasked: z.string(),
  defaultModel: z.string().nullable(),
  availableModels: z.array(AIModelInfoSchema),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  priority: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

// Residual 647: AIProviderConfigSummarySchema dual-track retired.
// List/get envelopes use AIProviderConfigClientDTOSchema only.

// Residual 695: AI response OpenAPI schemas are the sole response shapes for
// SendMessage / ListAIProviderConfigs / QueryAnalytics / QueryKnowledge /
// ExpandKnowledge / CreateKnowledgeNote (semantic *Res types are z.infer aliases).
export const SendMessageResSchema = z.object({
  userMessage: MessageClientDTOSchema,
  assistantMessage: MessageClientDTOSchema,
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
});

// Residual 691: AI chat list OpenAPI schemas are the sole list response shapes
// (ConversationListRes / MessageListRes are z.infer aliases).
export const ConversationListResSchema = z.object({
  data: z.array(AIConversationClientDTOSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const MessageListResSchema = z.object({
  data: z.array(MessageClientDTOSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

// Residual 721: TestAIProviderResultDTOSchema owned by provider-test-result.dto.ts
// (re-exported for OpenAPI route consumers).
export { TestAIProviderResultDTOSchema };

const KnowledgeCitationResSchema = z.object({
  resourceId: z.string(),
  resourcePath: z.string(),
  title: z.string().optional(),
  chunkIndex: z.number().int().nonnegative(),
  excerpt: z.string(),
  score: z.number().nonnegative(),
});

export const QueryKnowledgeResSchema = z.object({
  answer: z.string(),
  citations: z.array(KnowledgeCitationResSchema),
  providerId: brandedId<AiProviderConfigId>(),
  tokenUsage: TokenUsageSchema,
  processingTimeMs: z.number(),
  matchedResourceCount: z.number(),
});

export const ExpandKnowledgeResSchema = z.object({
  expandedContent: z.string(),
  citations: z.array(KnowledgeCitationResSchema),
  providerId: brandedId<AiProviderConfigId>(),
  tokenUsage: TokenUsageSchema,
  processingTimeMs: z.number(),
  matchedResourceCount: z.number(),
});

// Residual 723: KnowledgeNotePersistedRefSchema is the sole persisted-note shape
// (KnowledgeNotePersistedRef is a z.infer alias).
export const KnowledgeNotePersistedRefSchema = z.object({
  id: z.string(),
  repositoryScopeId: z.string(),
  name: z.string(),
  path: z.string(),
  mimeType: z.string(),
  size: z.number(),
  content: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const CreateKnowledgeNoteResSchema = z.object({
  note: KnowledgeNotePersistedRefSchema,
  resolvedPath: z.string(),
  indexStatus: z.enum(['pending', 'indexed', 'failed']),
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
});

export const QueryAnalyticsResSchema = z.object({
  answer: z.string(),
  highlights: z.array(z.string()),
  providerId: brandedId<AiProviderConfigId>(),
  tokenUsage: TokenUsageSchema,
  processingTimeMs: z.number(),
});

export const ListAIProviderConfigsResSchema = z.object({
  data: z.array(AIProviderConfigClientDTOSchema),
});

