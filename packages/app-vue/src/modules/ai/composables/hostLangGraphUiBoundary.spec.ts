import { describe, expect, it } from 'vitest';
import {
  assertEventTypeAllowedForHostWorkbenchUi,
  collectHostWorkbenchLangGraphLeakageViolations,
  HOST_WORKBENCH_UI_CONTRACT_EVENT_TYPES,
  isHostWorkbenchUiContractEventType,
  isLangGraphVendorDiagnosticEventType,
  formatLangGraphVendorDiagnosticEventLabel,
  classifyLangGraphVendorDiagnosticPresentationKind,
} from './hostLangGraphUiBoundary';

describe('hostLangGraphUiBoundary (residual 413)', () => {
  it('allowlists AssistantFacade Host workbench product event types', () => {
    for (const type of HOST_WORKBENCH_UI_CONTRACT_EVENT_TYPES) {
      expect(isHostWorkbenchUiContractEventType(type)).toBe(true);
      expect(assertEventTypeAllowedForHostWorkbenchUi(type)).toEqual({
        allowed: true,
        reason: 'ui_contract',
      });
    }
  });

  it('classifies LangGraph node/checkpoint events as vendor diagnostic only', () => {
    for (const type of ['node.started', 'node.completed', 'tool.completed', 'checkpoint', 'lg.step']) {
      expect(isLangGraphVendorDiagnosticEventType(type)).toBe(true);
      expect(isHostWorkbenchUiContractEventType(type)).toBe(false);
      expect(assertEventTypeAllowedForHostWorkbenchUi(type).allowed).toBe(false);
      expect(assertEventTypeAllowedForHostWorkbenchUi(type).reason).toBe(
        type.startsWith('lg.') ? 'vendor_diagnostic' : 'vendor_diagnostic',
      );
    }
  });

  it('fails closed on unknown event types for Host workbench UI contract', () => {
    expect(assertEventTypeAllowedForHostWorkbenchUi('mystery.frame')).toEqual({
      allowed: false,
      reason: 'unknown',
    });
    expect(isHostWorkbenchUiContractEventType('')).toBe(false);
    expect(isLangGraphVendorDiagnosticEventType(null)).toBe(false);
  });

  it('flags LangGraph-native tokens when smuggled into Host product sources', () => {
    const violations = collectHostWorkbenchLangGraphLeakageViolations([
      { name: 'clean', content: "type: 'proposal.approved'" },
      {
        name: 'leaky',
        content: "render(event.type) // node.started + checkpoint",
      },
    ]);
    expect(violations.map((v) => `${v.source}:${v.token}`).sort()).toEqual([
      'leaky:checkpoint',
      'leaky:node.started',
    ]);
  });
});

describe('formatLangGraphVendorDiagnosticEventLabel (residual 415)', () => {
  it('maps node/tool events to diagnostic labels without raw node.* type text', () => {
    expect(
      formatLangGraphVendorDiagnosticEventLabel({
        type: 'node.completed',
        detail: 'search_knowledge',
      }),
    ).toBe('Workflow step completed · search_knowledge');
    expect(
      formatLangGraphVendorDiagnosticEventLabel({
        type: 'node.started',
        detail: 'draft_note',
      }),
    ).toBe('Workflow step started · draft_note');
    expect(
      formatLangGraphVendorDiagnosticEventLabel({
        type: 'tool.completed',
        detail: 'create_knowledge_note',
      }),
    ).toBe('Tool completed · create_knowledge_note');

    const started = formatLangGraphVendorDiagnosticEventLabel({ type: 'node.started' });
    const completed = formatLangGraphVendorDiagnosticEventLabel({
      type: 'node.completed',
      detail: 'x',
    });
    expect(started).not.toContain('node.started');
    expect(completed).not.toContain('node.completed');
    expect(classifyLangGraphVendorDiagnosticPresentationKind('node.completed')).toBe(
      'workflow_step_completed',
    );
  });

  it('accepts localized label overrides', () => {
    expect(
      formatLangGraphVendorDiagnosticEventLabel({
        type: 'node.completed',
        detail: 'draft_note',
        labels: { workflow_step_completed: '工作流步骤完成' },
      }),
    ).toBe('工作流步骤完成 · draft_note');
  });
});
