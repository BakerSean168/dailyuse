import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 225: goal.create usage/key-result normalization is single-track.
 * No camel/snake dual-get shims for usage tokens or targetValue.
 */
describe('AI service goal.create usage single-track surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const goalCreate = readFileSync(
    resolve(
      repoRoot,
      'apps/ai-service/src/ai_service/agent_runtime/graphs/goal_create.py',
    ),
    'utf8',
  );

  it('normalizes usage via AgentUsage only (no camel/snake dual-get)', () => {
    expect(goalCreate).toContain('AgentUsage');
    expect(goalCreate).toContain('AgentUsage.model_validate(usage)');
    expect(goalCreate).toContain('by_alias=True');
    expect(goalCreate).not.toContain(
      'usage.get("promptTokens", usage.get("prompt_tokens"))',
    );
    expect(goalCreate).not.toContain(
      'usage.get("completionTokens", usage.get("completion_tokens"))',
    );
    expect(goalCreate).not.toContain(
      'usage.get("totalTokens", usage.get("total_tokens"))',
    );
  });

  it('reads planner key-result targetValue only (no target_value dual-get)', () => {
    expect(goalCreate).toContain('data.get("targetValue")');
    expect(goalCreate).not.toContain(
      'data.get("targetValue", data.get("target_value"))',
    );
  });
});
