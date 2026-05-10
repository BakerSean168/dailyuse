import type {
  AddKeyResultReq,
  CreateGoalReq,
} from '@dailyuse/contracts/goal';
import type {
  GoalClarificationDTO,
  GoalWorkflowDraftResultDTO,
  GenerateGoalsRes,
} from '@dailyuse/contracts/ai';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';

export type WorkflowMode = 'chat' | 'goal' | 'knowledge-note';

export type MessageStatus = 'generating' | 'success' | 'error' | 'aborted';

export type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  errorMessage?: string;
};

export type ConversationSummary = {
  id: string;
  name?: string;
  title?: string;
};

export type ProviderListItem = {
  id: string;
  name?: string;
  defaultModel?: string | null;
  availableModels?: Array<{
    id: string;
    name?: string;
  }>;
  isDefault?: boolean;
};

export type ChatModelOption = {
  key: string;
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
};

export type StreamDoneResult = {
  userMessage?: { id: string; content: string };
  assistantMessage?: { id: string; content: string };
};

export type ConversationMessageSummary = {
  id?: string;
  role?: string;
  content?: string;
};

export interface AIChatService {
  listConversations(params?: { page?: number; pageSize?: number }): Promise<{
    data?: ConversationSummary[];
  }>;
  listMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<{ data?: ConversationMessageSummary[] }>;
  createConversation(request: { name: string }): Promise<{ id: string }>;
  updateConversation(id: string, request: { name: string }): Promise<unknown>;
  deleteConversation(id: string): Promise<void>;
  streamMessage(
    request: {
      conversationId: string;
      content: string;
      providerId: string;
      model: string;
    },
    handlers: {
      onChunk?: (chunk: { role: 'assistant'; content: string }) => void;
      onDone?: (result: unknown) => void;
    },
    signal?: AbortSignal,
  ): Promise<void>;
  generateGoal(request: unknown): Promise<GenerateGoalsRes>;
  createKnowledgeNote(request: unknown): Promise<NoteSummary>;
}

export type GoalDraft = GoalWorkflowDraftResultDTO;
export type GoalClarification = GoalClarificationDTO;
export type GoalAutomationResult = Extract<GenerateGoalsRes, { state: 'confirm' | 'result' }>;
export type GoalExecutedAction = Extract<GenerateGoalsRes, { state: 'result' }>['executedActions'][number];
export type GoalWorkflowStage =
  | 'collect'
  | 'clarification'
  | 'draft'
  | 'plan'
  | 'confirm'
  | 'execute'
  | 'result';

export type NoteSummary = {
  resolvedPath: string;
  resource?: { id?: string; name?: string; content?: string };
};

export type EditableGoal = {
  name: string;
  description: string;
  category: string;
  importance: CreateGoalReq['importance'];
  motivation: string;
  feasibilityAnalysis: string;
  tags: string[];
  startDate: number | null;
  targetDate: number | null;
};

export type EditableKeyResult = {
  title: string;
  description: string;
  valueType: AddKeyResultReq['valueType'];
  calculationMethod: AddKeyResultReq['calculationMethod'];
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  weight: number;
};

export type PersistedWorkflowEntry = {
  mode: WorkflowMode;
  goalWorkflowStage?: GoalWorkflowStage;
  goalDraft: GoalDraft | null;
  goalClarification: GoalClarification | null;
  goalAutomationResult: GoalAutomationResult | null;
  clarificationAnswers: string[];
  editableGoal: EditableGoal;
  editableKeyResults: EditableKeyResult[];
  noteSummary: NoteSummary | null;
  showGoalDraftEditor: boolean;
};

export type PersistedConversationModelMap = Record<string, string>;

export function createEmptyGoalDraft(): EditableGoal {
  return {
    name: '',
    description: '',
    category: '',
    importance: 'Moderate' as typeof ImportanceLevel.Moderate,
    motivation: '',
    feasibilityAnalysis: '',
    tags: [],
    startDate: null,
    targetDate: null,
  };
}

export function getToolLocaleKey(mode: WorkflowMode): string {
  if (mode === 'knowledge-note') {
    return 'knowledgeNote';
  }
  return mode;
}
