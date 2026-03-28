export type SavedDraftSummary = {
  id: string;
  name?: string;
  path?: string;
};

export type GoalAutomationResult = {
  summary: string;
  requiresConfirmation: boolean;
  plan: {
    goal: {
      title: string;
      description: string;
    };
    keyResults?: Array<{
      title: string;
      description?: string;
      targetValue: number;
      unit: string;
    }>;
    taskTemplates?: Array<{
      name: string;
      description?: string;
      importance: string;
      cadence: 'daily' | 'weekly' | 'once';
    }>;
  };
  actions: Array<{
    tool: 'create_goal' | 'create_key_result' | 'create_task_template' | 'search_notes' | 'fetch_stats';
    index?: number;
    rationale?: string;
  }>;
  executedActions?: Array<{
    tool: 'create_goal' | 'create_key_result' | 'create_task_template' | 'search_notes' | 'fetch_stats';
    status: 'executed' | 'skipped' | 'failed';
    entityId?: string;
    message: string;
  }>;
  processingTimeMs: number;
};

export type KnowledgeCitation = {
  resourcePath: string;
  title?: string;
  chunkIndex: number;
  excerpt: string;
};

export type KnowledgeQueryResult = {
  answer: string;
  citations: KnowledgeCitation[];
  matchedResourceCount: number;
  processingTimeMs: number;
};

export type KnowledgeExpansionResult = {
  expandedContent: string;
  citations: KnowledgeCitation[];
  matchedResourceCount: number;
  processingTimeMs: number;
};

export type EvaluationCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type EvaluationResult = {
  id: string;
  type: string;
  description: string;
  passed: boolean;
  score: number;
  checks: EvaluationCheck[];
  metadata: Record<string, unknown>;
};

export type EvaluationReport = {
  generatedAt: string;
  mode: 'deterministic' | 'live';
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
  results: EvaluationResult[];
};

export type EvaluationHistoryEntry = {
  fileName: string;
  generatedAt: string;
  mode: 'deterministic' | 'live';
  provider?: string;
  model?: string;
  passRate: number;
  totalCases: number;
  failedCases: number;
  gatePassed: boolean;
  archivePath: string;
};

export type EvaluationOverview = {
  latest: {
    deterministic?: EvaluationReport;
    live?: EvaluationReport;
  };
  history: {
    deterministic: EvaluationHistoryEntry[];
    live: EvaluationHistoryEntry[];
  };
};
