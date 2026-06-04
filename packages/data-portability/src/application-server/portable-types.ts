/**
 * Portable Data Types — V1
 *
 * Types for the user data export/import envelope.
 * No database IDs, identityIds, or auth fields appear in these types.
 */

// ============ Ref Allocator ============

export class RefAllocator {
  private counters = new Map<string, number>();

  allocate(prefix: string): string {
    const count = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, count);
    return `${prefix}:${count}`;
  }
}

// ============ Envelope ============

export interface UserDataExportEnvelopeV1 {
  kind: 'memoflow.user-data-export';
  schemaVersion: 1;
  exportedAt: string;
  exportedBy?: {
    appName: 'Memoflow';
    appVersion?: string;
  };
  scope: {
    includesBinaryResources: false;
    importMode: 'append-create-like';
  };
  data: PortableUserDataV1;
}

// ============ Portable Data ============

export interface PortableUserDataV1 {
  settings?: PortableSettings;
  notificationPreference?: PortableNotificationPreference;
  userReminderPreference?: PortableUserReminderPreference;
  goals?: PortableGoalData;
  tasks?: PortableTaskData;
  reminders?: PortableReminderData;
  repositories?: PortableRepositoryData;
  schedules?: PortableScheduleData;
  editor?: PortableEditorData;
  ai?: PortableAIData;
}

// ─── Settings ───

export interface PortableSettings {
  preferences: Record<string, unknown>;
}

// ─── Notification Preference ───

export interface PortableNotificationPreference {
  channels: unknown;
  categories: unknown;
  doNotDisturb?: unknown;
  rateLimit?: unknown;
  enabled?: boolean;
}

// ─── User Reminder Preference ───

export interface PortableUserReminderPreference {
  bestTimeSlots: unknown[];
  worstTimeSlots: unknown[];
  globalReminderEnabled: boolean;
  globalSmartFrequency: boolean;
}

// ─── Goals ───

export interface PortableGoalData {
  folders: PortableGoalFolder[];
  items: PortableGoal[];
  records: PortableGoalRecord[];
  focusSessions: PortableFocusSession[];
  focusModes: PortableFocusMode[];
}

export interface PortableGoalFolder {
  _ref: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentRef?: string | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableGoal {
  _ref: string;
  name: string;
  description?: string | null;
  color: string;
  feasibilityAnalysis?: string | null;
  motivation?: string | null;
  status: string;
  importance: string;
  priority: number;
  category?: string | null;
  tags: string[];
  startDate?: string | null;
  targetDate?: string | null;
  completedAt?: string | null;
  folderRef?: string | null;
  parentGoalRef?: string | null;
  sortOrder: number;
  reminderConfig?: unknown;
  keyResults: PortableKeyResult[];
  goalReviews: PortableGoalReview[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableKeyResult {
  _ref: string;
  title: string;
  description?: string | null;
  progress: unknown;
  weight: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableGoalReview {
  _ref: string;
  reviewType: string;
  rating?: number;
  content: string;
  achievements?: string | null;
  challenges?: string | null;
  lessonsLearned?: string | null;
  nextSteps?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableGoalRecord {
  _ref: string;
  keyResultRef: string;
  value: number;
  note?: string | null;
  recordedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableFocusSession {
  _ref: string;
  goalRef?: string | null;
  status: string;
  durationMinutes: number;
  actualDurationMinutes: number;
  description?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  pauseCount: number;
  pausedDurationMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableFocusMode {
  _ref: string;
  focusedGoalRefs: string[];
  startTime: string;
  endTime: string;
  hiddenGoalsMode: string;
  isActive: boolean;
  actualEndTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Tasks ───

export interface PortableTaskData {
  folders: PortableTaskFolder[];
  templates: PortableTaskTemplate[];
  instances: PortableTaskInstance[];
  dependencies: PortableTaskDependency[];
}

export interface PortableTaskFolder {
  _ref: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  order: number;
}

export interface PortableTaskTemplate {
  _ref: string;
  title: string;
  description?: string | null;
  taskType: string;
  importance: string;
  tags: string[];
  color?: string | null;
  status: string;
  folderRef?: string | null;
  goalRef?: string | null;
  keyResultRef?: string | null;
  goalBinding?: unknown;
  checklist: unknown[];
  parentTaskRef?: string | null;
  timeConfig?: unknown;
  recurrenceRule?: unknown;
  reminderConfig?: unknown;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableTaskInstance {
  _ref: string;
  templateRef: string;
  instanceDate: number;
  timeConfig?: unknown;
  importance: string;
  priority?: number;
  status: string;
  completionRecord?: unknown;
  skipRecord?: unknown;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableTaskDependency {
  _ref: string;
  predecessorTaskRef: string;
  successorTaskRef: string;
  dependencyType: string;
  lagDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Reminders ───

export interface PortableReminderData {
  groups: PortableReminderGroup[];
  templates: PortableReminderTemplate[];
  responses: PortableReminderResponse[];
}

export interface PortableReminderGroup {
  _ref: string;
  name: string;
  description?: string | null;
  controlMode: string;
  enabled: boolean;
  status: string;
  order: number;
  color?: string | null;
  icon?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableReminderTemplate {
  _ref: string;
  title: string;
  description?: string | null;
  type: string;
  trigger: unknown;
  activeTime: unknown;
  activeHours?: unknown;
  notificationConfig: unknown;
  selfEnabled: boolean;
  status: string;
  groupRef?: string | null;
  importanceLevel: string;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  smartFrequencyEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableReminderResponse {
  _ref: string;
  templateRef: string;
  action: string;
  responseTime?: string | null;
  timestamp: string;
}

// ─── Repositories ───

export interface PortableRepositoryData {
  repositories: PortableRepository[];
  folders: PortableResourceFolder[];
  resources: PortableResource[];
}

export interface PortableRepository {
  _ref: string;
  name: string;
  type: string;
  path?: string | null;
  description?: string | null;
  config: unknown;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableResourceFolder {
  _ref: string;
  repositoryRef: string;
  parentRef?: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableResource {
  _ref: string;
  repositoryRef: string;
  folderRef?: string | null | undefined;
  type: string;
  name: string;
  path: string;
  size?: number | null;
  content?: string | null;
  metadata?: unknown;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Schedules ───

export interface PortableScheduleData {
  entries: PortableSchedule[];
  tasks: PortableScheduleTask[];
}

export interface PortableSchedule {
  _ref: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  priority?: number | null;
  location?: string | null;
  attendees?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortableScheduleTask {
  _ref: string;
  name: string;
  description?: string | null;
  sourceModule: string;
  sourceRef?: string | null;
  status: string;
  enabled: boolean;
  schedule: unknown;
  execution: unknown;
  retryPolicy?: unknown;
  metadata?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Editor ───

export interface PortableEditorData {
  workspaces: PortableEditorWorkspace[];
}

export interface PortableEditorWorkspace {
  _ref: string;
  name: string;
  description?: string | null;
  projectPath: string;
  projectType: string;
  layout: unknown;
  settings: unknown;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  sessions: PortableEditorSession[];
}

export interface PortableEditorSession {
  _ref: string;
  name: string;
  description?: string | null;
  layout: unknown;
  isActive: boolean;
  activeGroupIndex: number;
  createdAt?: string;
  updatedAt?: string;
  groups: PortableEditorGroup[];
}

export interface PortableEditorGroup {
  _ref: string;
  groupIndex: number;
  activeTabIndex: number;
  name?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tabs: PortableEditorTab[];
}

export interface PortableEditorTab {
  _ref: string;
  resourceRef?: string | null;
  tabIndex: number;
  tabType: string;
  name: string;
  viewState: unknown;
  isPinned: boolean;
  isActive: boolean;
  isDirty: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── AI ───

export interface PortableAIData {
  conversations: PortableAIConversation[];
}

export interface PortableAIConversation {
  _ref: string;
  name: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  messages: PortableAIMessage[];
}

export interface PortableAIMessage {
  _ref: string;
  role: string;
  content: string;
  tokenCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============ Import Types ============

export type RefMap = Map<string, string>;

export interface ImportContext {
  identityId: string;
  batchId: string;
  refMap: RefMap;
  created: Record<string, number>;
  updatedSingletons: Record<string, number>;
  skipped: Record<string, number>;
  warnings: string[];
}

export interface ExportContext {
  identityId: string;
  exportedAt: string;
  refAllocator: RefAllocator;
  warnings: string[];
  refToIdMap: Map<string, string>;
}

export interface ExportResult {
  fileName: string;
  content: string;
  summary: {
    entityCounts: Record<string, number>;
    warnings: string[];
  };
}

export interface ImportResult {
  batchId: string;
  dryRun: boolean;
  created: Record<string, number>;
  updatedSingletons: Record<string, number>;
  skipped: Record<string, number>;
  warnings: string[];
}

// ============ Module Selection ============

export type ExportableModule =
  | 'settings'
  | 'goals'
  | 'tasks'
  | 'schedule'
  | 'reminders'
  | 'repository'
  | 'editor'
  | 'ai'
  | 'notifications';

export const ALL_MODULES: ExportableModule[] = [
  'settings',
  'goals',
  'tasks',
  'schedule',
  'reminders',
  'repository',
  'editor',
  'ai',
  'notifications',
];
