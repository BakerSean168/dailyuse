import type {
  AddKeyResultReq,
  CreateGoalReq,
} from '@dailyuse/contracts/goal';
import type { Ref } from 'vue';
import type {
  GoalClarificationDTO,
  GoalWorkflowDraftResultDTO,
  GenerateGoalsRes,
} from '@dailyuse/contracts/ai';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { IAIService } from '../../../di/types';

/** Options for useAIGoalWorkflow composable. */
export interface UseAIGoalWorkflowOptions {
  service: Pick<AIChatService, 'generateGoal'>;
  selectedModel: Ref<ChatModelOption | null>;
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

export type WorkflowMode = 'chat' | 'goal' | 'knowledge-note';

export type MessageStatus = 'generating' | 'success' | 'error' | 'aborted';

export type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  errorMessage?: string;
};

type ConversationListResponse = Awaited<ReturnType<IAIService['listConversations']>>;
type MessageListResponse = Awaited<ReturnType<IAIService['listMessages']>>;

export type ConversationSummary = ConversationListResponse['data'][number];

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

export type StreamDoneResult = Awaited<ReturnType<IAIService['sendMessage']>>;

export type ConversationMessageSummary = MessageListResponse['data'][number];

export type AIChatService = Pick<
  IAIService,
  | 'listConversations'
  | 'listMessages'
  | 'createConversation'
  | 'updateConversation'
  | 'deleteConversation'
  | 'streamMessage'
  | 'generateGoal'
  | 'createKnowledgeNote'
>;

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
  resource?: { id?: string; name?: string; content?: string | null };
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
