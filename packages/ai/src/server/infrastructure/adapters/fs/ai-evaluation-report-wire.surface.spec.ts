import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AI evaluation report authority surface', () => {
  const adapter = readFileSync(resolve(__dirname, 'ai-evaluation-report-file.adapter.ts'), 'utf8');

  it('uses only the Mastra-native report directory as runtime authority', () => {
    expect(adapter).toContain("'reports', 'apps', 'ai', 'evals'");
    expect(adapter).not.toContain("'reports', 'apps', 'ai-service', 'evals'");
    expect(adapter).not.toContain('legacyReportsRoot');
    expect(adapter).not.toContain('legacy-python');
  });

  it('accepts only the canonical evaluation report wire format', () => {
    expect(adapter).toContain('AIEvaluationReportSchema.parse(raw)');
    expect(adapter).not.toContain('normalizeLegacyPythonReport');
    expect(adapter).not.toContain('generated_at');
  });
});
