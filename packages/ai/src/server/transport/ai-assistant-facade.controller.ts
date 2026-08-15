/**
 * AIAssistantFacadeController — transport validation for AssistantFacade (residual 345).
 *
 * identityId always comes from ExecutionContext (never trusted from client body).
 * Approve/reject stay lifecycle-only via facade (no executeApproved).
 */
import { fail, type Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type {
  AssistantCommand,
  AssistantEvent,
  AssistantExecutionProfileId,
  AssistantSurface,
} from '@memoflow/contracts/ai';
import { formatZodErrors } from '@memoflow/utils/result';
import { z } from 'zod';

const SurfaceSchema = z.enum(['web', 'desktop', 'server']);
const ProfileSchema = z.enum(['direct_turn', 'pi_readonly']);

/**
 * Client-facing command shape — identityId is injected from ExecutionContext.
 * 客户端命令形状 —— identityId 由 ExecutionContext 注入，不信任 body。
 */
export const AssistantClientCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message'),
    conversationId: z.string().min(1),
    content: z.string().min(1),
    surface: SurfaceSchema,
    runId: z.string().min(1).optional(),
    executionProfileId: ProfileSchema.optional(),
    providerId: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal('approve_proposal'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('revise_proposal'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
    patch: z
      .object({
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        targetPath: z.string().optional(),
        contentMarkdown: z.string().optional(),
        goalId: z.string().nullable().optional(),
      })
      .default({}),
  }),
  z.object({
    type: z.literal('reject_proposal'),
    runId: z.string().min(1),
    proposalId: z.string().min(1),
    revision: z.number().int().positive(),
    reason: z.string().optional(),
  }),
  z.object({
    type: z.literal('cancel_run'),
    runId: z.string().min(1),
  }),
]);

export type AssistantClientCommand = z.infer<typeof AssistantClientCommandSchema>;

export interface AIAssistantFacadeControllerService {
  dispatchAssistant(
    command: AssistantCommand,
    onEvent: (event: AssistantEvent) => void,
    signal?: AbortSignal,
    requestId?: string,
  ): Promise<Result<{ eventCount: number }>>;
}

function toHostCommand(client: AssistantClientCommand, identityId: string): AssistantCommand {
  switch (client.type) {
    case 'message':
      return {
        type: 'message',
        identityId,
        conversationId: client.conversationId,
        content: client.content,
        surface: client.surface as AssistantSurface,
        runId: client.runId,
        executionProfileId: client.executionProfileId as AssistantExecutionProfileId | undefined,
        providerId: client.providerId,
        model: client.model,
      };
    case 'approve_proposal':
      return {
        type: 'approve_proposal',
        identityId,
        runId: client.runId,
        proposalId: client.proposalId,
        revision: client.revision,
      };
    case 'revise_proposal':
      return {
        type: 'revise_proposal',
        identityId,
        runId: client.runId,
        proposalId: client.proposalId,
        revision: client.revision,
        patch: client.patch ?? {},
      };
    case 'reject_proposal':
      return {
        type: 'reject_proposal',
        identityId,
        runId: client.runId,
        proposalId: client.proposalId,
        revision: client.revision,
        reason: client.reason,
      };
    case 'cancel_run':
      return {
        type: 'cancel_run',
        identityId,
        runId: client.runId,
      };
    default: {
      const _exhaustive: never = client;
      return _exhaustive;
    }
  }
}

export class AIAssistantFacadeController {
  constructor(private readonly service: AIAssistantFacadeControllerService) {}

  async dispatch(
    input: unknown,
    cx: ExecutionContext,
    onEvent: (event: AssistantEvent) => void,
    signal?: AbortSignal,
  ): Promise<Result<{ eventCount: number }>> {
    if (!cx.identityId?.trim()) {
      return fail({ code: 'UNAUTHORIZED', message: 'identityId is required' });
    }

    const parsed = AssistantClientCommandSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    // Never accept identityId from body — always ExecutionContext.
    const command = toHostCommand(parsed.data, cx.identityId);
    return this.service.dispatchAssistant(command, onEvent, signal, cx.requestId);
  }
}
