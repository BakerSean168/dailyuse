/**
 * Agent Proposal kernel contracts (ADR-035 stage 1 preview types frozen early).
 * Agent 提案内核契约（阶段 1 类型提前冻结，便于并行开发）。
 */

import type { TransferDate } from '../../../primitives';

export type AgentProposalStatus =
  | 'draft'
  | 'ready'
  | 'stale'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'failed';

/**
 * Discriminated business side-effect proposal. Engines may only create proposals;
 * Host executes mutations after explicit user approval.
 * 可判别业务副作用提案。Engine 只能创建提案；Host 在用户明确批准后执行变更。
 */
export type AgentProposal =
  | {
      kind: 'goal.create';
      id: string;
      status: AgentProposalStatus;
      revision: number;
      title: string;
      description?: string | null;
      createdAt: TransferDate;
      updatedAt: TransferDate;
    }
  | {
      kind: 'knowledge.write';
      id: string;
      status: AgentProposalStatus;
      revision: number;
      /** Absolute or vault-relative path; never outside vault root. */
      targetPath: string;
      contentMarkdown: string;
      createdAt: TransferDate;
      updatedAt: TransferDate;
    }
  | {
      kind: 'task.create';
      id: string;
      status: AgentProposalStatus;
      revision: number;
      title: string;
      goalId?: string | null;
      createdAt: TransferDate;
      updatedAt: TransferDate;
    };

export interface ExecutionReceipt {
  proposalId: string;
  proposalRevision: number;
  ok: boolean;
  code?: string;
  message?: string;
  executedAt: TransferDate;
  /** Idempotency key used by Host. */
  requestId: string;
}
