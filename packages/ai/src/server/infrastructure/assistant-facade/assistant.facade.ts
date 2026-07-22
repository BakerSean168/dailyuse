/**
 * AssistantFacade — production unified Host dispatch surface (ADR-035 residual 343).
 *
 * Routes:
 * - message → DirectTurnEngine open chat (default) or ReadonlyAnalysisTurnEngine (pi_readonly)
 * - approve_proposal / revise_proposal / reject_proposal → ProposalKernel lifecycle only
 * - cancel_run → abort both production Turn Engines
 *
 * Residual 355: agent-run bridge proposal ids (`agent-run:{runId}:{kind}`) are
 * materialised as ready proposals on first approve/reject so legacy AgentRun
 * waiting_approval UI can route lifecycle through the Host before executors.
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
import {
  applyAgentRunBridgeProposalPatch,
  materializeAgentRunBridgeProposal,
  parseAgentRunHostProposalId,
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
        case 'revise_proposal':
          yield* this.dispatchRevise(command);
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

    // Residual 351: yield message.delta live while the Turn Engine streams.
    const pending: AssistantEvent[] = [];
    let notify: (() => void) | null = null;
    let streamDone = false;
    let streamError: unknown;
    let streamResult: Awaited<
      ReturnType<IOpenChatTurnPort['streamConversationTurn']>
    > | null = null;

    const wake = () => {
      const resolve = notify;
      notify = null;
      resolve?.();
    };

    const streamPromise = this.openChatTurn
      .streamConversationTurn(
        {
          runId,
          identityId: command.identityId,
          conversationId: command.conversationId,
          message: command.content,
          providerId: command.providerId,
          model: command.model,
          signal,
        },
        (chunk) => {
          if (chunk.content) {
            pending.push({ type: 'message.delta', runId, content: chunk.content });
            wake();
          }
        },
      )
      .then((result) => {
        streamResult = result;
      })
      .catch((error) => {
        streamError = error;
      })
      .finally(() => {
        streamDone = true;
        wake();
      });

    while (!streamDone || pending.length > 0) {
      if (pending.length === 0) {
        await new Promise<void>((resolve) => {
          notify = resolve;
        });
        continue;
      }
      yield pending.shift()!;
    }

    await streamPromise;

    if (streamError) {
      throw streamError instanceof Error
        ? streamError
        : new Error('Open chat stream failed');
    }

    const result = streamResult!;
    yield {
      type: 'message.completed',
      runId,
      status: result.status,
      error: result.error,
      content: result.content,
      userMessage: result.userMessage
        ? { id: String(result.userMessage.id), content: result.userMessage.content }
        : undefined,
      assistantMessage: result.assistantMessage
        ? {
            id: String(result.assistantMessage.id),
            content: result.assistantMessage.content,
          }
        : undefined,
    };
  }

  private async *dispatchApprove(
    command: Extract<AssistantCommand, { type: 'approve_proposal' }>,
  ): AsyncGenerator<AssistantEvent, void, void> {
    // Lifecycle only — never executeApproved / business mutation here.
    await this.ensureAgentRunBridgeProposal(command.runId, command.proposalId);
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
    await this.ensureAgentRunBridgeProposal(command.runId, command.proposalId);
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

  private async *dispatchRevise(
    command: Extract<AssistantCommand, { type: 'revise_proposal' }>,
  ): AsyncGenerator<AssistantEvent, void, void> {
    // Lifecycle only — never executeApproved / business mutation here.
    const parsed = parseAgentRunHostProposalId(command.proposalId);
    if (!parsed || parsed.runId !== command.runId) {
      yield {
        type: 'error',
        code: 'PROPOSAL_REVISE_UNSUPPORTED',
        message: 'revise_proposal currently supports agent-run Host bridge proposals only',
        runId: command.runId,
      };
      return;
    }

    await this.ensureAgentRunBridgeProposal(command.runId, command.proposalId);
    // Patch-only payload; ProposalKernel.revise merges onto the stored proposal.
    const base = materializeAgentRunBridgeProposal(parsed.runId, parsed.kind);
    const patched = applyAgentRunBridgeProposalPatch(base, command.patch ?? {});
    const next = {
      kind: patched.kind,
      id: command.proposalId,
      // Optimistic concurrency: expected current revision before increment.
      revision: command.revision,
      status: 'ready' as const,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      ...(patched.kind === 'goal.create'
        ? {
            title:
              typeof command.patch?.title === 'string' && command.patch.title.trim()
                ? command.patch.title.trim()
                : undefined,
            description:
              command.patch && 'description' in command.patch
                ? command.patch.description
                : undefined,
          }
        : patched.kind === 'knowledge.write'
          ? {
              targetPath:
                typeof command.patch?.targetPath === 'string' && command.patch.targetPath.trim()
                  ? command.patch.targetPath.trim()
                  : undefined,
              contentMarkdown:
                typeof command.patch?.contentMarkdown === 'string' &&
                command.patch.contentMarkdown.trim()
                  ? command.patch.contentMarkdown
                  : undefined,
            }
          : {
              title:
                typeof command.patch?.title === 'string' && command.patch.title.trim()
                  ? command.patch.title.trim()
                  : undefined,
              goalId:
                command.patch && 'goalId' in command.patch ? command.patch.goalId : undefined,
            }),
    } as typeof patched;
    const revised = await this.proposalKernel.revise(command.proposalId, next);
    yield {
      type: 'proposal.revised',
      runId: command.runId,
      proposalId: revised.id,
      revision: revised.revision,
      kind: revised.kind,
      title: 'title' in revised ? revised.title : undefined,
      targetPath: 'targetPath' in revised ? revised.targetPath : undefined,
    };
  }

    /**
   * Materialise legacy AgentRun bridge proposals into ProposalKernel on first use.
   * Non-bridge ids are ignored (kernel remains source of truth).
   */
  private async ensureAgentRunBridgeProposal(runId: string, proposalId: string): Promise<void> {
    const parsed = parseAgentRunHostProposalId(proposalId);
    if (!parsed || parsed.runId !== runId) {
      return;
    }
    try {
      await this.proposalKernel.create(
        materializeAgentRunBridgeProposal(parsed.runId, parsed.kind),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message !== 'PROPOSAL_ALREADY_EXISTS') {
        throw error;
      }
    }
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
