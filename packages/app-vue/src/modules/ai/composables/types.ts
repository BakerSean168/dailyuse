import type {
  AddKeyResultReq,
  CreateGoalReq,
} from '@dailyuse/contracts/goal';
import type { Ref } from 'vue';
import type {
  AgentAction,
  AgentRun,
  AgentRunResult,
  ConversationListRes,
  MessageListRes,
  SendMessageRes,
  GoalAutomationReminderPreview,
  GoalAutomationTaskTemplatePreview,
  GoalClarificationDTO,
  GoalWorkflowDraftResultDTO,
  GenerateGoalsRes,
  KnowledgeNoteIndexStatus,
  QueryKnowledgeRes,
} from '@dailyuse/contracts/ai';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { IAIService } from '../../../di/types';

/** Options for useAIGoalWorkflow composable. */
export interface UseAIGoalWorkflowOptions {
  service: Pick<AIChatService, 'generateGoal' | 'startAgentRun' | 'resumeAgentRun'>;
  selectedModel: Ref<ChatModelOption | null>;
  chatConversationId: Ref<string>;
  chatLoading: Ref<boolean>;
  chatTimeline: Ref<ChatItem[]>;
  conversationTitle: Ref<string>;
  hasWorkflowUserMessages: Ref<boolean>;
  buildConversationTranscript: () => string;
  scrollMessagesToBottom: () => void;
  maybeRenameCurrentConversation: (name: string) => Promise<void>;
  createGoal: (req: import('@dailyuse/contracts/goal').CreateGoalReq) => Promise<{ id: string } | null>;
  addKeyResult: (goalId: string, req: import('@dailyuse/contracts/goal').AddKeyResultReq) => Promise<unknown>;
}

/** Options for useAIKnowledgeQaWorkflow composable. */
export interface UseAIKnowledgeQaWorkflowOptions {
  service: Pick<AIChatService, 'startAgentRun'>;
  selectedModel: Ref<ChatModelOption | null>;
  chatConversationId: Ref<string>;
  chatLoading: Ref<boolean>;
  chatTimeline: Ref<ChatItem[]>;
  hasWorkflowUserMessages: Ref<boolean>;
  scrollMessagesToBottom: () => void;
  requestOpenKnowledgeNote: (id: string) => Promise<unknown>;
}

export type WorkflowMode = 'chat' | 'goal-create' | 'knowledge-qa' | 'knowledge-generate';

export type MessageStatus = 'generating' | 'success' | 'error' | 'aborted';

export type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  errorMessage?: string;
};

export type ConversationSummary = ConversationListRes['data'][number];

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

export type StreamDoneResult = SendMessageRes;

export type ConversationMessageSummary = MessageListRes['data'][number];

export type AIChatService = Pick<
  IAIService,
  | 'listConversations'
  | 'listMessages'
  | 'createConversation'
  | 'updateConversation'
  | 'deleteConversation'
  | 'streamMessage'
  | 'generateGoal'
  | 'queryKnowledge'
  | 'listAgentRuns'
  | 'startAgentRun'
  | 'resumeAgentRun'
  | 'getAgentRun'
  | 'getAgentEvents'
  | 'createKnowledgeNote'
>;

export type GoalDraft = GoalWorkflowDraftResultDTO;
export type GoalClarification = GoalClarificationDTO;
export type GoalAutomationResult = Extract<GenerateGoalsRes, { state: 'confirm' | 'result' }>;
export type GoalExecutedAction = Extract<GenerateGoalsRes, { state: 'result' }>['executedActions'][number];
export type GoalAgentRunResult = AgentRunResult;
export type AgentRunSummary = AgentRun;
export type AIWorkspaceRecentGoal = {
  id: string;
  title: string;
  status: string;
  updatedAt: number;
  targetDate: number | null;
  progress: number | null;
};
export type AIWorkspaceRecentKnowledgeNote = {
  id: string;
  title: string;
  path: string;
  updatedAt: number;
};
export type GoalAgentAction = AgentAction;
export type KnowledgeQaAgentRunResult = AgentRunResult;
export type KnowledgeNoteAgentRunResult = AgentRunResult;
export type KnowledgeRelatedNote = {
  resourceId: string;
  resourcePath: string;
  title?: string;
  excerpt?: string;
  score?: number;
};
export type KnowledgeAnswer = QueryKnowledgeRes & {
  question: string;
  evidenceStatus: 'grounded' | 'insufficient';
  relatedNotes?: KnowledgeRelatedNote[];
};
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
  indexStatus?: KnowledgeNoteIndexStatus;
  note?: {
    id?: string;
    name?: string;
    content?: string | null;
  };
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

export type EditableGoalTaskTemplate = {
  name: string;
  description: string;
  importance: GoalAutomationTaskTemplatePreview['importance'];
  cadence: GoalAutomationTaskTemplatePreview['cadence'];
  timeOfDay: string;
};

export type EditableGoalReminder = {
  title: string;
  description: string;
  importance: GoalAutomationReminderPreview['importance'];
  cadence: GoalAutomationReminderPreview['cadence'];
  timeOfDay: string;
};

export type PersistedWorkflowEntry = {
  /** Canonical WorkflowMode; unknown/legacy values are normalized on read. */
  mode: string;
  goalWorkflowStage?: GoalWorkflowStage;
  goalDraft: GoalDraft | null;
  goalClarification: GoalClarification | null;
  goalAutomationResult: GoalAutomationResult | null;
  goalAgentRun?: GoalAgentRunResult | null;
  knowledgeQaAgentRun?: KnowledgeQaAgentRunResult | null;
  noteAgentRun?: KnowledgeNoteAgentRunResult | null;
  knowledgeAnswer?: KnowledgeAnswer | null;
  clarificationAnswers: string[];
  editableGoal: EditableGoal;
  editableKeyResults: EditableKeyResult[];
  editableTaskTemplates?: EditableGoalTaskTemplate[];
  editableReminders?: EditableGoalReminder[];
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

export function createEmptyGoalTaskTemplateDraft(): EditableGoalTaskTemplate {
  return {
    name: '',
    description: '',
    importance: 'Moderate' as EditableGoalTaskTemplate['importance'],
    cadence: 'weekly',
    timeOfDay: '09:00',
  };
}

export function createEmptyGoalReminderDraft(): EditableGoalReminder {
  return {
    title: '',
    description: '',
    importance: 'Moderate' as EditableGoalReminder['importance'],
    cadence: 'weekly',
    timeOfDay: '09:00',
  };
}

export function getToolLocaleKey(mode: WorkflowMode): string {
  return {
    chat: 'chat',
    'goal-create': 'goalCreate',
    'knowledge-qa': 'knowledgeQa',
    'knowledge-generate': 'knowledgeGenerate',
  }[mode];
}

export function normalizeWorkflowMode(mode: string | null | undefined): WorkflowMode {
  // One-way map for previously persisted short mode ids; no dual-track type surface.
  if (mode === 'goal') return 'goal-create';
  if (mode === 'knowledge-note') return 'knowledge-generate';
  if (mode === 'goal-create' || mode === 'knowledge-qa' || mode === 'knowledge-generate') {
    return mode;
  }
  return 'chat';
}
