import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 222: GoalPlanningService is an orchestration class only — no dual-track
 * re-export barrel for parsers/tools "backward compatibility".
 * Strategies/tools/parsers stay importable from their own modules.
 */
describe('AI service goal planning service surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const service = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/services/goal_planning_service.py'),
    'utf8',
  );
  const strategies = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/services/goal_planning_strategies.py'),
    'utf8',
  );

  it('imports only symbols used by GoalPlanningService', () => {
    expect(service).toContain('parse_clarification_payload');
    expect(service).toContain('parse_goal_payload');
    expect(service).toContain('execute_automation_strategy');
    expect(service).toContain('build_goal_system_prompt');
    expect(service).not.toContain('Re-export helpers for backward compatibility');
    expect(service).not.toContain('strip_code_fence');
    expect(service).not.toContain('parse_goal_automation_payload');
    expect(service).not.toContain('parse_goal_automation_tool_arguments');
    expect(service).not.toContain('build_goal_automation_fetch_stats_tool');
    expect(service).not.toContain('build_goal_automation_search_notes_tool');
    expect(service).not.toContain('build_goal_automation_submission_tool');
    expect(service).not.toContain('noqa: F401');
  });

  it('strategies import parsers/tools directly (not via service re-export)', () => {
    expect(strategies).toContain('from ai_service.services.goal_planning_parsers import');
    expect(strategies).toContain('from ai_service.services.goal_planning_tools import');
    expect(strategies).not.toContain('from ai_service.services.goal_planning_service import');
  });
});
