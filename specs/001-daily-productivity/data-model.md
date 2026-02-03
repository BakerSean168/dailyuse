# Phase 1: Data Model Design

**Feature**: DailyUse Personal Productivity Web Platform  
**Created**: 2026-02-03  
**Status**: Data Model Complete

## Global Conventions

- **IDs**: `string` (UUID v4)
- **Timestamps**: `createdAt`, `updatedAt`, `deletedAt` (ISO 8601 datetime)
- **Soft Delete**: `deletedAt` field present on all entities; set to non-null when deleted; queries exclude by default
- **Timezone**: `string` (IANA timezone e.g., `America/Los_Angeles`, `Asia/Shanghai`)
- **Sorting**: Default descending by `updatedAt`
- **Pagination**: Default limit 20, max 100

---

## 1. User Account

### Description
Represents a user account with authentication, timezone, and status management.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| email | string | no | — | valid email, unique, max 254 chars |
| passwordHash | string | no | — | non-empty (bcrypt) |
| displayName | string | yes | null | 1-80 chars |
| timezone | string | yes | null | valid IANA timezone |
| status | enum | no | `active` | `active \| suspended \| deleted` |
| lastLoginAt | datetime | yes | null | — |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- 1:N → Goal
- 1:N → Task
- 1:N → KeyResult (via Goal)
- 1:N → Reminder
- 1:N → RepositoryItem
- 1:N → Note
- 1:N → ScheduleItem
- 1:N → Notification
- 1:1 → Settings

### Constraints
- Unique: `email` (case-insensitive)
- Index: `status`
- Index: `lastLoginAt`

### Zod Schema

```typescript
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(254).toLowerCase(),
  passwordHash: z.string().min(1),
  displayName: z.string().min(1).max(80).nullable(),
  timezone: z.string().refine(tz => isValidIANATimezone(tz)).nullable(),
  status: z.enum(['active', 'suspended', 'deleted']).default('active'),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type UserDTO = z.infer<typeof UserSchema>;
```

---

## 2. Goal (OKR Structure)

### Description
Top-level objective in the OKR methodology. Contains multiple Key Results that track progress toward the goal.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | foreign key to User |
| title | string | no | — | 1-200 chars |
| description | string | yes | null | max 2000 chars |
| periodType | enum | no | `quarter` | `quarter \| half_year \| custom` |
| periodLabel | string | yes | null | max 32 chars (e.g., "Q1 2026") |
| startDate | date | yes | null | required if periodType=custom |
| endDate | date | yes | null | required if periodType=custom |
| status | enum | no | `draft` | `draft \| in_progress \| completed \| archived` |
| priority | enum | yes | null | `low \| medium \| high` |
| progress | number | no | 0 | 0-100 (calculated from KRs) |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← User (userId)
- 1:N → KeyResult
- 1:N → Task (optional direct link)

### Constraints
- Index: `(userId, status)`
- Index: `(userId, updatedAt)`
- Unique: `(userId, title, periodLabel)` (optional, prevent duplicate named goals)

### State Transitions
```
draft → in_progress → completed → archived
draft → archived (skip implementation)
in_progress → archived (if changed mind)
completed → archived (after review period)
```

### Business Rules
- `progress` = average of all linked KeyResults' progress
- Cannot transition to `completed` if any KR is still `in_progress`
- Must have at least 1 KR to move to `in_progress`

### Zod Schema

```typescript
export const GoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  periodType: z.enum(['quarter', 'half_year', 'custom']).default('quarter'),
  periodLabel: z.string().max(32).nullable(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']).default('draft'),
  priority: z.enum(['low', 'medium', 'high']).nullable(),
  progress: z.number().int().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(
  (data) => data.periodType !== 'custom' || (data.startDate && data.endDate && data.startDate <= data.endDate),
  { message: 'Custom period requires valid start/end dates' }
);

export type GoalDTO = z.infer<typeof GoalSchema>;
```

---

## 3. Key Result

### Description
Measurable result that tracks progress toward a Goal. User can manually update progress.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| goalId | UUID | no | — | foreign key to Goal |
| title | string | no | — | 1-200 chars |
| description | string | yes | null | max 2000 chars |
| targetValue | number | no | — | > 0 |
| currentValue | number | no | 0 | >= 0 |
| progress | number | no | 0 | 0-100 (calculated or manual) |
| status | enum | no | `in_progress` | `in_progress \| completed \| archived` |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← Goal (goalId)
- 1:N → Task (linked tasks)

### Constraints
- Index: `(goalId, status)`
- Unique: `(goalId, title)` (optional)

### State Transitions
```
in_progress → completed → archived
in_progress → archived
```

### Business Rules
- `progress` = (currentValue / targetValue) * 100, capped at 100
- Cannot have more than 5 KRs per Goal (best practice)
- Completing a KR may trigger Goal progress recalculation

### Zod Schema

```typescript
export const KeyResultSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  targetValue: z.number().positive(),
  currentValue: z.number().min(0).default(0),
  progress: z.number().int().min(0).max(100).default(0),
  status: z.enum(['in_progress', 'completed', 'archived']).default('in_progress'),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type KeyResultDTO = z.infer<typeof KeyResultSchema>;
```

---

## 4. Task

### Description
Actionable work item with lifecycle management, optional recurrence, and optional linkage to KeyResult.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | foreign key to User |
| keyResultId | UUID | yes | null | optional link to KeyResult |
| goalId | UUID | yes | null | optional link to Goal (for direct goal tasks) |
| title | string | no | — | 1-200 chars |
| description | string | yes | null | max 4000 chars |
| dueAt | datetime | yes | null | due date & time |
| priority | enum | no | `medium` | `low \| medium \| high` |
| status | enum | no | `not_started` | `not_started \| in_progress \| completed \| archived` |
| recurrenceRule | string | yes | null | RFC 5545 RRULE (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR") |
| parentTaskId | UUID | yes | null | for sub-tasks |
| completedAt | datetime | yes | null | set when status=completed |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← User (userId)
- N:1 ← KeyResult (keyResultId, optional)
- N:1 ← Goal (goalId, optional)
- 1:N ↔ Task (parentTaskId, self-referential for subtasks)
- M:N → Tag (if tags supported)
- 1:N → ScheduleItem

### Constraints
- Index: `(userId, status)`
- Index: `(userId, dueAt)`
- Index: `(keyResultId, status)`
- Index: `(parentTaskId)` for subtask lookup

### State Transitions
```
not_started → in_progress → completed → archived
not_started → archived
in_progress → archived
```

### Business Rules
- Setting `status=completed` auto-sets `completedAt=now()`
- Recurring tasks: when marked complete, create next instance automatically
- Parent task completion requires all subtasks completed
- Task linked to KR may trigger KR progress update (if auto-sync enabled in Phase 2)

### Zod Schema

```typescript
export const TaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  keyResultId: z.string().uuid().nullable(),
  goalId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).nullable(),
  dueAt: z.date().nullable(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'archived']).default('not_started'),
  recurrenceRule: z.string().nullable().refine(
    (rule) => !rule || isValidRRule(rule),
    { message: 'Invalid RRULE format' }
  ),
  parentTaskId: z.string().uuid().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(
  (data) => data.status !== 'completed' || !!data.completedAt,
  { message: 'Completed tasks must have completedAt set' }
);

export type TaskDTO = z.infer<typeof TaskSchema>;
```

---

## 5. Reminder / Habit

### Description
Recurring reminder for daily habits and rituals (wake-up, meals, exercise, etc.) with notification delivery.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | foreign key to User |
| name | string | no | — | 1-120 chars |
| description | string | yes | null | max 1000 chars |
| scheduledTime | string | no | — | HH:MM format (24-hour) |
| recurrenceRule | string | no | — | RFC 5545 RRULE |
| snoozeMinutes | number | yes | null | 1-240 mins |
| channels | string[] | no | ['in_app'] | subset of ['browser', 'in_app', 'email', 'sound'] |
| active | boolean | no | true | — |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← User (userId)
- 1:N → Notification (notifications triggered by this reminder)
- 1:N → ReminderInstance (optional history table)

### Constraints
- Index: `(userId, active)`
- Index: `(userId, scheduledTime)`

### Business Rules
- Reminder fires according to `recurrenceRule` at `scheduledTime`
- Notifications created for `channels` specified
- User can snooze by `snoozeMinutes`
- If `active=false`, no notifications sent

### Zod Schema

```typescript
export const ReminderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullable(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  recurrenceRule: z.string().min(1).refine(
    (rule) => isValidRRule(rule),
    { message: 'Invalid RRULE format' }
  ),
  snoozeMinutes: z.number().int().min(1).max(240).nullable(),
  channels: z.array(z.enum(['browser', 'in_app', 'email', 'sound'])).min(1).default(['in_app']),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type ReminderDTO = z.infer<typeof ReminderSchema>;
```

---

## 6. Repository Item

### Description
Knowledge repository supporting notes, images, audio, video, and documents with tagging and folder organization.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | foreign key to User |
| type | enum | no | `note` | `note \| image \| audio \| video \| document` |
| title | string | no | — | 1-200 chars |
| content | text | yes | null | markdown/text, required if type=note |
| fileUrl | string | yes | null | required if type!=note |
| fileSize | number | yes | null | bytes, required if type!=note |
| fileType | string | yes | null | MIME type, required if type!=note |
| folderId | UUID | yes | null | foreign key to Folder |
| tags | string[] | yes | [] | array of tag names |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← User (userId)
- N:1 ← Folder (folderId, optional)
- M:N ↔ Tag (via normalized join table or JSON array)

### Constraints
- Index: `(userId, type)`
- Index: `(userId, folderId)`
- Full-text index: `title`, `content`

### Business Rules
- Notes can be edited; media items are immutable (new version = new item)
- File size limits per type (e.g., videos max 5GB, images max 100MB)
- Storage quota per user (e.g., 100GB for personal tier)
- Tags can be auto-created or must exist in user's Tag table

### Zod Schema

```typescript
export const RepositoryItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['note', 'image', 'audio', 'video', 'document']).default('note'),
  title: z.string().min(1).max(200),
  content: z.string().nullable(),
  fileUrl: z.string().url().nullable(),
  fileSize: z.number().min(0).nullable(),
  fileType: z.string().max(128).nullable(),
  folderId: z.string().uuid().nullable(),
  tags: z.array(z.string().min(1).max(40)).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(
  (data) => data.type === 'note' ? !!data.content : (!!data.fileUrl && !!data.fileSize && !!data.fileType),
  { message: 'Notes require content; media requires fileUrl, fileSize, fileType' }
);

export type RepositoryItemDTO = z.infer<typeof RepositoryItemSchema>;
```

---

## 7. Note (Editor Content)

### Description
Rich note/document with markdown support and autosave capability.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | foreign key to User |
| repositoryItemId | UUID | yes | null | link to RepositoryItem if stored in repo |
| title | string | no | — | 1-200 chars |
| markdown | text | no | — | non-empty markdown content |
| autosaveIntervalSec | number | yes | null | 10-3600 seconds |
| lastSavedAt | datetime | yes | null | — |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← User (userId)
- 1:1 ← RepositoryItem (repositoryItemId, optional)

### Constraints
- Index: `(userId, updatedAt)`
- Unique: `(repositoryItemId)` when linked

### Business Rules
- Autosave: if `autosaveIntervalSec` is set, save every N seconds
- Can exist independently or as a RepositoryItem

### Zod Schema

```typescript
export const NoteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  repositoryItemId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  markdown: z.string().min(1),
  autosaveIntervalSec: z.number().int().min(10).max(3600).nullable(),
  lastSavedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type NoteDTO = z.infer<typeof NoteSchema>;
```

---

## 8. Schedule Item

### Description
Calendar/schedule entry aggregating goals, tasks, reminders, and custom events.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | foreign key to User |
| type | enum | no | `event` | `goal \| task \| reminder \| event` |
| sourceId | UUID | yes | null | link to Goal/Task/Reminder (polymorphic) |
| title | string | no | — | 1-200 chars |
| startAt | datetime | no | — | — |
| endAt | datetime | yes | null | optional end time |
| allDay | boolean | no | false | if true, endAt not used |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← User (userId)
- Polymorphic: sourceId → Goal / Task / Reminder

### Constraints
- Index: `(userId, startAt)`
- Index: `(userId, type)`

### Business Rules
- Auto-created when goal/task created; user can also create custom events
- `startAt <= endAt` if both provided
- Synced with Goal/Task/Reminder; deleting parent may cascade

### Zod Schema

```typescript
export const ScheduleItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['goal', 'task', 'reminder', 'event']).default('event'),
  sourceId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  startAt: z.date(),
  endAt: z.date().nullable(),
  allDay: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(
  (data) => !data.endAt || data.startAt <= data.endAt,
  { message: 'startAt must be <= endAt' }
);

export type ScheduleItemDTO = z.infer<typeof ScheduleItemSchema>;
```

---

## 9. Notification

### Description
User notifications for reminders, task deadlines, goal milestones with multi-channel delivery.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | foreign key to User |
| type | enum | no | `reminder` | `task_deadline \| reminder \| goal_milestone \| collaboration` |
| channels | string[] | no | ['in_app'] | subset of ['browser', 'in_app', 'email', 'sound'] |
| title | string | no | — | 1-200 chars |
| body | string | yes | null | max 2000 chars |
| resourceType | enum | yes | null | `goal \| task \| reminder` |
| resourceId | UUID | yes | null | link to Goal/Task/Reminder |
| status | enum | no | `unread` | `unread \| read \| archived` |
| sentAt | datetime | yes | null | when notification was sent |
| readAt | datetime | yes | null | when user read it |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- N:1 ← User (userId)
- Polymorphic: resourceId → Goal / Task / Reminder

### Constraints
- Index: `(userId, status)`
- Index: `(userId, createdAt)`

### State Transitions
```
unread → read → archived
unread → archived
```

### Business Rules
- Reading a notification sets `readAt` and `status=read`
- Archiving removes from inbox
- Delivery respects user's NotificationPreferences (quiet hours, channels)

### Zod Schema

```typescript
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['task_deadline', 'reminder', 'goal_milestone', 'collaboration']).default('reminder'),
  channels: z.array(z.enum(['browser', 'in_app', 'email', 'sound'])).min(1),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).nullable(),
  resourceType: z.enum(['goal', 'task', 'reminder']).nullable(),
  resourceId: z.string().uuid().nullable(),
  status: z.enum(['unread', 'read', 'archived']).default('unread'),
  sentAt: z.date().nullable(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(
  (data) => !data.readAt || data.status === 'read',
  { message: 'readAt implies status must be read' }
);

export type NotificationDTO = z.infer<typeof NotificationSchema>;
```

---

## 10. Settings / User Preferences

### Description
User preferences for UI, notifications, editor, and repository display.

### Fields

| Field | Type | Nullable | Default | Validation |
|-------|------|----------|---------|-----------|
| id | UUID | no | generated | — |
| userId | UUID | no | — | unique, foreign key to User |
| theme | enum | no | `auto` | `light \| dark \| auto` |
| language | enum | no | `en` | `en \| zh-CN` |
| editorAutosaveSec | number | no | 60 | 10-3600 |
| markdownFlavor | enum | no | `commonmark` | `commonmark \| gfm` |
| syntaxHighlight | boolean | no | true | — |
| repoView | enum | no | `list` | `list \| grid` |
| repoSort | enum | no | `updated_at` | `updated_at \| created_at \| title` |
| notificationChannels | string[] | no | ['browser', 'in_app'] | subset of ['browser', 'in_app', 'email', 'sound'] |
| quietHoursStart | string | yes | null | HH:MM format |
| quietHoursEnd | string | yes | null | HH:MM format |
| createdAt | datetime | no | now() | — |
| updatedAt | datetime | no | now() | — |
| deletedAt | datetime | yes | null | soft delete |

### Relationships
- 1:1 ← User (userId, unique)

### Constraints
- Unique: `userId`

### Business Rules
- Quiet hours: no notifications between start/end (can wrap midnight)
- Each user has exactly 1 Settings record (created on signup)
- notificationChannels subset of available channels

### Zod Schema

```typescript
export const SettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.enum(['en', 'zh-CN']).default('en'),
  editorAutosaveSec: z.number().int().min(10).max(3600).default(60),
  markdownFlavor: z.enum(['commonmark', 'gfm']).default('commonmark'),
  syntaxHighlight: z.boolean().default(true),
  repoView: z.enum(['list', 'grid']).default('list'),
  repoSort: z.enum(['updated_at', 'created_at', 'title']).default('updated_at'),
  notificationChannels: z.array(z.enum(['browser', 'in_app', 'email', 'sound'])).min(1).default(['browser', 'in_app']),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type SettingsDTO = z.infer<typeof SettingsSchema>;
```

---

## Supporting Entities (Optional, Recommended)

### Tag
Tagging system for organizing repository items and tasks.

```typescript
export const TagSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// Constraints: Unique (userId, name)
// Index: (userId)
```

### Folder
Folder hierarchy for organizing repository items.

```typescript
export const FolderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// Constraints: Unique (userId, parentId, name)
// Index: (userId, parentId)
```

### ReminderInstance (Optional History)
Tracks each occurrence of a recurring reminder.

```typescript
export const ReminderInstanceSchema = z.object({
  id: z.string().uuid(),
  reminderId: z.string().uuid(),
  scheduledAt: z.date(),
  status: z.enum(['pending', 'completed', 'snoozed', 'dismissed']).default('pending'),
  snoozedUntil: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// Index: (reminderId, scheduledAt)
// Index: (reminderId, status)
```

---

## Relationship Diagram Summary

```
┌─────────────────┐
│      User       │ (1:1) Settings
├─────────────────┤
│ - email         │
│ - timezone      │ (1:N) Goal
│ - status        │ (1:N) Task
└─────────────────┘ (1:N) Reminder
         │          (1:N) RepositoryItem
         │          (1:N) Note
         │          (1:N) ScheduleItem
         │          (1:N) Notification
         │
    ┌────┴──────┬─────────────┬──────────────┬──────────────┐
    │            │             │              │              │
┌───┴──┐  ┌──────┴─────┐  ┌────┴──────┐  ┌──────┴────┐  ┌──┴──────┐
│ Goal │  │ KeyResult  │  │   Task    │  │ Reminder  │  │  Repo   │
├──────┤  ├────────────┤  ├───────────┤  ├───────────┤  ├─────────┤
│ - id │  │ - goalId   │  │ - userId  │  │ - userId  │  │ - type  │
│ - pr │  │ - progress │  │ - status  │  │ - time    │  │ - title │
└──┬───┘  └─────┬──────┘  └────┬──────┘  └───────────┘  └────┬────┘
   │            │              │                             │
   │            └──────┬───────┘                             │
   │                   │                                     │
   └───────────┬───────┘                    ┌────────────────┘
         ┌─────┴──────┐                     │
         │ TaskLinked │◄────────────┐       │
         │  to KR     │             │       │
         └────────────┘      ┌──────┴──┐    │
                             │ Folder  │    │
                             │  (opt)  │    │
                             └─────────┘    │
                                            │
                             ┌──────────────┴─┐
                             │ Notification   │
                             │ ScheduleItem   │
                             └────────────────┘
```

---

## Database Indexes Summary

### Primary Indexes (Performance Critical)
- User: `(email)`
- Goal: `(userId, status)`, `(userId, updatedAt)`
- Task: `(userId, status)`, `(userId, dueAt)`, `(keyResultId, status)`
- Reminder: `(userId, active)`, `(userId, scheduledTime)`
- RepositoryItem: `(userId, type)`, `(userId, folderId)`
- ScheduleItem: `(userId, startAt)`, `(userId, type)`
- Notification: `(userId, status)`, `(userId, createdAt)`

### Full-Text Indexes (Search)
- RepositoryItem: `(title, content)`
- Task: `(title, description)`
- Note: `(title, markdown)`

### Unique Constraints
- User: `email`
- Settings: `userId`
- Tag: `(userId, name)`
- Folder: `(userId, parentId, name)`

---

## Notes for Implementation

1. **Timestamps**: Use database `NOW()` function or UTC ISO strings
2. **Soft Delete**: All queries should filter `WHERE deletedAt IS NULL` by default
3. **Enums**: Store as VARCHAR with CHECK constraint or use native ENUM type (DB-specific)
4. **Pagination**: Implement cursor-based pagination for large lists (Goals, Tasks)
5. **Caching**: Consider Redis cache for frequently accessed settings, user preferences
6. **Audit Trail**: Consider adding `createdBy`, `updatedBy` for admin/collaboration features
7. **Migration Strategy**: Start with core entities (User, Goal, KeyResult, Task); add others incrementally

