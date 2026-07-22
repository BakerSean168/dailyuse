/**
 * AssistantFacade — production unified Host dispatch surface (ADR-035 residual 343).
 *
 * Routes:
 * - message → DirectTurnEngine open chat (default) or ReadonlyAnalysisTurnEngine (pi_readonly)
 * - approve_proposal / reject_proposal → ProposalKernel lifecycle only
 * - cancel_run → abort both production Turn Engines
 *
 * Never executes business mutations. Proposal approve does not call executeApproved;
 * knowledge/goal/task side-effects still require explicit Host executors after approval.
 */
import type {
  AssistantCommand,
  AssistantEvent,
  AssistantExecutionProfileId,
  IAssistantFacadePort,
  IProposalKernelPort,
  ITurnEnginePort,
} from '@dailyuse/contracts/ai';
import type { IOpenChatTurnPort } from '../../application/ports';
import { DIRECT_TURN_ENGINE_ID } from '../turn-engine/direct-turn.engine';

export const ASSISTANT_FACADE_ID = 'assistant.facade' as const;

function newRunId(): string {
  return `assistant-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class AssistantFacade implements IAssistantFacadePort {
  constructor(
    private readonly openChatTurn: IOpenChatTurnPort,
    private readonly readonlyTurnEngine: ITurnEnginePort,
    private readonly proposalKernel: IProposalKernelPort,
    /** Primary Turn Engine used for cancel of direct_turn runs (same instance as openChatTurn when DirectTurnEngine). */
    private readonly primaryTurnEngine: ITurnEnginePort,
  ) {}

  async *dispatch(
    command: AssistantCommand,
    signal?: AbortSignal,
  ): AsyncGenerator<AssistantEvent, void, void> {
    try {
      switch (command.type) {
        case 'message':
          yield* this.dispatchMessage(command, signal);
          return;
        case 'approve_proposal':
          yield* this.dispatchApprove(command);
          return;
        case 'reject_proposal':
          yield* this.dispatchReject(command);
          return;
        case 'cancel_run':
          yield* this.dispatchCancel(command);
          return;
        default: {
          const _exhaustive: never = command;
          void _exhaustive;
          yield {
            type: 'error',
            code: 'ASSISTANT_COMMAND_UNSUPPORTED',
            message: 'Unsupported assistant command',
          };
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        code: 'ASSISTANT_DISPATCH_FAILED',
        message: error instanceof Error ? error.message : 'Assistant dispatch failed',
      };
    }
  }

  private async *dispatchMessage(
    command: Extract<AssistantCommand, { type: 'message' }>,
    signal?: AbortSignal,
  ): AsyncGenerator<AssistantEvent, void, void> {
    if (!command.identityId?.trim()) {
      yield { type: 'error', code: 'IDENTITY_REQUIRED', message: 'identityId is required' };
      return;
    }
    if (!command.content?.trim()) {
      yield { type: 'error', code: 'MESSAGE_REQUIRED', message: 'message content is required' };
      return;
    }

    const profile: AssistantExecutionProfileId = command.executionProfileId ?? 'direct_turn';
    const runId = command.runId?.trim() || newRunId();

    if (profile === 'pi_readonly') {
      yield {
        type: 'run.started',
        runId,
        engineId: this.readonlyTurnEngine.engineId,
        profile,
      };
      const result = await this.readonlyTurnEngine.startTurn({
        runId,
        identityId: command.identityId,
        conversationId: command.conversationId,
        message: command.content,
        signal,
      });
      yield {
        type: 'message.completed',
        runId,
        status: result.status,
        error: result.error,
      };
      return;
    }

    // Default: open chat through DirectTurnEngine / IOpenChatTurnPort.
    yield {
      type: 'run.started',
      runId,
      engineId: this.openChatTurn.engineId || DIRECT_TURN_ENGINE_ID,
      profile: 'direct_turn',
    };

    if (!command.conversationId?.trim()) {
      yield {
        type: 'error',
        code: 'CONVERSATION_REQUIRED',
        message: 'conversationId is required for direct_turn open chat',
        runId,
      };
      return;
    }

    const deltas: string[] = [];
    const result = await this.openChatTurn.streamConversationTurn(
      {
        runId,
        identityId: command.identityId,
        conversationId: command.conversationId,
        message: command.content,
        signal,
      },
      (chunk) => {
        if (chunk.content) {
          deltas.push(chunk.content);
        }
      },
    );

    for (const content of deltas) {
      yield { type: 'message.delta', runId, content };
    }

    yield {
      type: 'message.completed',
      runId,
      status: result.status,
      error: result.error,
      content: result.content,
    };
  }

  private async *dispatchApprove(
    command: Extract<AssistantCommand, { type: 'approve_proposal' }>,
  ): AsyncGenerator<AssistantEvent, void, void> {
    // Lifecycle only — never executeApproved / business mutation here.
    const approved = await this.proposalKernel.approve(command.proposalId, command.revision);
    yield {
      type: 'proposal.approved',
      runId: command.runId,
      proposalId: approved.id,
      revision: approved.revision,
    };
  }

  private async *dispatchReject(
    command: Extract<AssistantCommand, { type: 'reject_proposal' }>,
  ): AsyncGenerator<AssistantEvent, void, void> {
    const rejected = await this.proposalKernel.reject(
      command.proposalId,
      command.revision,
      command.reason,
    );
    yield {
      type: 'proposal.rejected',
      runId: command.runId,
      proposalId: rejected.id,
      revision: rejected.revision,
      reason: command.reason,
    };
  }

  private async *dispatchCancel(
    command: Extract<AssistantCommand, { type: 'cancel_run' }>,
  ): AsyncGenerator<AssistantEvent, void, void> {
    // Abort both production Turn Engines; unknown run ids are no-ops inside engines.
    await Promise.all([
      this.primaryTurnEngine.abort(command.runId),
      this.readonlyTurnEngine.abort(command.runId),
      this.openChatTurn.abort(command.runId),
    ]);
    yield { type: 'run.cancelled', runId: command.runId };
  }
}
