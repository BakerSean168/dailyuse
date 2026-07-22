import { describe, expect, it, beforeEach } from 'vitest';
import {
  knowledgeWriteRequirements,
  resolveRunPlan,
  type AgentProposal,
} from '@dailyuse/contracts/ai';
import { ProposalKernel, PROPOSAL_KERNEL_PROVIDER_ID } from '../proposal.kernel';

function knowledgeDraft(overrides: Partial<AgentProposal> = {}): AgentProposal {
  return {
    kind: 'knowledge.write',
    id: 'prop-1',
    status: 'draft',
    revision: 0,
    targetPath: 'notes/hello.md',
    contentMarkdown: '# Hello',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  } as AgentProposal;
}

describe('ProposalKernel', () => {
  let kernel: ProposalKernel;

  beforeEach(() => {
    kernel = new ProposalKernel();
  });

  it('exposes proposal-kernel provider and tool.proposal only', () => {
    const offer = kernel.toCapabilityOffer('web');
    expect(offer).toEqual({
      kind: 'tool.proposal',
      providerId: PROPOSAL_KERNEL_PROVIDER_ID,
      surface: 'web',
      readonly: false,
    });
    expect(offer.kind).not.toBe('tool.mutation');
    expect(offer.kind.startsWith('engine.')).toBe(false);
  });

  it('tool.proposal alone cannot satisfy knowledge-write requirements', () => {
    const plan = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: [kernel.toCapabilityOffer('web')],
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind).sort()).toEqual(
      ['context.cloud_rag', 'tool.mutation'].sort(),
    );
  });

  it('creates with revision 1 and rejects duplicate ids', async () => {
    const created = await kernel.create(knowledgeDraft({ revision: 99 }));
    expect(created.revision).toBe(1);
    expect(created.status).toBe('draft');
    await expect(kernel.create(knowledgeDraft())).rejects.toThrow('PROPOSAL_ALREADY_EXISTS');
  });

  it('rejects revise when expected revision does not match current', async () => {
    await kernel.create(knowledgeDraft({ status: 'ready' }));
    await expect(
      kernel.revise('prop-1', {
        ...knowledgeDraft({ status: 'ready', contentMarkdown: '# x' }),
        revision: 9,
      }),
    ).rejects.toThrow('PROPOSAL_REVISION_CONFLICT');
  });

  it('revises with optimistic new revision and invalidates prior approval path', async () => {
    await kernel.create(knowledgeDraft({ status: 'ready' }));
    const approved = await kernel.approve('prop-1', 1);
    expect(approved.status).toBe('approved');

    const revised = await kernel.revise('prop-1', {
      ...knowledgeDraft({
        status: 'ready',
        contentMarkdown: '# Revised',
      }),
    });
    expect(revised.revision).toBe(2);
    expect(revised.status).toBe('ready');
    expect(revised.contentMarkdown).toBe('# Revised');

    await expect(kernel.approve('prop-1', 1)).rejects.toThrow('STALE_REVISION');
    const reapproved = await kernel.approve('prop-1', 2);
    expect(reapproved.status).toBe('approved');
    expect(reapproved.revision).toBe(2);
  });

  it('markStale then re-approve works; executeApproved is revision/idempotent', async () => {
    await kernel.create(knowledgeDraft({ status: 'ready' }));
    await kernel.approve('prop-1', 1);
    const stale = await kernel.markStale('prop-1', 'context changed');
    expect(stale.status).toBe('stale');

    const reapproved = await kernel.approve('prop-1', 1);
    expect(reapproved.status).toBe('approved');

    const receipt = await kernel.executeApproved('prop-1', 1, 'req-1');
    expect(receipt.ok).toBe(true);
    expect(receipt.code).toBe('EXECUTED');
    expect(receipt.requestId).toBe('req-1');
    expect(kernel.get('prop-1')?.status).toBe('executed');

    const again = await kernel.executeApproved('prop-1', 1, 'req-1');
    expect(again).toEqual(receipt);

    const otherReq = await kernel.executeApproved('prop-1', 1, 'req-2');
    expect(otherReq.ok).toBe(false);
    expect(otherReq.code).toBe('ALREADY_EXECUTED');
  });

  it('fails closed on not-approved execute and reject path', async () => {
    await kernel.create(knowledgeDraft());
    const blocked = await kernel.executeApproved('prop-1', 1, 'req-block');
    expect(blocked.ok).toBe(false);
    expect(blocked.code).toBe('NOT_APPROVED');

    const rejected = await kernel.reject('prop-1', 1, 'user said no');
    expect(rejected.status).toBe('rejected');
    await expect(kernel.approve('prop-1', 1)).rejects.toThrow('PROPOSAL_NOT_APPROVABLE');
  });

  it('does not claim mutation — executeApproved is lifecycle-only receipt', async () => {
    const goal: AgentProposal = {
      kind: 'goal.create',
      id: 'prop-goal',
      status: 'ready',
      revision: 0,
      title: 'Ship kernel',
      createdAt: 1,
      updatedAt: 1,
    };
    await kernel.create(goal);
    await kernel.approve('prop-goal', 1);
    const receipt = await kernel.executeApproved('prop-goal', 1, 'req-goal');
    expect(receipt.ok).toBe(true);
    expect(receipt.message).toContain('host mutation ports');
  });
});
