import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 220: on-disk AI evaluation reports use Python snake_case wire only.
 * Adapter maps to contracts camelCase without dual-track camelCase file keys.
 */
describe('AI evaluation report on-disk snake_case surface', () => {
  const adapter = readFileSync(resolve(__dirname, 'ai-evaluation-report-file.adapter.ts'), 'utf8');
  const testFile = readFileSync(
    resolve(__dirname, '__tests__/ai-evaluation-report-file.adapter.test.ts'),
    'utf8',
  );

  it('normalizeReportShape reads snake_case on-disk keys only', () => {
    expect(adapter).toContain('generatedAt: raw.generated_at');
    expect(adapter).toContain('casesPath: raw.cases_path');
    expect(adapter).toContain('passRate: raw.pass_rate');
    expect(adapter).toContain('gatePassed: raw.gate_passed');
    expect(adapter).not.toContain('raw.generatedAt ?? raw.generated_at');
    expect(adapter).not.toContain('raw.casesPath ?? raw.cases_path');
    expect(adapter).not.toContain('raw.passRate ?? raw.pass_rate');
    expect(adapter).not.toContain('raw.gatePassed ?? raw.gate_passed');
    expect(adapter).not.toContain('raw.totalCases ?? raw.total_cases');
  });

  it('adapter fixtures write snake_case on-disk report shapes', () => {
    expect(testFile).toContain("generated_at: '2026-03-27T12:00:00.000Z'");
    expect(testFile).toContain('cases_path:');
    expect(testFile).toContain('pass_rate:');
    expect(testFile).toContain('gate_passed:');
    expect(testFile).not.toContain("generatedAt: '2026-03-27T12:00:00.000Z'");
    expect(testFile).not.toContain('casesPath:');
    expect(testFile).not.toContain('passRate:');
    expect(testFile).not.toContain('gatePassed:');
  });
});
