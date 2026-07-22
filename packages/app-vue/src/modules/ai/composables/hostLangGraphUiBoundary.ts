/**
 * Residual 413: LangGraph vendor UI leakage boundary for Host workbench.
 *
 * ADR-035: LangGraph node events, checkpoints, and thread-native events may
 * appear in diagnostic traces, but Host workbench product contracts (Proposal /
 * receipt / timeline / open-chat composition) must not require them as UI
 * semantics.
 *
 * This module is presentation-policy only — no Host kernel mutation execution.
 */

/** AssistantFacade Host product event types consumed by open-chat + proposal UI. */
export const HOST_WORKBENCH_UI_CONTRACT_EVENT_TYPES = [
  'run.started',
  'run.cancelled',
  'message.delta',
  'message.completed',
  'proposal.approved',
  'proposal.rejected',
  'proposal.revised',
  'error',
] as const;

export type HostWorkbenchUiContractEventType =
  (typeof HOST_WORKBENCH_UI_CONTRACT_EVENT_TYPES)[number];

/** LangGraph / vendor-native event prefixes that must stay diagnostic-only. */
export const LANGGRAPH_VENDOR_DIAGNOSTIC_EVENT_PREFIXES = [
  'node.',
  'checkpoint.',
  'lg.',
  'langgraph.',
] as const;

/** Exact vendor diagnostic event types observed in legacy workflow panels. */
export const LANGGRAPH_VENDOR_DIAGNOSTIC_EVENT_TYPES = [
  'node.started',
  'node.completed',
  'tool.completed',
  'checkpoint',
] as const;

export function isHostWorkbenchUiContractEventType(type: string | null | undefined): boolean {
  if (typeof type !== 'string' || !type.trim()) return false;
  return (HOST_WORKBENCH_UI_CONTRACT_EVENT_TYPES as readonly string[]).includes(type.trim());
}

export function isLangGraphVendorDiagnosticEventType(type: string | null | undefined): boolean {
  if (typeof type !== 'string' || !type.trim()) return false;
  const normalized = type.trim();
  if ((LANGGRAPH_VENDOR_DIAGNOSTIC_EVENT_TYPES as readonly string[]).includes(normalized)) {
    return true;
  }
  return LANGGRAPH_VENDOR_DIAGNOSTIC_EVENT_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix),
  );
}

/**
 * Fail-closed: Host workbench product UI must not treat vendor-native events as
 * required contract input. Diagnostic panels may still render them.
 */
export function assertEventTypeAllowedForHostWorkbenchUi(type: string): {
  allowed: boolean;
  reason: 'ui_contract' | 'vendor_diagnostic' | 'unknown';
} {
  if (isHostWorkbenchUiContractEventType(type)) {
    return { allowed: true, reason: 'ui_contract' };
  }
  if (isLangGraphVendorDiagnosticEventType(type)) {
    return { allowed: false, reason: 'vendor_diagnostic' };
  }
  // Unknown types are not Host workbench contract until explicitly allowlisted.
  return { allowed: false, reason: 'unknown' };
}

export type HostWorkbenchLangGraphLeakageViolation = {
  source: string;
  token: string;
  detail: string;
};

/**
 * Source-level audit for Host workbench product surfaces.
 * Flags LangGraph-native tokens that must not become Host UI contracts.
 */
export function collectHostWorkbenchLangGraphLeakageViolations(
  sources: ReadonlyArray<{ name: string; content: string }>,
): HostWorkbenchLangGraphLeakageViolation[] {
  const banned = [
    'node.started',
    'node.completed',
    'checkpoint',
    'langgraph.',
    'thread_id',
    'lg.checkpoint',
  ] as const;
  const violations: HostWorkbenchLangGraphLeakageViolation[] = [];
  for (const source of sources) {
    for (const token of banned) {
      if (source.content.includes(token)) {
        violations.push({
          source: source.name,
          token,
          detail: `Host workbench product surface must not depend on ${token}`,
        });
      }
    }
  }
  return violations;
}

/**
 * Residual 415: classify vendor diagnostic event types for presentation.
 * Host workbench still must not treat these as product UI contracts.
 */
export type LangGraphVendorDiagnosticPresentationKind =
  | 'workflow_step_started'
  | 'workflow_step_completed'
  | 'tool_completed'
  | 'checkpoint'
  | 'vendor_diagnostic'
  | 'unknown';

export function classifyLangGraphVendorDiagnosticPresentationKind(
  type: string | null | undefined,
): LangGraphVendorDiagnosticPresentationKind {
  if (typeof type !== 'string' || !type.trim()) return 'unknown';
  const normalized = type.trim();
  if (normalized === 'node.started') return 'workflow_step_started';
  if (normalized === 'node.completed') return 'workflow_step_completed';
  if (normalized === 'tool.completed') return 'tool_completed';
  if (normalized === 'checkpoint' || normalized.startsWith('checkpoint.')) return 'checkpoint';
  if (isLangGraphVendorDiagnosticEventType(normalized)) return 'vendor_diagnostic';
  return 'unknown';
}

const DEFAULT_DIAGNOSTIC_LABELS: Record<LangGraphVendorDiagnosticPresentationKind, string> = {
  workflow_step_started: 'Workflow step started',
  workflow_step_completed: 'Workflow step completed',
  tool_completed: 'Tool completed',
  checkpoint: 'Checkpoint',
  vendor_diagnostic: 'Vendor diagnostic',
  unknown: 'Runtime event',
};

/**
 * Residual 415: format vendor diagnostic events without leaking raw node.* type
 * strings into product-facing diagnostic UI text.
 */
export function formatLangGraphVendorDiagnosticEventLabel(input: {
  type: string;
  detail?: string | null;
  labels?: Partial<Record<LangGraphVendorDiagnosticPresentationKind, string>>;
}): string {
  const kind = classifyLangGraphVendorDiagnosticPresentationKind(input.type);
  const labels = { ...DEFAULT_DIAGNOSTIC_LABELS, ...(input.labels ?? {}) };
  const head = labels[kind] || DEFAULT_DIAGNOSTIC_LABELS.unknown;
  const detail =
    typeof input.detail === 'string' && input.detail.trim() ? input.detail.trim() : '';
  // Never fall back to raw vendor type for known diagnostic kinds.
  if (detail) return `${head} · ${detail}`;
  if (kind === 'unknown' || kind === 'vendor_diagnostic') {
    // Unknown/other vendor types keep a sanitized head only (no raw type leak preferred).
    return head;
  }
  return head;
}

