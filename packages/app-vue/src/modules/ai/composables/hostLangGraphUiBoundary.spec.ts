import { describe, expect, it } from 'vitest';
import {
  assertEventTypeAllowedForHostWorkbenchUi,
  collectHostWorkbenchLangGraphLeakageViolations,
  HOST_WORKBENCH_UI_CONTRACT_EVENT_TYPES,
  isHostWorkbenchUiContractEventType,
  isLangGraphVendorDiagnosticEventType,
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
