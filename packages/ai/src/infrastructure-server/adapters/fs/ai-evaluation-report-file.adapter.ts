import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AIEvaluationReportSchema,
  type GetAIEvaluationOverviewRes,
} from '@dailyuse/contracts/ai';

import type {
  AIEvaluationHistoryRecord,
  AIEvaluationReportMode,
  AIEvaluationReportRecord,
  GetAIEvaluationOverviewInput,
  IAIEvaluationReportPort,
} from '../../../application-server/ports';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_HISTORY_LIMIT = 5;

function resolveWorkspaceRoot(startDir: string): string {
  let current = startDir;

  while (true) {
    if (existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return process.cwd();
    }

    current = parent;
  }
}

function resolveDefaultReportsRoot(): string {
  return path.join(resolveWorkspaceRoot(__dirname), 'reports', 'apps', 'ai-service', 'evals');
}

function buildHistoryEntry(
  fileName: string,
  report: AIEvaluationReportRecord,
): AIEvaluationHistoryRecord {
  return {
    fileName,
    generatedAt: report.generatedAt,
    mode: report.mode,
    provider: report.provider,
    model: report.model,
    passRate: report.passRate,
    totalCases: report.totalCases,
    failedCases: report.failedCases,
    gatePassed: report.gatePassed,
    archivePath: report.archivePath ?? fileName,
  };
}

function normalizeReportShape(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    generatedAt: raw.generatedAt ?? raw.generated_at,
    mode: raw.mode,
    provider: raw.provider ?? undefined,
    model: raw.model ?? undefined,
    baseUrl: raw.baseUrl ?? raw.base_url ?? undefined,
    casesPath: raw.casesPath ?? raw.cases_path,
    totalCases: raw.totalCases ?? raw.total_cases,
    passedCases: raw.passedCases ?? raw.passed_cases,
    failedCases: raw.failedCases ?? raw.failed_cases,
    passRate: raw.passRate ?? raw.pass_rate,
    byType: raw.byType ?? raw.by_type,
    failedCaseIds: raw.failedCaseIds ?? raw.failed_case_ids,
    gatePassed: raw.gatePassed ?? raw.gate_passed,
    gateFailures: raw.gateFailures ?? raw.gate_failures,
    baselinePath: raw.baselinePath ?? raw.baseline_path ?? undefined,
    archivePath: raw.archivePath ?? raw.archive_path ?? undefined,
    results: Array.isArray(raw.results)
      ? raw.results.map((result) => {
          if (!result || typeof result !== 'object') {
            return result;
          }
          return {
            id: (result as Record<string, unknown>).id,
            type: (result as Record<string, unknown>).type,
            description: (result as Record<string, unknown>).description,
            passed: (result as Record<string, unknown>).passed,
            score: (result as Record<string, unknown>).score,
            checks: (result as Record<string, unknown>).checks,
            metadata: (result as Record<string, unknown>).metadata,
          };
        })
      : raw.results,
  };
}

export interface AIEvaluationReportFileAdapterOptions {
  reportsRoot?: string;
  defaultHistoryLimit?: number;
}

export class AIEvaluationReportFileAdapter implements IAIEvaluationReportPort {
  private readonly reportsRoot: string;
  private readonly defaultHistoryLimit: number;

  constructor(options: AIEvaluationReportFileAdapterOptions = {}) {
    this.reportsRoot = options.reportsRoot ?? resolveDefaultReportsRoot();
    this.defaultHistoryLimit = options.defaultHistoryLimit ?? DEFAULT_HISTORY_LIMIT;
  }

  async getOverview(
    input: GetAIEvaluationOverviewInput = {},
  ): Promise<GetAIEvaluationOverviewRes> {
    const historyLimit = input.historyLimit ?? this.defaultHistoryLimit;

    const [deterministicLatest, liveLatest, deterministicHistory, liveHistory] = await Promise.all([
      this.readOptionalReport(path.join(this.reportsRoot, 'latest.json')),
      this.readOptionalReport(path.join(this.reportsRoot, 'live-latest.json')),
      this.readHistory('history', 'deterministic', historyLimit),
      this.readHistory('live-history', 'live', historyLimit),
    ]);

    return {
      latest: {
        deterministic: deterministicLatest,
        live: liveLatest,
      },
      history: {
        deterministic: deterministicHistory,
        live: liveHistory,
      },
    };
  }

  private async readOptionalReport(filePath: string): Promise<AIEvaluationReportRecord | undefined> {
    try {
      return await this.readReport(filePath);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return undefined;
      }

      throw error;
    }
  }

  private async readHistory(
    directoryName: string,
    mode: AIEvaluationReportMode,
    limit: number,
  ): Promise<AIEvaluationHistoryRecord[]> {
    const directoryPath = path.join(this.reportsRoot, directoryName);

    let fileNames: string[] = [];
    try {
      fileNames = await readdir(directoryPath);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return [];
      }

      throw error;
    }

    const reports = await Promise.all(
      fileNames
        .filter((fileName) => fileName.endsWith('.json'))
        .sort((left, right) => right.localeCompare(left))
        .slice(0, limit)
        .map(async (fileName) => {
          try {
            const report = await this.readReport(path.join(directoryPath, fileName));
            if (report.mode !== mode) {
              return null;
            }
            return buildHistoryEntry(fileName, report);
          } catch {
            return null;
          }
        }),
    );

    return reports.filter((entry): entry is AIEvaluationHistoryRecord => entry !== null);
  }

  private async readReport(filePath: string): Promise<AIEvaluationReportRecord> {
    const raw = JSON.parse(await readFile(filePath, 'utf8'));
    return AIEvaluationReportSchema.parse(normalizeReportShape(raw));
  }
}
