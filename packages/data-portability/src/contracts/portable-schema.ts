/**
 * Data portability contracts — Zod validation for API DTOs and import files
 *
 * Module-level schemas use strict() to reject unknown fields, while a
 * recursive banned-key scan protects nested unknown JSON/config blocks from
 * carrying database IDs, identity fields, or credentials into import.
 */

import { z } from 'zod';

// ============ Common ============

const PortableRefSchema = z.string().regex(/^[a-z][a-zA-Z0-9]*:\d+$/);
const IsoDateString = z.string();

const BANNED_IMPORT_FIELD_NAMES = new Set([
  'id',
  'identityid',
  'identity_id',
  'accountid',
  'account_id',
  'operatorid',
  'operator_id',
  'userid',
  'user_id',
  'createdby',
  'created_by',
  'updatedby',
  'updated_by',
  'deletedat',
  'deleted_at',
  'apikeyencrypted',
  'auth',
  'authorization',
]);

const BANNED_IMPORT_KEY_PATTERN =
  /(token|password|secret|apiKey|api_key|sshKey|privateKey|credential|accessToken|refreshToken|sessionToken)/i;

export function isBannedPortableDataKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (BANNED_IMPORT_FIELD_NAMES.has(normalized)) return true;
  if (/^[A-Za-z][A-Za-z0-9]*Id$/.test(key)) return true;
  if (/(^|_)id$/i.test(key)) return true;
  return BANNED_IMPORT_KEY_PATTERN.test(key);
}

function findBannedImportKey(value: unknown, path: string[] = []): string | null {
  if (value === null || value === undefined || typeof value !== 'object') return null;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = findBannedImportKey(value[i], [...path, String(i)]);
      if (found) return found;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = [...path, key];
    if (isBannedPortableDataKey(key)) return currentPath.join('.');

    const found = findBannedImportKey(child, currentPath);
    if (found) return found;
  }

  return null;
}

// ============ Settings ============

export const PortableSettingsSchema = z
  .object({
    preferences: z.record(z.string(), z.unknown()),
  })
  .strict();

export const PortableNotificationPreferenceSchema = z
  .object({
    channels: z.unknown(),
    categories: z.unknown(),
    doNotDisturb: z.unknown().optional(),
    rateLimit: z.unknown().optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const PortableUserReminderPreferenceSchema = z
  .object({
    bestTimeSlots: z.array(z.unknown()),
    worstTimeSlots: z.array(z.unknown()),
    globalReminderEnabled: z.boolean(),
    globalSmartFrequency: z.boolean(),
  })
  .strict();

// ============ Goals ============

export const PortableGoalFolderSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    parentRef: PortableRefSchema.nullable().optional(),
    sortOrder: z.number(),
    isSystemFolder: z.boolean(),
    folderType: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableKeyResultSchema = z
  .object({
    _ref: PortableRefSchema,
    title: z.string(),
    description: z.string().nullable().optional(),
    progress: z.unknown(),
    weight: z.number(),
    sortOrder: z.number(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableGoalReviewSchema = z
  .object({
    _ref: PortableRefSchema,
    reviewType: z.string(),
    rating: z.number().optional(),
    content: z.string(),
    achievements: z.string().nullable().optional(),
    challenges: z.string().nullable().optional(),
    lessonsLearned: z.string().nullable().optional(),
    nextSteps: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableGoalSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    color: z.string(),
    feasibilityAnalysis: z.string().nullable().optional(),
    motivation: z.string().nullable().optional(),
    status: z.string(),
    importance: z.string(),
    priority: z.number(),
    category: z.string().nullable().optional(),
    tags: z.array(z.string()),
    startDate: IsoDateString.nullable().optional(),
    targetDate: IsoDateString.nullable().optional(),
    completedAt: IsoDateString.nullable().optional(),
    folderRef: PortableRefSchema.nullable().optional(),
    parentGoalRef: PortableRefSchema.nullable().optional(),
    sortOrder: z.number(),
    reminderConfig: z.unknown().optional(),
    keyResults: z.array(PortableKeyResultSchema),
    goalReviews: z.array(PortableGoalReviewSchema),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableGoalRecordSchema = z
  .object({
    _ref: PortableRefSchema,
    keyResultRef: PortableRefSchema,
    value: z.number(),
    note: z.string().nullable().optional(),
    recordedAt: IsoDateString,
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableFocusSessionSchema = z
  .object({
    _ref: PortableRefSchema,
    goalRef: PortableRefSchema.nullable().optional(),
    status: z.string(),
    durationMinutes: z.number(),
    actualDurationMinutes: z.number(),
    description: z.string().nullable().optional(),
    startedAt: IsoDateString.nullable().optional(),
    completedAt: IsoDateString.nullable().optional(),
    pauseCount: z.number(),
    pausedDurationMinutes: z.number(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableFocusModeSchema = z
  .object({
    _ref: PortableRefSchema,
    focusedGoalRefs: z.array(PortableRefSchema),
    startTime: IsoDateString,
    endTime: IsoDateString,
    hiddenGoalsMode: z.string(),
    isActive: z.boolean(),
    actualEndTime: IsoDateString.nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableGoalDataSchema = z
  .object({
    folders: z.array(PortableGoalFolderSchema),
    items: z.array(PortableGoalSchema),
    records: z.array(PortableGoalRecordSchema),
    focusSessions: z.array(PortableFocusSessionSchema),
    focusModes: z.array(PortableFocusModeSchema),
  })
  .strict();

// ============ Tasks ============

export const PortableTaskFolderSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    order: z.number(),
  })
  .strict();

export const PortableTaskTemplateSchema = z
  .object({
    _ref: PortableRefSchema,
    title: z.string(),
    description: z.string().nullable().optional(),
    taskType: z.string(),
    importance: z.string(),
    tags: z.array(z.string()),
    color: z.string().nullable().optional(),
    status: z.string(),
    folderRef: PortableRefSchema.nullable().optional(),
    goalRef: PortableRefSchema.nullable().optional(),
    keyResultRef: PortableRefSchema.nullable().optional(),
    goalBinding: z.unknown().optional(),
    checklist: z.array(z.unknown()),
    parentTaskRef: PortableRefSchema.nullable().optional(),
    timeConfig: z.unknown().optional(),
    recurrenceRule: z.unknown().optional(),
    reminderConfig: z.unknown().optional(),
    startDate: IsoDateString.nullable().optional(),
    dueDate: IsoDateString.nullable().optional(),
    completedAt: IsoDateString.nullable().optional(),
    estimatedMinutes: z.number().nullable().optional(),
    actualMinutes: z.number().nullable().optional(),
    note: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableTaskInstanceSchema = z
  .object({
    _ref: PortableRefSchema,
    templateRef: PortableRefSchema,
    instanceDate: z.number(),
    timeConfig: z.unknown().optional(),
    importance: z.string(),
    priority: z.number().optional(),
    status: z.string(),
    completionRecord: z.unknown().optional(),
    skipRecord: z.unknown().optional(),
    actualStartTime: z.number().nullable().optional(),
    actualEndTime: z.number().nullable().optional(),
    note: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableTaskDependencySchema = z
  .object({
    _ref: PortableRefSchema,
    predecessorTaskRef: PortableRefSchema,
    successorTaskRef: PortableRefSchema,
    dependencyType: z.string(),
    lagDays: z.number().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableTaskDataSchema = z
  .object({
    folders: z.array(PortableTaskFolderSchema),
    templates: z.array(PortableTaskTemplateSchema),
    instances: z.array(PortableTaskInstanceSchema),
    dependencies: z.array(PortableTaskDependencySchema),
  })
  .strict();

// ============ Reminders ============

export const PortableReminderGroupSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    controlMode: z.string(),
    enabled: z.boolean(),
    status: z.string(),
    order: z.number(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableReminderTemplateSchema = z
  .object({
    _ref: PortableRefSchema,
    title: z.string(),
    description: z.string().nullable().optional(),
    type: z.string(),
    trigger: z.unknown(),
    activeTime: z.unknown(),
    activeHours: z.unknown().optional(),
    notificationConfig: z.unknown(),
    selfEnabled: z.boolean(),
    status: z.string(),
    groupRef: PortableRefSchema.nullable().optional(),
    importanceLevel: z.string(),
    tags: z.array(z.string()),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    smartFrequencyEnabled: z.boolean(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableReminderResponseSchema = z
  .object({
    _ref: PortableRefSchema,
    templateRef: PortableRefSchema,
    action: z.string(),
    responseTime: IsoDateString.nullable().optional(),
    timestamp: IsoDateString,
  })
  .strict();

export const PortableReminderDataSchema = z
  .object({
    groups: z.array(PortableReminderGroupSchema),
    templates: z.array(PortableReminderTemplateSchema),
    responses: z.array(PortableReminderResponseSchema),
  })
  .strict();

// ============ Repositories ============

export const PortableRepositorySchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    type: z.string(),
    path: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    config: z.unknown(),
    status: z.string(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableResourceFolderSchema = z
  .object({
    _ref: PortableRefSchema,
    repositoryRef: PortableRefSchema,
    parentRef: PortableRefSchema.nullable().optional(),
    name: z.string(),
    path: z.string(),
    order: z.number(),
    isExpanded: z.boolean(),
    metadata: z.unknown().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableResourceSchema = z
  .object({
    _ref: PortableRefSchema,
    repositoryRef: PortableRefSchema,
    folderRef: PortableRefSchema.nullable().optional(),
    type: z.string(),
    name: z.string(),
    path: z.string(),
    size: z.number().nullable().optional(),
    content: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
    status: z.string(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableRepositoryDataSchema = z
  .object({
    repositories: z.array(PortableRepositorySchema),
    folders: z.array(PortableResourceFolderSchema),
    resources: z.array(PortableResourceSchema),
  })
  .strict();

// ============ Schedules ============

export const PortableScheduleSchema = z
  .object({
    _ref: PortableRefSchema,
    title: z.string(),
    description: z.string().nullable().optional(),
    startTime: IsoDateString,
    endTime: IsoDateString,
    duration: z.number(),
    priority: z.number().nullable().optional(),
    location: z.string().nullable().optional(),
    attendees: z.array(z.string()).nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableScheduleTaskSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    sourceModule: z.string(),
    sourceRef: PortableRefSchema.nullable().optional(),
    status: z.string(),
    enabled: z.boolean(),
    schedule: z.unknown(),
    execution: z.unknown(),
    retryPolicy: z.unknown().optional(),
    metadata: z.unknown().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableScheduleDataSchema = z
  .object({
    entries: z.array(PortableScheduleSchema),
    tasks: z.array(PortableScheduleTaskSchema),
  })
  .strict();

// ============ Editor ============

export const PortableEditorTabSchema = z
  .object({
    _ref: PortableRefSchema,
    resourceRef: PortableRefSchema.nullable().optional(),
    tabIndex: z.number(),
    tabType: z.string(),
    name: z.string(),
    viewState: z.unknown(),
    isPinned: z.boolean(),
    isActive: z.boolean(),
    isDirty: z.boolean(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableEditorGroupSchema = z
  .object({
    _ref: PortableRefSchema,
    groupIndex: z.number(),
    activeTabIndex: z.number(),
    name: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    tabs: z.array(PortableEditorTabSchema),
  })
  .strict();

export const PortableEditorSessionSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    layout: z.unknown(),
    isActive: z.boolean(),
    activeGroupIndex: z.number(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    groups: z.array(PortableEditorGroupSchema),
  })
  .strict();

export const PortableEditorWorkspaceSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    projectPath: z.string(),
    projectType: z.string(),
    layout: z.unknown(),
    settings: z.unknown(),
    isActive: z.boolean(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    sessions: z.array(PortableEditorSessionSchema),
  })
  .strict();

export const PortableEditorDataSchema = z
  .object({
    workspaces: z.array(PortableEditorWorkspaceSchema),
  })
  .strict();

// ============ AI ============

export const PortableAIMessageSchema = z
  .object({
    _ref: PortableRefSchema,
    role: z.string(),
    content: z.string(),
    tokenCount: z.number().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export const PortableAIConversationSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    status: z.string(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    messages: z.array(PortableAIMessageSchema),
  })
  .strict();

export const PortableAIDataSchema = z
  .object({
    conversations: z.array(PortableAIConversationSchema),
  })
  .strict();

// ============ Composed User Data Schema ============

export const PortableUserDataV1Schema = z
  .object({
    settings: PortableSettingsSchema.optional(),
    notificationPreference: PortableNotificationPreferenceSchema.optional(),
    userReminderPreference: PortableUserReminderPreferenceSchema.optional(),
    goals: PortableGoalDataSchema.optional(),
    tasks: PortableTaskDataSchema.optional(),
    reminders: PortableReminderDataSchema.optional(),
    repositories: PortableRepositoryDataSchema.optional(),
    schedules: PortableScheduleDataSchema.optional(),
    editor: PortableEditorDataSchema.optional(),
    ai: PortableAIDataSchema.optional(),
  })
  .strict();

// ============ Export ============

export const ExportUserDataReqSchema = z.object({
  include: z
    .array(
      z.enum([
        'settings',
        'goals',
        'tasks',
        'schedule',
        'reminders',
        'repository',
        'editor',
        'ai',
        'notifications',
      ]),
    )
    .optional(),
});

export type ExportUserDataReq = z.infer<typeof ExportUserDataReqSchema>;

export const ExportUserDataResSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  summary: z.object({
    entityCounts: z.record(z.string(), z.number()),
    warnings: z.array(z.string()),
  }),
});

export type ExportUserDataRes = z.infer<typeof ExportUserDataResSchema>;

// ============ Import ============

export const ImportUserDataReqSchema = z.object({
  content: z.string().max(10_000_000, 'Import content exceeds 10 MB limit'),
  dryRun: z.boolean().optional(),
});

export type ImportUserDataReq = z.infer<typeof ImportUserDataReqSchema>;

export const ImportUserDataResSchema = z.object({
  batchId: z.string(),
  dryRun: z.boolean(),
  created: z.record(z.string(), z.number()),
  updatedSingletons: z.record(z.string(), z.number()),
  skipped: z.record(z.string(), z.number()),
  warnings: z.array(z.string()),
});

export type ImportUserDataRes = z.infer<typeof ImportUserDataResSchema>;

// ============ Envelope Validation ============

const PortableEnvelopeScopeSchema = z.object({
  includesBinaryResources: z.literal(false),
  importMode: z.literal('append-create-like'),
});

export const UserDataExportEnvelopeSchema = z.object({
  kind: z.literal('memoflow.user-data-export'),
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  exportedBy: z
    .object({
      appName: z.literal('Memoflow'),
      appVersion: z.string().optional(),
    })
    .optional(),
  scope: PortableEnvelopeScopeSchema,
  data: PortableUserDataV1Schema,
});

export function validateEnvelope(raw: unknown): {
  ok: true;
  data: Record<string, unknown>;
} | { ok: false; error: string } {
  const result = UserDataExportEnvelopeSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      error: `Envelope validation failed: ${issue.path.join('.')} — ${issue.message}`,
    };
  }

  const bannedPath = findBannedImportKey(result.data.data);
  if (bannedPath) {
    return {
      ok: false,
      error: `Envelope validation failed: data.${bannedPath} — banned import field`,
    };
  }

  return { ok: true, data: result.data.data as Record<string, unknown> };
}
