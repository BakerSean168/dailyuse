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
  displayText?: string;
}

export interface TaskGoalBindingViewModel {
  goalId?: string;
  keyResultId?: string;
  incrementValue?: number;
  goalTitle?: string;
  keyResultTitle?: string;
}

export interface TaskForDAGViewModel {
  id: string;
  title: string;
  status?: string;
  priority?: string | number;
  estimatedMinutes?: number | null;
  dueDate?: string | number | null;
  tags?: string[];
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
  recurrenceText?: string;
  tags?: string[];
  goalBinding?: TaskGoalBindingViewModel | null;
  timeConfig: TaskTimeConfigViewModel;
  recurrenceRule?: any;
  reminderConfig?: any;
  instanceCount?: number;
  completionRate?: number;
  formattedCreatedAt?: string;
  /** TaskType enum value mapped for CreateTaskTemplateReq.taskType */
  taskType?: string;
  /** Folder ID for organising task templates */
  folderId?: string | null;
  /** Colour swatch hex string */
  color?: string | null;
}

export interface TaskTemplateFormProps {
  modelValue?: TaskTemplateViewModel | null;
  isEditMode?: boolean;
  readonly?: boolean;
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
