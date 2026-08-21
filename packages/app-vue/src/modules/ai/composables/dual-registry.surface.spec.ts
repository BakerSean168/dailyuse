/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 4 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: ai-composable-type-duals.surface.spec.ts, create-agent-id-dual.surface.spec.ts, get-record-string-dual.surface.spec.ts, is-record-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createAgentId } from './createAgentId';
import { getRecordString } from './getRecordString';
import { isRecord } from './isRecord';

// --- merged from ai-composable-type-duals.surface.spec.ts ---
{
  /**
   * Residual 248/252/254: AI composable types drop identity dual aliases.
   * Agent run/action and goal draft/clarification types use @memoflow/contracts/ai names directly.
   */
  describe('AI composable type dual alias single-track surface', () => {
    const dir = __dirname;
    const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
    const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');
    const goalWorkflow = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    const goalDraftHelpers = readFileSync(resolve(dir, 'goalDraftHelpers.ts'), 'utf8');
    const goalAutomationHelpers = readFileSync(resolve(dir, 'goalAutomationHelpers.ts'), 'utf8');
    const workflowPersistence = readFileSync(resolve(dir, 'useAIWorkflowPersistence.ts'), 'utf8');
    const chatView = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    const chatSession = readFileSync(resolve(dir, 'useAIChatSession.ts'), 'utf8');
    const goalPanel = readFileSync(resolve(dir, '../components/AIGoalWorkflowPanel.vue'), 'utf8');
    const actionBar = readFileSync(resolve(dir, '../components/AIWorkflowActionBar.vue'), 'utf8');

    it('does not define unused Goal/KnowledgeNote AgentArtifact dual aliases', () => {
      expect(types).not.toContain('export type GoalAgentArtifact');
      expect(types).not.toContain('export type GoalAgentExecutedAction');
      expect(types).not.toContain('export type KnowledgeNoteAgentArtifact');
    });

    it('does not dual-alias agent run/action/stream result types', () => {
      expect(types).not.toMatch(/export type StreamDoneResult\s*=/);
      expect(types).not.toMatch(/export type AgentRunSummary\s*=/);
      expect(types).not.toMatch(/export type GoalAgentRunResult\s*=/);
      expect(types).not.toMatch(/export type KnowledgeQaAgentRunResult\s*=/);
      expect(types).not.toMatch(/export type KnowledgeNoteAgentRunResult\s*=/);
      expect(types).not.toMatch(/export type GoalAgentAction\s*=/);
      expect(index).not.toMatch(/\bGoalAgentRunResult\b/);
      expect(index).not.toMatch(/\bGoalAgentAction\b/);
      expect(index).not.toMatch(/\bKnowledgeQaAgentRunResult\b/);
      expect(index).not.toMatch(/\bKnowledgeNoteAgentRunResult\b/);
    });

    it('does not dual-alias GoalDraft/GoalClarification identity types', () => {
      expect(types).not.toMatch(/export type GoalDraft\s*=/);
      expect(types).not.toMatch(/export type GoalClarification\s*=/);
      expect(index).not.toMatch(/\bGoalDraft\b/);
      expect(index).not.toMatch(/\bGoalClarification\b/);
      expect(index).not.toMatch(/\bGoalClarificationDTO\b/);
      expect(index).not.toMatch(/\bGoalWorkflowDraftResultDTO\b/);
    });

    it('keeps goal.create on typed Workflow contracts while transitional Agent lanes use canonical contracts', () => {
      expect(goalWorkflow).toContain("from '@memoflow/contracts/ai'");
      expect(goalWorkflow).toMatch(/\bAIWorkflowRunView\b/);
      expect(goalWorkflow).toMatch(/\bGoalPlanDraft\b/);
      expect(goalWorkflow).toMatch(/\bGoalPlanDraftContent\b/);
      expect(goalWorkflow).not.toMatch(/import[^;]*\bAgentRunResult\b/s);
      expect(goalWorkflow).not.toMatch(/import[^;]*\bAgentAction\b/s);
      expect(goalWorkflow).not.toMatch(/\bGoalAgentRunResult\b/);
      expect(goalWorkflow).not.toMatch(/\bGoalAgentAction\b/);
      expect(chatView).toMatch(/\bAgentRun\b/);
      expect(chatView).not.toMatch(/\bAgentRunSummary\b/);
      // AI-vNext Batch B: default open chat consumes the canonical Mastra runtime event
      // contract directly; legacy AssistantEvent remains only on transitional workflow paths.
      expect(chatSession).toMatch(/\bAssistantRuntimeEvent\b/);
      expect(chatSession).not.toMatch(/\bAssistantEvent\b/);
      expect(chatSession).not.toMatch(/\bSendMessageRes\b/);
      expect(chatSession).not.toMatch(/\bStreamDoneResult\b/);
    });

    it('uses durable Goal Workflow types only where each call site actually needs them', () => {
      expect(goalWorkflow).toContain("from '@memoflow/contracts/ai'");
      expect(goalWorkflow).toMatch(/\bAIWorkflowRunView\b/);
      expect(goalWorkflow).toMatch(/\bGoalClarificationDTO\b/);
      expect(goalWorkflow).toMatch(/\bGoalPlanDraft\b/);
      expect(goalPanel).toContain("from '@memoflow/contracts/ai'");
      expect(goalPanel).toMatch(/\bAIWorkflowRunView\b/);
      expect(goalPanel).toMatch(/\bGoalClarificationDTO\b/);
      expect(workflowPersistence).toContain("from '@memoflow/contracts/ai'");
      expect(workflowPersistence).toMatch(/\bAIWorkflowRunView\b/);
      expect(workflowPersistence).not.toMatch(/import[^;]*\bGoalWorkflowDraftResultDTO\b/s);
      expect(workflowPersistence).not.toMatch(/import[^;]*\bGoalClarificationDTO\b/s);
      // Transitional legacy helpers may still own their old DTOs until their later batch.
      expect(goalDraftHelpers).toMatch(/\bGoalWorkflowDraftResultDTO\b/);
      expect(goalAutomationHelpers).toMatch(/\bGoalWorkflowDraftResultDTO\b/);
      // UI helper identifiers that end with GoalDraft are not type duals.
      expect(goalDraftHelpers).toMatch(
        /\bcreateEmptyGoalDraft\b|\bGoalDraftState\b|\bapplyGoalDraft\b/,
      );
      expect(types).toMatch(/\bcreateEmptyGoalDraft\b/);
      expect(actionBar).not.toMatch(/\bGoalWorkflowDraftResultDTO\b/);
    });
  });
}

// --- merged from create-agent-id-dual.surface.spec.ts ---
{
  /**
   * Residual 953: app-vue AI createAgentId dual retired.
   * Sole body in createAgentId.ts; goal / knowledge-note / knowledge-qa / task workflows import it.
   * Soft residual 951: AI isRecord dual retired (is-record-dual.surface.spec.ts).
   * Soft residual 954: tip focused suite numbers track Residual 954 evidence tip (268/1191).
   * Soft residual 955: AI getRecordString dual retired (get-record-string-dual.surface.spec.ts).
   * Task previously used a weaker Date.now+random body — unified onto sole crypto-preferring policy.
   * Does not flip §13.2 checkboxes.
   */
  describe('AI createAgentId dual retired (residual 953)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'createAgentId.ts'), 'utf8');
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
    const knowledgeQa = readFileSync(resolve(dir, 'useAIKnowledgeQaWorkflow.ts'), 'utf8');
    const task = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');

    it('owns sole createAgentId helper body', () => {
      expect(sole).toContain('Residual 953');
      expect(sole).toMatch(/export function createAgentId\b/);
      expect(sole).toContain('globalThis.crypto?.randomUUID');
      expect(sole).toContain('Math.random().toString(36).slice(2, 10)');
      expect(sole).toContain('`${prefix}-${randomId}`');
    });

    it('keeps createAgentId only on transitional Agent workflows, never durable goal.create/task.create', () => {
      expect(goal).not.toContain("import { createAgentId } from './createAgentId'");
      expect(goal).not.toContain("createAgentId('run')");
      expect(goal).not.toContain("createAgentId('thread')");
      // AI-VNEXT-06: task.create is a durable Mastra Workflow projection like
      // goal.create — it must not mint client-owned AgentRun ids either.
      expect(task).not.toContain("import { createAgentId } from './createAgentId'");
      expect(task).not.toContain("createAgentId('run')");
      expect(task).not.toContain("createAgentId('thread')");
      expect(task).toContain('workflowRuntime.start');
      expect(task).toContain('workflowRuntime.resume');
      expect(task).toContain('taskWorkflowRun');
      for (const [label, src] of [
        ['knowledge', knowledge],
        ['knowledgeQa', knowledgeQa],
      ] as const) {
        expect(src, label).toContain('Residual 953');
        expect(src, label).toContain("import { createAgentId } from './createAgentId'");
        expect(src, label).not.toMatch(/function createAgentId\b/);
        expect(src, label).toContain("createAgentId('run')");
        expect(src, label).toContain("createAgentId('thread')");
      }
      // Former weaker task-only dual body must not remain
      expect(task).not.toContain('Date.now().toString(36)}-${Math.random()');
    });

    it('prefixes ids and uses crypto.randomUUID when available', () => {
      const spy = vi
        .spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValue('11111111-2222-4333-8444-555555555555');
      expect(createAgentId('run')).toBe('run-11111111-2222-4333-8444-555555555555');
      expect(createAgentId('thread')).toBe('thread-11111111-2222-4333-8444-555555555555');
      spy.mockRestore();
    });
  });
}

// --- merged from get-record-string-dual.surface.spec.ts ---
{
  /**
   * Residual 955: app-vue AI getRecordString / getString dual retired.
   * Sole body in getRecordString.ts; goal (was getString) + knowledge-note import it.
   * Soft residual 953: AI createAgentId dual retired (create-agent-id-dual.surface.spec.ts).
   * Soft residual 956: tip focused suite numbers track Residual 956 evidence tip (269/1194).
   * Soft residual 957: vault FS guards dual retired (packages/repository/src/electron/vault-fs-guards-dual.surface.spec.ts).
   * Goal local getString empty-check was behaviorally equivalent to trim sole; unified.
   * Does not flip §13.2 checkboxes.
   */
  describe('AI getRecordString dual retired (residual 955)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'getRecordString.ts'), 'utf8');
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');

    it('owns sole getRecordString helper body', () => {
      expect(sole).toContain('Residual 955');
      expect(sole).toMatch(/export function getRecordString\b/);
      expect(sole).toContain("typeof value === 'string' ? value.trim() : ''");
    });

    it('keeps getRecordString on the transitional knowledge path, not durable goal.create', () => {
      expect(goal).not.toContain("import { getRecordString } from './getRecordString'");
      expect(goal).not.toMatch(/function getString\b/);
      expect(goal).not.toMatch(/function getRecordString\b/);

      expect(knowledge).toContain('Residual 955');
      expect(knowledge).toContain("import { getRecordString } from './getRecordString'");
      expect(knowledge).not.toMatch(/function getRecordString\b/);
      expect(knowledge).toContain('getRecordString(data,');
      expect(knowledge).toContain('getRecordString(noteData,');
      // getArtifactString may remain as thin local composer over sole
      expect(knowledge).toMatch(/function getArtifactString\b/);
      expect(knowledge).toContain('getRecordString(artifact.data, key)');
    });

    it('trims strings and rejects non-strings / whitespace-only to empty', () => {
      expect(getRecordString({ a: '  hi  ' }, 'a')).toBe('hi');
      expect(getRecordString({ a: '   ' }, 'a')).toBe('');
      expect(getRecordString({ a: 1 }, 'a')).toBe('');
      expect(getRecordString({}, 'missing')).toBe('');
    });
  });
}

// --- merged from is-record-dual.surface.spec.ts ---
{
  /**
   * Residual 951: app-vue AI isRecord dual retired.
   * Sole body in isRecord.ts; useAIGoalWorkflow + useAIKnowledgeNoteWorkflow import it.
   * Soft residual 949: maskEmail dual retired
   *   (packages/authentication/src/server/shared/mask-email-dual.surface.spec.ts).
   * Soft residual 947: desktop http-envelope isRecord is a keep-boundary
   *   (arrays allowed; apps/desktop/src/main/utils/http-envelope-guards.ts).
   * Soft residual 1089: isRecord cross-package keep-boundary surface (no force-merge).
   * Soft residual 1162: contracts result/core private isRecord keep-boundary remains separate.
   * Soft residual 952: tip focused suite numbers track Residual 952 evidence tip (267/1188).
   * Soft residual 953: AI createAgentId dual retired (create-agent-id-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('AI isRecord dual retired (residual 951)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'isRecord.ts'), 'utf8');
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');

    it('owns sole plain-object isRecord helper body', () => {
      expect(sole).toContain('Residual 951');
      expect(sole).toMatch(/export function isRecord\b/);
      expect(sole).toContain(
        "Boolean(value) && typeof value === 'object' && !Array.isArray(value)",
      );
      expect(sole).toContain(
        'Residual 1089 keep-boundary vs desktop http-envelope-guards isRecord',
      );
    });

    it('keeps isRecord on the transitional knowledge path, not typed durable goal.create', () => {
      expect(goal).not.toContain("import { isRecord } from './isRecord'");
      expect(goal).not.toMatch(/function isRecord\b/);

      expect(knowledge).toContain('Residual 951');
      expect(knowledge).toContain("import { isRecord } from './isRecord'");
      expect(knowledge).not.toMatch(/function isRecord\b/);
      expect(knowledge).toContain('isRecord(recovery)');
      expect(knowledge).toContain('isRecord(action.data)');
    });

    it('accepts plain objects and rejects arrays/null/primitives', () => {
      expect(isRecord({ a: 1 })).toBe(true);
      expect(isRecord([])).toBe(false);
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord('x')).toBe(false);
      expect(isRecord(0)).toBe(false);
    });
  });
}
