import type { TaskGoalBindingTriggerValue } from '@memoflow/contracts/task';

export type UIPriority = 'high' | 'normal' | 'low' | 'urgent';

export interface EditableTaskUI {
  title: string;
  description?: string;
  estimatedHours: number;
  priority: UIPriority;
  dependencies?: number[];
  tags?: string[];
  selected: boolean;
}

export interface TaskTimeRangeViewModel {
  start: number;
  end: number;
}

export interface TaskTimeConfigViewModel {
  timeType?: 'AllDay' | 'TimePoint' | 'TimeRange';
  timePoint?: number | null;
  timeRange?: TaskTimeRangeViewModel | null;
  startDate?: string | Date | number;
}

export interface TaskGoalBindingViewModel {
  goalId?: string;
  keyResultId?: string;
  incrementValue?: number;
  progressTrigger?: TaskGoalBindingTriggerValue;
  goalTitle?: string;
  keyResultTitle?: string;
}

export interface TaskDependencyValidationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TaskDependencyValidationWarning {
  code: string;
  message: string;
}

export interface GoalBindingProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface GoalBindingOption {
  id: string;
  title: string;
  description?: string;
  status?: string;
}

export interface KeyResultBindingOption {
  id: string;
  title: string;
  weight?: number;
  progress: GoalBindingProgress;
}

export interface TaskTemplateViewModel {
  id: string;
  title: string;
  description?: string;
  status: string;
  statusText?: string;
  isActive?: boolean;
  isPaused?: boolean;
  isArchived?: boolean;
  importance?: string;
  importanceText?: string;
  priority?: number;
  estimatedMinutes?: number | null;
  dueDate?: string | number | null;
  parentTaskId?: string | null;
  parentTaskTitle?: string | null;
  predecessorCount?: number;
  successorCount?: number;
  childCount?: number;
  dependencyStatus?: string;
  isBlocked?: boolean;
  blockingReason?: string | null;
  recurrenceText?: string;
  tags?: string[];
  tagSummaryText?: string;
  goalBinding?: TaskGoalBindingViewModel | null;
  timeConfig: TaskTimeConfigViewModel;
  recurrenceRule?: Record<string, unknown> | null;
  reminderConfig?: Record<string, unknown> | null;
  instanceCount?: number;
  completedInstanceCount?: number;
  pendingInstanceCount?: number;
  completionRate?: number;
  formattedCreatedAt?: string;
  /** TaskType enum value mapped for CreateTaskTemplateReq.taskType */
  taskType?: string;
  /** Colour swatch hex string */
  color?: string | null;
  colorLabel?: string;
}

export interface TaskTemplateFormProps {
  modelValue?: TaskTemplateViewModel | null;
  isEditMode?: boolean;
  readonly?: boolean;
  availableParentTasks?: Array<Pick<TaskTemplateViewModel, 'id' | 'title'>>;
  goals?: GoalBindingOption[];
  keyResultsByGoal?: Record<string, KeyResultBindingOption[]>;
  onRequestKeyResults?: (goalId: string) => Promise<KeyResultBindingOption[] | void> | void;
}

export interface TaskTemplateFormValidationState {
  isValid: boolean;
}

export interface TaskTemplateFormEmits {
  'update:modelValue': [value: TaskTemplateViewModel];
  'update:validation': [validation: TaskTemplateFormValidationState];
  close: [];
}

export interface TaskInstanceViewModel {
  id: string;
  templateId?: string;
  templateTitle?: string;
  isCompleted: boolean;
  statusText?: string;
  instanceDate: string | Date;
  instanceDateFormatted?: string;
  note?: string;
  actualEndTime?: string | Date | null;
  timeConfig: TaskTimeConfigViewModel;
  goalBinding?: TaskGoalBindingViewModel | null;
}

// ── 任务库列表过滤 / 视图模式（UI_PAGE_REDESIGN_PLAN §6）──

export type TaskStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type TaskRelationFilter = 'all' | 'blocked' | 'parented' | 'dependencies' | 'children';

export type TaskViewMode = 'card' | 'graph';
