/**
 * AIAssistantFacadeController — transport validation for AssistantFacade (residual 345).
 *
 * identityId always comes from ExecutionContext (never trusted from client body);
 * the shared `AssistantClientCommandSchema` REJECTS a smuggled identityId as a
 * validation failure. Approve/reject stay lifecycle-only via facade (no
 * executeApproved).
 *
 * AIAssistantFacadeController —— AssistantFacade（residual 345）的传输层校验。
 *
 * identityId 永远来自 ExecutionContext（绝不信任客户端 body）；共享的
 * `AssistantClientCommandSchema` 对夹带的 identityId 直接 validation failure。
 * approve/reject 仅经 facade 走生命周期，不执行 executeApproved。
 */
import { fail, type Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import {
  AssistantClientCommandSchema,
  type AssistantClientCommand,
  type AssistantCommand,
  type AssistantDispatchHandlers,
  type AssistantDispatchResult,
} from '@memoflow/contracts/ai';
import { formatZodErrors } from '@memoflow/utils/result';

export interface AIAssistantFacadeControllerService {
  dispatchAssistant(
    command: AssistantCommand,
    handlers: AssistantDispatchHandlers,
    signal?: AbortSignal,
  ): Promise<Result<AssistantDispatchResult>>;
}

/**
 * Map a validated client command into the server-side `AssistantCommand`,
 * injecting identity from the trusted authenticated context. Shared by the
 * HTTP controller and the Electron main transport so both surfaces build the
 * Host command identically.
 *
 * 把校验后的客户端命令映射为服务端 `AssistantCommand`，从可信认证上下文注入
 * identity。HTTP controller 与 Electron main transport 共用，保证两个传输面
 * 构造出完全一致的 Host command。
 */
export function toHostCommand(
  client: AssistantClientCommand,
  identityId: string,
): AssistantCommand {
  switch (client.type) {
    case 'message':
      return {
        type: 'message',
        identityId,
        conversationId: client.conversationId,
        content: client.content,
        surface: client.surface,
        runId: client.runId,
        executionProfileId: client.executionProfileId,
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
    handlers: AssistantDispatchHandlers,
    signal?: AbortSignal,
  ): Promise<Result<AssistantDispatchResult>> {
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
    return this.service.dispatchAssistant(command, handlers, signal);
  }
}
