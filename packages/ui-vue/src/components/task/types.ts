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
  timeType?: 'ALL_DAY' | 'TIME_POINT' | 'TIME_RANGE';
  timePoint?: number | null;
  timeRange?: TaskTimeRangeViewModel | null;
  startDate?: string | Date | number;
  displayText?: string;
}

export interface TaskGoalBindingViewModel {
  goalUuid?: string;
  keyResultUuid?: string;
  incrementValue?: number;
  goalTitle?: string;
  keyResultTitle?: string;
}

export interface TaskForDAGViewModel {
  uuid: string;
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
  uuid: string;
  title: string;
  description?: string;
  status?: string;
}

export interface KeyResultBindingOption {
  uuid: string;
  title: string;
  weight?: number;
  progress: GoalBindingProgress;
}

export interface TaskTemplateViewModel {
  uuid: string;
  title: string;
  description?: string;
  status: string;
  statusText?: string;
  isActive?: boolean;
  isPaused?: boolean;
  isArchived?: boolean;
  importance?: number;
  importanceText?: string;
  priority?: number;
  recurrenceText?: string;
  tags?: string[];
  goalBinding?: TaskGoalBindingViewModel | null;
  timeConfig: TaskTimeConfigViewModel;
  instanceCount?: number;
  completionRate?: number;
  formattedCreatedAt?: string;
}

export interface TaskInstanceViewModel {
  uuid: string;
  templateUuid?: string;
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
