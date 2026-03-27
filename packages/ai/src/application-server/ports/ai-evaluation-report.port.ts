export type AIEvaluationReportMode = 'deterministic' | 'live';

export interface AIEvaluationCheckRecord {
  name: string;
  passed: boolean;
  detail: string;
}

export interface AIEvaluationResultRecord {
  id: string;
  type: string;
  description: string;
  passed: boolean;
  score: number;
  checks: AIEvaluationCheckRecord[];
  metadata: Record<string, unknown>;
}

export interface AIEvaluationReportRecord {
  generatedAt: string;
  mode: AIEvaluationReportMode;
  provider?: string;
  model?: string;
  baseUrl?: string;
  casesPath: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  byType: Record<string, number>;
  failedCaseIds: string[];
  gatePassed: boolean;
  gateFailures: string[];
  baselinePath?: string;
  archivePath?: string;
  results: AIEvaluationResultRecord[];
}

export interface AIEvaluationHistoryRecord {
  fileName: string;
  generatedAt: string;
  mode: AIEvaluationReportMode;
  provider?: string;
  model?: string;
  passRate: number;
  totalCases: number;
  failedCases: number;
  gatePassed: boolean;
  archivePath: string;
}

export interface GetAIEvaluationOverviewInput {
  historyLimit?: number;
}

export interface AIEvaluationOverview {
  latest: {
    deterministic?: AIEvaluationReportRecord;
    live?: AIEvaluationReportRecord;
  };
  history: {
    deterministic: AIEvaluationHistoryRecord[];
    live: AIEvaluationHistoryRecord[];
  };
}

export interface IAIEvaluationReportPort {
  getOverview(input: GetAIEvaluationOverviewInput): Promise<AIEvaluationOverview>;
}
