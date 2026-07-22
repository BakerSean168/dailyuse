import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 355/357: goal/knowledge waiting_approval confirm/cancel route through
 * AssistantFacade approve_proposal / reject_proposal before legacy executors.
 * Host panel lists only waiting_approval bridge proposals.
 */
describe('Host proposal lifecycle surface (residual 355/357)', () => {
  const dir = __dirname;
  const helper = readFileSync(resolve(dir, 'hostProposalLifecycle.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
  const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
  const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
  const panel = readFileSync(resolve(dir, '../components/AIHostProposalPanel.vue'), 'utf8');

  it('routes confirm/cancel lifecycle via dispatchAssistant Host commands', () => {
    expect(helper).toContain("type: 'approve_proposal'");
    expect(helper).toContain("type: 'reject_proposal'");
    expect(helper).toContain('buildAgentRunHostProposalRef');
    expect(helper).toContain('dispatchAssistant');
    expect(helper).toMatch(/service\s*\.\s*dispatchAssistant/);
    expect(helper).toContain('buildPendingHostProposalItems');
    expect(helper).toContain('dispatchHostProposalRevise');
    expect(helper).toContain("type: 'revise_proposal'");
    expect(helper).toContain('buildHostProposalPatchFromDraft');
    expect(helper).toContain('applyHostKnowledgePatchToAgentActions');
    expect(helper).toContain('targetPath');
    expect(helper).toContain('contentMarkdown');
    expect(helper).toContain('applyHostGoalPatchToAgentActions');
    expect(helper).toContain('goalDraftDescription');
    expect(helper).toContain("kind === 'goal.create'");
    expect(helper).toContain("runStatus: 'waiting_approval'");
    expect(helper).not.toContain('executeApproved');
    expect(helper).not.toContain('resumeAgentRun');

    expect(goal).toContain('dispatchHostProposalDecision');
    expect(goal).toContain("kind: 'goal.create'");
    expect(goal).toContain("decision: userDecision === 'confirm' ? 'approve' : 'reject'");
    expect(goal).toContain('resumeAgentRun');
    expect(goal).toContain('applyHostGoalPatchToAgentActions');
    expect(goal).toContain('title: hostOptions?.title');
    expect(goal).toContain('description: hostOptions?.description');
    expect(goal).not.toContain('executeApproved');

    expect(knowledge).toContain('dispatchHostProposalDecision');
    expect(knowledge).toContain("kind: 'knowledge.write'");
    expect(knowledge).toContain("decision: 'approve'");
    expect(knowledge).toContain('cancelKnowledgeNoteAgentRun');
    expect(knowledge).toContain('applyHostKnowledgePatchToAgentActions');
    expect(knowledge).toContain('targetPath: hostOptions?.targetPath');
    expect(knowledge).toContain('contentMarkdown: hostOptions?.contentMarkdown');
    expect(knowledge).not.toContain('executeApproved');

    expect(types).toContain("'dispatchAssistant'");
    expect(types).toMatch(
      /Pick<\s*AIChatService,\s*'generateGoal'\s*\|\s*'startAgentRun'\s*\|\s*'resumeAgentRun'\s*\|\s*'dispatchAssistant'\s*>/,
    );
  });

  it('mounts thin Host proposal panel for waiting_approval only', () => {
    expect(chatView).toContain('AIHostProposalPanel');
    expect(chatView).toContain('hostProposalItems');
    expect(chatView).toContain('handleHostProposalApprove');
    expect(chatView).toContain('handleHostProposalReject');
    expect(chatView).toContain('handleHostProposalRevise');
    expect(chatView).toContain('dispatchHostProposalRevise');
    expect(chatView).toContain('skipHostLifecycle');
    expect(chatView).toContain('targetPath: payload.patch.targetPath');
    expect(chatView).toContain('contentMarkdown: payload.patch.contentMarkdown');
    expect(chatView).toContain('title: payload.patch.title ?? payload.item.title');
    expect(chatView).toContain(
      'description: payload.patch.description ?? payload.item.description',
    );
    expect(chatView).toContain('buildPendingHostProposalItems');
    expect(panel).toContain('data-testid="ai-host-proposal-panel"');
    expect(panel).toContain('ai-host-proposal-approve-');
    expect(panel).toContain('ai-host-proposal-reject-');
    expect(panel).toContain('ai-host-proposal-revise-');
    expect(panel).toContain('ai-host-proposal-title-');
    expect(panel).toContain('ai-host-proposal-description-');
    expect(panel).toContain('ai-host-proposal-target-path-');
    expect(panel).toContain('ai-host-proposal-content-');
    expect(panel).toContain('editDescription');
    expect(panel).toContain('buildHostProposalPatchFromDraft');
    expect(panel).toContain('description: draft.description');
    expect(panel).not.toContain('executeApproved');
    expect(panel).not.toContain('resumeAgentRun');
    expect(panel).not.toContain('dispatchAssistant');
  });
});
