import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { AIEvaluationReportFileAdapter } from '../ai-evaluation-report-file.adapter';

const tempDirs: string[] = [];

async function createTempReportsRoot(): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'dailyuse-ai-evals-'));
  tempDirs.push(tempDir);
  await mkdir(path.join(tempDir, 'history'), { recursive: true });
  await mkdir(path.join(tempDir, 'live-history'), { recursive: true });
  return tempDir;
}

function buildReport(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: '2026-03-27T12:00:00.000Z',
    mode: 'deterministic',
    casesPath: 'evals/regression_cases.json',
    totalCases: 4,
    passedCases: 4,
    failedCases: 0,
    passRate: 1,
    byType: { chat_sanity: 1, goal_planning: 1, knowledge_grounding: 2 },
    failedCaseIds: [],
    gatePassed: true,
    gateFailures: [],
    archivePath: 'reports/apps/ai-service/evals/history/2026-03-27T12-00-00.000Z.json',
    results: [],
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('AIEvaluationReportFileAdapter', () => {
  it('returns latest reports and sorted history entries', async () => {
    const reportsRoot = await createTempReportsRoot();
    await writeFile(
      path.join(reportsRoot, 'latest.json'),
      JSON.stringify(buildReport()),
      'utf8',
    );
    await writeFile(
      path.join(reportsRoot, 'live-latest.json'),
      JSON.stringify(
        buildReport({
          mode: 'live',
          provider: 'openai',
          model: 'gpt-5.4',
          archivePath: 'reports/apps/ai-service/evals/live-history/2026-03-27T12-05-00.000Z.json',
        }),
      ),
      'utf8',
    );
    await writeFile(
      path.join(reportsRoot, 'history', '2026-03-27T11-00-00.000Z.json'),
      JSON.stringify(
        buildReport({
          generatedAt: '2026-03-27T11:00:00.000Z',
          archivePath: 'reports/apps/ai-service/evals/history/2026-03-27T11-00-00.000Z.json',
        }),
      ),
      'utf8',
    );
    await writeFile(
      path.join(reportsRoot, 'history', '2026-03-26T11-00-00.000Z.json'),
      JSON.stringify(
        buildReport({
          generatedAt: '2026-03-26T11:00:00.000Z',
          archivePath: 'reports/apps/ai-service/evals/history/2026-03-26T11-00-00.000Z.json',
        }),
      ),
      'utf8',
    );

    const adapter = new AIEvaluationReportFileAdapter({ reportsRoot });
    const overview = await adapter.getOverview({ historyLimit: 1 });

    expect(overview.latest.deterministic?.mode).toBe('deterministic');
    expect(overview.latest.live?.model).toBe('gpt-5.4');
    expect(overview.history.deterministic).toHaveLength(1);
    expect(overview.history.deterministic[0]?.fileName).toBe('2026-03-27T11-00-00.000Z.json');
    expect(overview.history.live).toHaveLength(0);
  });

  it('returns empty history and missing latest reports when files are absent', async () => {
    const reportsRoot = await createTempReportsRoot();
    const adapter = new AIEvaluationReportFileAdapter({ reportsRoot });

    const overview = await adapter.getOverview();

    expect(overview.latest.deterministic).toBeUndefined();
    expect(overview.latest.live).toBeUndefined();
    expect(overview.history.deterministic).toEqual([]);
    expect(overview.history.live).toEqual([]);
  });
});
