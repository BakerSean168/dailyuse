/**
 * Assistant Host dispatch wire contracts (ADR-035, residual 343/345/347/353).
 * Assistant Host dispatch 传输契约（ADR-035，residual 343/345/347/353）。
 *
 * These schemas are the single derivation source for every cross-boundary
 * payload of Host dispatch: the client command, the normalized `AssistantEvent`
 * stream, and the dispatch result. The server controller, the Web HTTP adapter
 * and the Desktop IPC adapter MUST consume these schemas instead of maintaining
 * a second copy of the shapes.
 *
 * 这些 schema 是 Host dispatch 全部跨边界 payload 的唯一推导源：客户端命令、
 * 归一化后的 `AssistantEvent` 流与 dispatch 结果。server controller、Web HTTP
 * adapter 与 Desktop IPC adapter 必须消费这些 schema，而不是各自维护第二份 shape。
 *
 * Security invariant: `identityId` never appears in the client command. The body
 * schema REJECTS a smuggled `identityId` instead of silently ignoring it; HTTP
 * auth context and Desktop authenticated context inject identity server-side.
 *
 * 安全不变量：`identityId` 永不进入客户端命令。body schema 对夹带的 `identityId`
 * 直接 validation failure 而不是静默忽略；identity 由 HTTP auth context 与
 * Desktop 认证上下文在服务端注入。
 */
import { z } from 'zod';

/** Client-facing assistant surface tag. 客户端可声明的 assistant surface。 */
export const AssistantSurfaceSchema = z.enum(['web', 'desktop', 'server']);

/** Turn engine execution profile id. Turn engine 执行 profile id。 */
export const AssistantExecutionProfileIdSchema = z.enum(['direct_turn', 'pi_readonly']);

/**
 * Lifecycle edit fields for revise_proposal (residual 359).
 * revise_proposal 的生命周期编辑字段（residual 359）。
 */
export const AssistantProposalPatchSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    targetPath: z.string().optional(),
    contentMarkdown: z.string().optional(),
    goalId: z.string().nullable().optional(),
  })
  .default({});

/**
 * Proposal kinds mirrored from `AgentProposal['kind']` for the revised event.
 * proposal.revised 事件中与 `AgentProposal['kind']` 对齐的提案种类。
 */
export const AssistantProposalKindSchema = z.enum(['goal.create', 'knowledge.write', 'task.create']);

/**
 * Client-facing command schema. `identityId` is a declared `never` key so any
 * smuggled identity is a validation failure (path `identityId`), never ignored.
 * `message` requires `conversationId/content/surface`; `runId`,
 * `executionProfileId`, `providerId` and `model` stay optional.
 *
 * 客户端命令 schema。`identityId` 以 `never` 键显式声明，因此任何夹带的 identity
 * 都会在 path `identityId` 处 validation failure，而不是被忽略。`message` 必含
 * `conversationId/content/surface`；`runId`、`executionProfileId`、`providerId`
 * 与 `model` 保持可选。
 */
export const AssistantClientCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message'),
    conversationId: z.string().min(1),
    content: z.string().min(1),
    surface: AssistantSurfaceSchema,
    runId: z.string().min(1).optional(),
    executionProfileId: AssistantExecutionProfileIdSchema.optional(),
    providerId: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    identityId: z.never().optional(),
  }),
  z.object({
    type: z.literal('approve_proposal'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
    identityId: z.never().optional(),
  }),
  z.object({
    type: z.literal('revise_proposal'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
    patch: AssistantProposalPatchSchema,
    identityId: z.never().optional(),
  }),
  z.object({
    type: z.literal('reject_proposal'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
    reason: z.string().optional(),
    identityId: z.never().optional(),
  }),
  z.object({
    type: z.literal('cancel_run'),
    runId: z.string().min(1),
    identityId: z.never().optional(),
  }),
]);

export type AssistantClientCommand = z.infer<typeof AssistantClientCommandSchema>;

/**
 * Stable error code for a malformed/invalid dispatch payload (malformed JSON,
 * wrong shape, unknown event discriminator). Never eligible for a legacy
 * fallback — a protocol failure means the Host may already have acted.
 *
 * payload 解析失败的稳定错误码（malformed JSON、错误 shape、未知事件
 * discriminator）。这类错误绝不触发 legacy 回退——协议失败意味着 Host 可能
 * 已经执行。
 */
export const ASSISTANT_PROTOCOL_ERROR = 'ASSISTANT_PROTOCOL_ERROR' as const;

/**
 * Stable error code for a Host that definitely does NOT support dispatch:
 * Web bootstrap route absence (404/405/501) or Desktop bridge/handler absence
 * BEFORE the START is accepted. A failure AFTER dispatch started (any SSE
 * `error` frame or stream break, any IPC ERROR after START) must NOT be
 * classified with this code.
 *
 * Host 明确不支持 dispatch 的稳定错误码：Web bootstrap 路由缺失（404/405/501）
 * 或 Desktop bridge/handler 在 START 被接受前缺失。dispatch 已经开始之后
 * （SSE `error` 帧或断流、IPC START 之后的 ERROR）一律不得使用该码。
 */
export const ASSISTANT_DISPATCH_UNAVAILABLE = 'ASSISTANT_DISPATCH_UNAVAILABLE' as const;

/**
 * Open-chat `message` wire shape (plan §4.2). Derived from the schema so the
 * runtime validation and the TypeScript shape can never diverge.
 *
 * Open-chat `message` 的线上形状（计划 §4.2）。由 schema 推导，保证运行时校验与
 * TypeScript 形状永不漂移。
 */
export type AssistantOpenChatCommand = Extract<AssistantClientCommand, { type: 'message' }>;

/**
 * Host-normalized assistant event stream (plan §4.3). Every object adds optional
 * fields forward-compatibly; an UNKNOWN `type` is a protocol failure, never a
 * silent ignore.
 *
 * Host 归一化的 assistant 事件流（计划 §4.3）。新增字段必须可选以保持向后兼容；
 * 未知 `type` 一律 protocol failure，绝不静默忽略。
 */
export const AssistantEventSchema = z.discriminatedUnion('type', [
  /**
   * Residual N1 (nightly AH-1): optional conversationId binds Host open-chat runs
   * to the product Conversation (multi-run per conversation; nullish when command
   * omitted it — direct_turn still fail-closed CONVERSATION_REQUIRED before stream).
   * Residual N1：可选 conversationId 将 Host open-chat run 与产品 Conversation
   * 关联（一个 conversation 多 run；command 省略时为空——direct_turn 仍在流前
   * fail-closed 要求 CONVERSATION_REQUIRED）。
   */
  z.object({
    type: z.literal('run.started'),
    runId: z.string().min(1),
    engineId: z.string().min(1),
    profile: AssistantExecutionProfileIdSchema,
    conversationId: z.string().optional(),
  }),
  z.object({
    type: z.literal('message.delta'),
    runId: z.string().min(1),
    content: z.string(),
  }),
  z.object({
    type: z.literal('message.completed'),
    runId: z.string().min(1),
    status: z.enum(['completed', 'aborted', 'failed', 'waiting_approval']),
    error: z.string().optional(),
    content: z.string().optional(),
    userMessage: z.object({ id: z.string(), content: z.string() }).optional(),
    assistantMessage: z.object({ id: z.string(), content: z.string() }).optional(),
  }),
  z.object({
    type: z.literal('proposal.approved'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('proposal.revised'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
    kind: AssistantProposalKindSchema,
    title: z.string().optional(),
    targetPath: z.string().optional(),
  }),
  z.object({
    type: z.literal('proposal.rejected'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
    reason: z.string().optional(),
  }),
  z.object({
    type: z.literal('run.cancelled'),
    runId: z.string().min(1),
  }),
  z.object({
    type: z.literal('error'),
    code: z.string().min(1),
    message: z.string(),
    runId: z.string().optional(),
  }),
]);

export type AssistantEvent = z.infer<typeof AssistantEventSchema>;

/**
 * Dispatch completion result. `eventCount` is a nonnegative integer and counts
 * every `AssistantEvent` produced by the Facade.
 *
 * dispatch 完成结果。`eventCount` 为非负整数，统计 Facade 产出的每一个
 * `AssistantEvent`。
 */
export const AssistantDispatchResultSchema = z.object({
  eventCount: z.number().int().min(0),
});

export type AssistantDispatchResult = z.infer<typeof AssistantDispatchResultSchema>;

/**
 * Named client dispatch handlers shared by the port, the service and both
 * adapters. `onEvent` fires per normalized event; `onDone` fires exactly once
 * on successful completion with the final result.
 *
 * 由 port、service 与两个 adapter 共用的命名 dispatch 处理器。`onEvent` 对每个
 * 归一化事件调用一次；`onDone` 在成功完成时恰好调用一次并携带最终结果。
 */
export interface AssistantDispatchHandlers {
  /** Called once per Host-normalized AssistantEvent. 每个 Host 归一化事件调用一次。 */
  onEvent?: (event: AssistantEvent) => void;
  /** Called once on successful completion with the final result. 成功完成时调用一次并携带最终结果。 */
  onDone?: (result: AssistantDispatchResult) => void;
}
