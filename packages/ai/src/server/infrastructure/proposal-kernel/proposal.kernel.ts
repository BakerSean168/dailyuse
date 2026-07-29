/**
 * ProposalKernel — production Agent Host proposal lifecycle (ADR-035 stage 1 start).
 *
 * Residual 320: IProposalKernelPort implementation.
 * Owns draft → ready/stale → approved/rejected → executed revision lifecycle with
 * optimistic concurrency. Does not execute business mutations itself —
 * executeApproved marks executed and returns ExecutionReceipt; host mutation
 * ports (knowledge note / automation) remain separate and still require
 * explicit user confirmation.
 *
 * Nightly N3 (AH-3): product precondition — `stale` cannot `approve` until
 * `revise` clears the precondition (status → draft/ready).
 *
 * Offers tool.proposal only — never tool.mutation or engine.* labels.
 */
import type {
  AgentProposal,
  CapabilityOffer,
  ExecutionReceipt,
  IProposalKernelPort,
} from '@memoflow/contracts/ai';

export const PROPOSAL_KERNEL_PROVIDER_ID = 'proposal-kernel' as const;

function now(): number {
  return Date.now();
}

function cloneProposal<T extends AgentProposal>(proposal: T): T {
  return { ...proposal };
}

function assertId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error('PROPOSAL_ID_REQUIRED');
  }
}

function isTerminal(status: AgentProposal['status']): boolean {
  return status === 'executed' || status === 'failed';
}

export class ProposalKernel implements IProposalKernelPort {
  private readonly proposals = new Map<string, AgentProposal>();
  /** Idempotency: requestId → receipt for executeApproved. */
  private readonly receiptsByRequestId = new Map<string, ExecutionReceipt>();

  /**
   * Host capability offer for tool.proposal. Callers must still supply
   * tool.mutation / context separately for knowledge-write plans.
   */
  toCapabilityOffer(surface: CapabilityOffer['surface'] = 'any'): CapabilityOffer {
    return {
      kind: 'tool.proposal',
      providerId: PROPOSAL_KERNEL_PROVIDER_ID,
      surface,
      readonly: false,
    };
  }

  /** Test/diagnostic read — not part of IProposalKernelPort. */
  get(proposalId: string): AgentProposal | undefined {
    const found = this.proposals.get(proposalId);
    return found ? cloneProposal(found) : undefined;
  }

  async create(proposal: AgentProposal): Promise<AgentProposal> {
    assertId(proposal.id);
    if (this.proposals.has(proposal.id)) {
      throw new Error('PROPOSAL_ALREADY_EXISTS');
    }
    if (
      proposal.kind !== 'goal.create' &&
      proposal.kind !== 'knowledge.write' &&
      proposal.kind !== 'task.create'
    ) {
      throw new Error('PROPOSAL_KIND_UNSUPPORTED');
    }
    if (
      isTerminal(proposal.status) ||
      proposal.status === 'approved' ||
      proposal.status === 'rejected'
    ) {
      throw new Error('PROPOSAL_CREATE_STATUS_INVALID');
    }

    const createdAt = proposal.createdAt ?? now();
    const status: AgentProposal['status'] =
      proposal.status === 'ready' || proposal.status === 'draft' || proposal.status === 'stale'
        ? proposal.status
        : 'draft';

    const stored = cloneProposal({
      ...proposal,
      status,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
    });
    this.proposals.set(stored.id, stored);
    return cloneProposal(stored);
  }

  async revise(proposalId: string, next: AgentProposal): Promise<AgentProposal> {
    assertId(proposalId);
    const current = this.proposals.get(proposalId);
    if (!current) {
      throw new Error('PROPOSAL_NOT_FOUND');
    }
    if (isTerminal(current.status)) {
      throw new Error('PROPOSAL_TERMINAL');
    }
    if (next.id && next.id !== proposalId) {
      throw new Error('PROPOSAL_ID_MISMATCH');
    }
    if (next.kind !== current.kind) {
      throw new Error('PROPOSAL_KIND_IMMUTABLE');
    }

    // Residual 359: next.revision (when positive) is the expected current revision.
    if (
      typeof next.revision === 'number' &&
      next.revision > 0 &&
      next.revision !== current.revision
    ) {
      throw new Error('PROPOSAL_REVISION_CONFLICT');
    }

    // User edit produces a new revision; approval is invalidated.
    // Residual 359: merge patch onto current so unspecified fields are preserved.
    // Nightly N3 (AH-3): revising a stale proposal clears precondition failure —
    // default back to draft unless the patch explicitly sets ready/draft/stale.
    // Leaving status=stale after an edit would re-block approve forever.
    const status: AgentProposal['status'] =
      next.status === 'ready' || next.status === 'draft' || next.status === 'stale'
        ? next.status
        : current.status === 'approved' ||
            current.status === 'rejected' ||
            current.status === 'stale'
          ? 'draft'
          : current.status === 'ready' || current.status === 'draft'
            ? current.status
            : 'draft';

    const patchEntries = Object.entries(next as Record<string, unknown>).filter(
      ([key, value]) =>
        value !== undefined &&
        key !== 'id' &&
        key !== 'kind' &&
        key !== 'revision' &&
        key !== 'createdAt' &&
        key !== 'updatedAt',
    );
    const patch = Object.fromEntries(patchEntries);

    const revised = cloneProposal({
      ...current,
      ...patch,
      id: proposalId,
      kind: current.kind,
      status,
      revision: current.revision + 1,
      createdAt: current.createdAt,
      updatedAt: now(),
    } as AgentProposal);
    this.proposals.set(proposalId, revised);
    return cloneProposal(revised);
  }

  async markStale(proposalId: string, reason: string): Promise<AgentProposal> {
    assertId(proposalId);
    const current = this.proposals.get(proposalId);
    if (!current) {
      throw new Error('PROPOSAL_NOT_FOUND');
    }
    if (isTerminal(current.status)) {
      throw new Error('PROPOSAL_TERMINAL');
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error('PROPOSAL_STALE_REASON_REQUIRED');
    }

    const stale = cloneProposal({
      ...current,
      status: 'stale',
      updatedAt: now(),
    });
    this.proposals.set(proposalId, stale);
    // reason is recorded only via call-site audit for now (status carrier).
    void reason;
    return cloneProposal(stale);
  }

  async approve(proposalId: string, revision: number): Promise<AgentProposal> {
    assertId(proposalId);
    const current = this.requireRevision(proposalId, revision);
    if (isTerminal(current.status) || current.status === 'rejected') {
      throw new Error('PROPOSAL_NOT_APPROVABLE');
    }
    // Nightly N3 (AH-3): product precondition — stale proposals are not approvable
    // until the user revises (clears stale → draft/ready). Prevents approving after
    // context/precondition drift without re-edit.
    if (current.status === 'stale') {
      throw new Error('PROPOSAL_STALE');
    }
    // draft/ready/approved (re-approve same revision is idempotent)
    if (current.status === 'approved' && current.revision === revision) {
      return cloneProposal(current);
    }

    const approved = cloneProposal({
      ...current,
      status: 'approved',
      updatedAt: now(),
    });
    this.proposals.set(proposalId, approved);
    return cloneProposal(approved);
  }

  async reject(proposalId: string, revision: number, reason?: string): Promise<AgentProposal> {
    assertId(proposalId);
    const current = this.requireRevision(proposalId, revision);
    if (isTerminal(current.status)) {
      throw new Error('PROPOSAL_TERMINAL');
    }
    if (current.status === 'rejected' && current.revision === revision) {
      return cloneProposal(current);
    }
    void reason;

    const rejected = cloneProposal({
      ...current,
      status: 'rejected',
      updatedAt: now(),
    });
    this.proposals.set(proposalId, rejected);
    return cloneProposal(rejected);
  }

  async executeApproved(
    proposalId: string,
    revision: number,
    requestId: string,
  ): Promise<ExecutionReceipt> {
    assertId(proposalId);
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('REQUEST_ID_REQUIRED');
    }

    const existing = this.receiptsByRequestId.get(requestId);
    if (existing) {
      // Idempotent: same requestId always returns the same receipt.
      return { ...existing };
    }

    const current = this.proposals.get(proposalId);
    if (!current) {
      return this.recordReceipt({
        proposalId,
        proposalRevision: revision,
        ok: false,
        code: 'PROPOSAL_NOT_FOUND',
        message: 'Proposal not found',
        requestId,
      });
    }

    if (current.revision !== revision) {
      return this.recordReceipt({
        proposalId,
        proposalRevision: revision,
        ok: false,
        code: 'STALE_REVISION',
        message: `Expected revision ${current.revision}, got ${revision}`,
        requestId,
      });
    }

    if (current.status === 'executed') {
      // Already executed under a different requestId — do not re-run.
      return this.recordReceipt({
        proposalId,
        proposalRevision: revision,
        ok: false,
        code: 'ALREADY_EXECUTED',
        message: 'Proposal already executed',
        requestId,
      });
    }

    if (current.status !== 'approved') {
      return this.recordReceipt({
        proposalId,
        proposalRevision: revision,
        ok: false,
        code: 'NOT_APPROVED',
        message: `Proposal status is ${current.status}`,
        requestId,
      });
    }

    // Lifecycle receipt only — business mutation ports remain separate.
    const executed = cloneProposal({
      ...current,
      status: 'executed',
      updatedAt: now(),
    });
    this.proposals.set(proposalId, executed);

    return this.recordReceipt({
      proposalId,
      proposalRevision: revision,
      ok: true,
      code: 'EXECUTED',
      message: 'Proposal marked executed; host mutation ports own side effects',
      requestId,
    });
  }

  private requireRevision(proposalId: string, revision: number): AgentProposal {
    const current = this.proposals.get(proposalId);
    if (!current) {
      throw new Error('PROPOSAL_NOT_FOUND');
    }
    if (current.revision !== revision) {
      throw new Error('STALE_REVISION');
    }
    return current;
  }

  private recordReceipt(
    input: Omit<ExecutionReceipt, 'executedAt'> & { executedAt?: number },
  ): ExecutionReceipt {
    const receipt: ExecutionReceipt = {
      proposalId: input.proposalId,
      proposalRevision: input.proposalRevision,
      ok: input.ok,
      code: input.code,
      message: input.message,
      executedAt: input.executedAt ?? now(),
      requestId: input.requestId,
    };
    this.receiptsByRequestId.set(input.requestId, receipt);
    return { ...receipt };
  }
}
