import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 221: agent checkpoint factories are settings-based only.
 * Legacy dual-track build_file_backed_* compatibility factories are removed.
 */
describe('AI service checkpoint factory single-track surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const factory = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/agent_runtime/checkpoint_factory.py'),
    'utf8',
  );
  const checkpoints = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/agent_runtime/checkpoints.py'),
    'utf8',
  );
  const packageInit = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/agent_runtime/__init__.py'),
    'utf8',
  );

  it('exports only settings-based build_checkpointer / build_run_history_store', () => {
    expect(factory).toContain('def build_checkpointer(');
    expect(factory).toContain('def build_run_history_store(');
    expect(factory).not.toContain('def build_file_backed_saver(');
    expect(factory).not.toContain('def build_file_backed_run_history_store(');
    expect(factory).not.toContain('kept for compatibility');
    expect(checkpoints).not.toContain('def build_file_backed_saver(');
    expect(checkpoints).not.toContain('def build_file_backed_run_history_store(');
    expect(packageInit).toContain('build_checkpointer');
    expect(packageInit).toContain('build_run_history_store');
    expect(packageInit).not.toContain('build_file_backed_saver');
    expect(packageInit).not.toContain('build_file_backed_run_history_store');
  });
});
