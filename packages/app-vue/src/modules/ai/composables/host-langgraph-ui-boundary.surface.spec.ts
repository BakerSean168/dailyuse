import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectHostWorkbenchLangGraphLeakageViolations } from './hostLangGraphUiBoundary';

/**
 * Residual 413: Host workbench product surfaces must not require LangGraph-native
 * node/checkpoint/thread tokens. Legacy Goal workflow panel may still render
 * diagnostic node.* traces — that residual leakage is documented, not Host contract.
 */
describe('Host LangGraph UI leakage boundary surface (residual 413)', () => {
  const dir = __dirname;
  const boundary = readFileSync(resolve(dir, 'hostLangGraphUiBoundary.ts'), 'utf8');
  const hostLifecycle = readFileSync(resolve(dir, 'hostProposalLifecycle.ts'), 'utf8');
  const openChatCancel = readFileSync(resolve(dir, 'hostOpenChatCancel.ts'), 'utf8');
  const openChatMemory = readFileSync(resolve(dir, 'hostOpenChatTurnMemory.ts'), 'utf8');
  const proposalPanel = readFileSync(
    resolve(dir, '../components/AIHostProposalPanel.vue'),
    'utf8',
  );
  const receiptPanel = readFileSync(
    resolve(dir, '../components/AIHostExecutionReceiptPanel.vue'),
    'utf8',
  );
  const timelineStrip = readFileSync(
    resolve(dir, '../components/AIHostTimelineArtifactStrip.vue'),
    'utf8',
  );
  const goalPanel = readFileSync(resolve(dir, '../components/AIGoalWorkflowPanel.vue'), 'utf8');

  it('defines Host workbench UI contract vs LangGraph diagnostic classification', () => {
    expect(boundary).toContain('Residual 413');
    expect(boundary).toContain('HOST_WORKBENCH_UI_CONTRACT_EVENT_TYPES');
    expect(boundary).toContain('isLangGraphVendorDiagnosticEventType');
    expect(boundary).toContain('assertEventTypeAllowedForHostWorkbenchUi');
    expect(boundary).toContain('collectHostWorkbenchLangGraphLeakageViolations');
    expect(boundary).toContain('node.started');
    expect(boundary).toContain('run.started');
    expect(boundary).toContain('proposal.approved');
    expect(boundary).not.toContain('executeApproved');
    expect(boundary).not.toContain('child_process');
  });

  it('keeps Host proposal/receipt/timeline/open-chat product surfaces free of LangGraph UI contracts', () => {
    const violations = collectHostWorkbenchLangGraphLeakageViolations([
      { name: 'hostProposalLifecycle.ts', content: hostLifecycle },
      { name: 'hostOpenChatCancel.ts', content: openChatCancel },
      { name: 'hostOpenChatTurnMemory.ts', content: openChatMemory },
      { name: 'AIHostProposalPanel.vue', content: proposalPanel },
      { name: 'AIHostExecutionReceiptPanel.vue', content: receiptPanel },
      { name: 'AIHostTimelineArtifactStrip.vue', content: timelineStrip },
    ]);
    expect(violations).toEqual([]);
  });

  it('documents Goal workflow panel residual diagnostic node.* leakage (not Host contract)', () => {
    // Known residual: legacy workflow panel still formats node.* for diagnostics.
    expect(goalPanel).toContain('node.completed');
    expect(goalPanel).toMatch(/event\.type/);
    // Host product surfaces above stay free; Goal panel is not Host workbench contract.
    expect(hostLifecycle).not.toContain('node.started');
    expect(hostLifecycle).not.toContain('node.completed');
    expect(proposalPanel).not.toContain('node.started');
    expect(receiptPanel).not.toContain('node.started');
    expect(timelineStrip).not.toContain('node.started');
  });
});
