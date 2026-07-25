import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 226: evals/runner is the evaluation entrypoint only.
 * Models, loaders, and reporters import from their own modules — no
 * backward-compat re-export barrel.
 */
describe('AI service eval runner single-track surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const runner = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/evals/runner.py'),
    'utf8',
  );
  const testEvalRunner = readFileSync(
    resolve(repoRoot, 'apps/ai-service/tests/test_eval_runner.py'),
    'utf8',
  );
  const testGoalWorkflow = readFileSync(
    resolve(repoRoot, 'apps/ai-service/tests/test_goal_workflow_harness.py'),
    'utf8',
  );
  const testAgentHarness = readFileSync(
    resolve(repoRoot, 'apps/ai-service/tests/test_agent_runtime_eval_harness.py'),
    'utf8',
  );

  it('does not re-export models/loaders/reporters for backward compatibility', () => {
    expect(runner).not.toContain('Re-export for backward compatibility');
    expect(runner).toContain('"evaluate_cases"');
    expect(runner).toContain('"evaluate_cases_with_mode"');
    expect(runner).toContain('"build_goal_workflow_eval_result"');
    expect(runner).not.toContain('"DEFAULT_PROVIDER"');
    expect(runner).not.toContain('"load_eval_cases"');
    expect(runner).not.toContain('"build_report"');
    expect(runner).not.toContain('"EvalPolicy"');
    expect(runner).not.toContain('"filter_eval_cases"');
    expect(runner).not.toContain('"write_report"');
    expect(runner).not.toContain('"archive_report"');
    expect(runner).not.toContain('from ai_service.evals.eval_case_loader import');
  });

  it('tests import models/loaders/reporters from canonical modules', () => {
    expect(testEvalRunner).toContain('from ai_service.evals.eval_models import');
    expect(testEvalRunner).toContain('from ai_service.evals.eval_case_loader import');
    expect(testEvalRunner).toContain('from ai_service.evals.eval_reporter import');
    expect(testEvalRunner).toContain('from ai_service.evals.runner import');

    const runnerImportBlock =
      testEvalRunner.match(
        /from ai_service\.evals\.runner import \(([\s\S]*?)\)/,
      )?.[1] ?? '';
    expect(runnerImportBlock).toContain('evaluate_cases');
    expect(runnerImportBlock).not.toContain('DEFAULT_PROVIDER');
    expect(runnerImportBlock).not.toContain('load_eval_cases');
    expect(runnerImportBlock).not.toContain('build_report');
    expect(runnerImportBlock).not.toContain('EvalPolicy');

    expect(testGoalWorkflow).toContain(
      'from ai_service.evals.eval_models import DEFAULT_PROVIDER',
    );
    expect(testGoalWorkflow).not.toContain(
      'from ai_service.evals.runner import DEFAULT_PROVIDER',
    );
    expect(testAgentHarness).toContain(
      'from ai_service.evals.eval_case_loader import load_eval_cases',
    );
    expect(testAgentHarness).toContain(
      'from ai_service.evals.eval_reporter import build_report',
    );
    expect(testAgentHarness).toContain(
      'from ai_service.evals.runner import evaluate_cases',
    );
    expect(testAgentHarness).not.toContain(
      'from ai_service.evals.runner import build_report',
    );
    expect(testAgentHarness).not.toContain(
      'from ai_service.evals.runner import load_eval_cases',
    );
  });
});
