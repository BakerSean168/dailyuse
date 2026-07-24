import { z } from 'zod';
import { KnowledgeCitationSchema } from './response-schemas';

export const AgentIntentSchema = z.enum([
  'chat',
  'goal-create',
  'task-create',
  'knowledge-qa',
  'knowledge-generate',
]);
export type AgentIntent = z.infer<typeof AgentIntentSchema>;

export const AgentTypeSchema = z.enum([
  'goal.create',
  'knowledge.qa',
  'knowledge.generate',
  /** Residual 427: Host task.create AgentType foundation (session + Host lane). */
  'task.create',
]);
export type AgentType = z.infer<typeof AgentTypeSchema>;

export const AgentLocaleSchema = z.enum(['zh-CN', 'en-US']);
export type AgentLocale = z.infer<typeof AgentLocaleSchema>;

export const AgentRunStatusSchema = z.enum([
  'pending',
  'running',
  'waiting_clarification',
  'waiting_approval',
  'waiting_execution',
  'completed',
  'failed',
  'cancelled',
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatusSchema>;

export const AgentRunSchema = z.object({
  runId: z.string().min(1),
  threadId: z.string().min(1),
  conversationId: z.string().min(1).nullish(),
  identityId: z.string().min(1),
  agentType: AgentTypeSchema,
  status: AgentRunStatusSchema,
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});
export type AgentRun = z.infer<typeof AgentRunSchema>;

export const AgentRunListParamsSchema = z.object({
  conversationId: z.string().min(1).nullish(),
  status: z.array(AgentRunStatusSchema).nullish(),
  activeOnly: z.boolean().nullish(),
  limit: z.number().int().min(1).max(100).nullish(),
});
export type AgentRunListParams = z.infer<typeof AgentRunListParamsSchema>;

export const AgentMessageSchema = z.object({
  id: z.string().min(1).nullish(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  createdAt: z.number().int().nonnegative().nullish(),
});
export type AgentMessage = z.infer<typeof AgentMessageSchema>;

export const AgentArtifactKindSchema = z.enum([
  'goal_draft',
  'task_draft',
  'knowledge_answer',
  'knowledge_note_draft',
  'action_plan',
  'execution_timeline',
]);
export type AgentArtifactKind = z.infer<typeof AgentArtifactKindSchema>;

export const AgentArtifactSchema = z.object({
  artifactId: z.string().min(1),
  kind: AgentArtifactKindSchema,
  title: z.string().min(1).nullish(),
  data: z.record(z.string(), z.unknown()),
  updatedAt: z.number().int().nonnegative(),
});
export type AgentArtifact = z.infer<typeof AgentArtifactSchema>;

// Residual 757: AgentCitation dual body retired — reuses residual 755 KnowledgeCitationSchema.
export const AgentCitationSchema = KnowledgeCitationSchema;
export type AgentCitation = z.infer<typeof AgentCitationSchema>;

export const AgentToolNameSchema = z.enum([
  'search_existing_goals',
  'search_knowledge',
  'fetch_goal_stats',
  'fetch_resource',
  'find_related_notes',
  'create_goal',
  'create_key_result',
  'create_task_template',
  'create_reminder',
  // First-phase knowledge writes are create-only; existing-note edit / reindex
  // remain closed and must not appear as agent action tools.
  'create_knowledge_note',
]);
export type AgentToolName = z.infer<typeof AgentToolNameSchema>;

export const AgentActionSchema = z.object({
  tool: AgentToolNameSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
  rationale: z.string().min(1).nullish(),
  index: z.number().int().nonnegative(),
  dependsOn: z.array(z.number().int().nonnegative()).default([]),
});
export type AgentAction = z.infer<typeof AgentActionSchema>;

export const AgentActionPlanSchema = z.object({
  summary: z.string().min(1),
  actions: z.array(AgentActionSchema),
  warnings: z.array(z.string()).default([]),
});
export type AgentActionPlan = z.infer<typeof AgentActionPlanSchema>;

export const AgentExecutedActionSchema = z.object({
  tool: AgentToolNameSchema,
  status: z.enum(['executed', 'skipped', 'failed']),
  entityId: z.string().nullish(),
  message: z.string(),
  data: z.record(z.string(), z.unknown()).nullish(),
});
export type AgentExecutedAction = z.infer<typeof AgentExecutedActionSchema>;

export const AgentUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative().nullish(),
  completionTokens: z.number().int().nonnegative().nullish(),
  totalTokens: z.number().int().nonnegative().nullish(),
});
export type AgentUsage = z.infer<typeof AgentUsageSchema>;

export const AgentStateSchema = z.object({
  messages: z.array(AgentMessageSchema).default([]),
  intent: AgentIntentSchema.nullable().default(null),
  stage: z.string().min(1),
  artifacts: z.array(AgentArtifactSchema).default([]),
  citations: z.array(AgentCitationSchema).default([]),
  retrievedContext: z.array(z.record(z.string(), z.unknown())).default([]),
  pendingActions: z.array(AgentActionSchema).default([]),
  approvedActions: z.array(AgentActionSchema).default([]),
  executedActions: z.array(AgentExecutedActionSchema).default([]),
  usage: AgentUsageSchema.default({}),
  errors: z.array(z.string()).default([]),
});
export type AgentState = z.infer<typeof AgentStateSchema>;

export const AgentEventTypeSchema = z.enum([
  'run.started',
  'node.started',
  'node.completed',
  'message.delta',
  'artifact.updated',
  'citation.selected',
  'tool.started',
  'tool.completed',
  'clarification.required',
  'approval.required',
  'execution.required',
  'action.executed',
  'run.completed',
  'run.failed',
]);
export type AgentEventType = z.infer<typeof AgentEventTypeSchema>;

export const AgentEventSchema = z.object({
  eventId: z.string().min(1),
  runId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  type: AgentEventTypeSchema,
  createdAt: z.number().int().nonnegative(),
  data: z.record(z.string(), z.unknown()).default({}),
});
export type AgentEvent = z.infer<typeof AgentEventSchema>;

export const AgentResumePayloadSchema = z.object({
  userDecision: z.enum(['clarify', 'confirm', 'cancel', 'edit', 'regenerate']),
  clarificationAnswers: z.array(z.string().trim().min(1)).min(1).max(3).nullish(),
  approvedActions: z.array(AgentActionSchema).nullish(),
  executedActions: z.array(AgentExecutedActionSchema).nullish(),
  editedArtifacts: z.array(AgentArtifactSchema).nullish(),
  approvedPlan: AgentActionPlanSchema.nullish(),
});
export type AgentResumePayload = z.infer<typeof AgentResumePayloadSchema>;

export const AgentStartRunRequestSchema = z.object({
  runId: z.string().min(1),
  threadId: z.string().min(1),
  conversationId: z.string().min(1).nullish(),
  identityId: z.string().min(1),
  agentType: AgentTypeSchema,
  locale: AgentLocaleSchema,
  input: z.record(z.string(), z.unknown()).default({}),
});
export type AgentStartRunRequest = z.infer<typeof AgentStartRunRequestSchema>;

export const AgentStartRunClientRequestSchema = AgentStartRunRequestSchema.omit({
  identityId: true,
});
export type AgentStartRunClientRequest = z.infer<typeof AgentStartRunClientRequestSchema>;

export const AgentRunResultSchema = z.object({
  run: AgentRunSchema,
  state: AgentStateSchema,
  events: z.array(AgentEventSchema).default([]),
  interrupts: z.array(z.record(z.string(), z.unknown())).default([]),
});
export type AgentRunResult = z.infer<typeof AgentRunResultSchema>;
