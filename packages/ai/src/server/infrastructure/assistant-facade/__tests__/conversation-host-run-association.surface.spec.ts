import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Nightly residual N2 (AH-2): honest Conversation ↔ Host-run association boundary.
 *
 * Locks what is implemented after N1 without claiming agent-host §20 "multi-to-one
 * Conversation/AgentRun association" is complete:
 * - Open-chat Host turns bind via AssistantFacade run.started.conversationId (N1)
 * - Workflow AgentRun DTOs already carry conversationId + list filter by conversation
 * - Open-chat assistant-run ids are process-local Host events, NOT listAgentRuns rows
 * - Full product recovery UI (list Host open-chat runs by conversation) remains open
 */
describe('Conversation ↔ Host open-chat association boundary (nightly N2 / AH-2)', () => {
  const repoRoot = resolve(__dirname, '../../../../../../../');
  const facade = readFileSync(resolve(__dirname, '../assistant.facade.ts'), 'utf8');
  const ports = readFileSync(
    resolve(repoRoot, 'packages/contracts/src/modules/ai/agent-host/ports.ts'),
    'utf8',
  );
  const agentDto = readFileSync(
    resolve(repoRoot, 'packages/contracts/src/modules/ai/api/ai-agent.dto.ts'),
    'utf8',
  );
  const checkpointPort = readFileSync(
    resolve(repoRoot, 'packages/ai/src/server/application/ports/agent-checkpoint.port.ts'),
    'utf8',
  );
  const agentClient = readFileSync(
    resolve(repoRoot, 'packages/ai/src/application-client/ai-client.port.ts'),
    'utf8',
  );
  const nightlyPlan = readFileSync(
    resolve(repoRoot, 'docs/plan/active/2026-07-25-nightly-hygiene-and-agent-host.md'),
    'utf8',
  );
  const agentHostPlan = readFileSync(
    resolve(repoRoot, 'docs/plan/active/2026-07-17-unified-assistant-agent-host.md'),
    'utf8',
  );

  it('N1 contract: run.started may carry conversationId; facade trims and emits it', () => {
    expect(ports).toContain("type: 'run.started'");
    expect(ports).toContain('conversationId?: string');
    expect(ports).toContain('Residual N1');
    expect(facade).toContain('Residual N1');
    expect(facade).toContain('const conversationId = command.conversationId?.trim()');
    expect(facade).toContain('...(conversationId ? { conversationId } : {})');
    expect(facade).toContain('CONVERSATION_REQUIRED');
  });

  it('workflow AgentRun path: conversationId on DTO + list params + checkpoint list input', () => {
    expect(agentDto).toMatch(/export const AgentRunSchema[\s\S]*conversationId:/);
    expect(agentDto).toMatch(/export const AgentRunListParamsSchema[\s\S]*conversationId:/);
    expect(checkpointPort).toContain('conversationId?: string');
    expect(agentClient).toContain('listAgentRuns(params?: AgentRunListParams)');
  });

  it('honest gap: open-chat Host runs are not listAgentRuns persistence', () => {
    // assistant-run-* ids are facade-local; listAgentRuns is AgentRun/workflow path.
    expect(facade).toContain('assistant-run-');
    expect(facade).not.toMatch(/listAgentRuns|listRuns\(/);
    expect(agentClient).toContain('listAgentRuns');
    expect(agentClient).toContain('dispatchAssistant');
  });

  it('plans record AH-2 pending recovery UI and do not claim §20 association complete', () => {
    expect(nightlyPlan).toContain('AH-2');
    expect(nightlyPlan).toContain('listAgentRuns');
    expect(agentHostPlan).toContain('run.started.conversationId');
    expect(agentHostPlan).toMatch(
      /Conversation 与 AgentRun 有明确、多对一的关联[\s\S]*部分/,
    );
    expect(agentHostPlan).not.toMatch(
      /- \[x\] Conversation 与 AgentRun 有明确、多对一的关联/,
    );
  });
});
