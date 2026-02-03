# Phase 1: API Contracts

**Feature**: DailyUse Personal Productivity Web Platform  
**Created**: 2026-02-03  
**Status**: API Contracts Defined

## Overview

This document defines the API contracts (Request/Response DTOs) for all endpoints in the DailyUse platform. All endpoints follow REST conventions and return standardized response envelopes.

### Response Envelope Format

All endpoints return this structure:

```typescript
interface ApiResponse<T> {
  code: number;                    // HTTP status code (200, 400, 404, etc.)
  message: string;                 // Human-readable message
  data: T | null;                  // Response payload (null on error)
  timestamp: ISO8601DateTime;      // Response timestamp
  error?: {
    type: string;                  // Error type (ValidationError, NotFound, etc.)
    details?: Record<string, any>; // Additional error details
  };
}
```

---

## 1. Authentication Module

### POST /auth/signup
Create a new user account.

**Request**:
```typescript
interface SignUpReq {
  email: string;           // email@example.com
  password: string;        // min 8 chars, must have uppercase, lowercase, number
  displayName?: string;    // optional, 1-80 chars
  timezone?: string;       // optional IANA timezone
}
```

**Response**:
```typescript
interface AuthClientDTO {
  id: string;              // UUID
  email: string;
  displayName?: string;
  timezone?: string;
  status: 'active';
  createdAt: ISO8601DateTime;
}

// Response: ApiResponse<AuthClientDTO>
```

**Error Codes**:
- 400: Validation error (email invalid, password weak, etc.)
- 409: Email already exists
- 500: Server error

---

### POST /auth/login
Authenticate user and return session token.

**Request**:
```typescript
interface LoginReq {
  email: string;
  password: string;
}
```

**Response**:
```typescript
interface LoginRes {
  user: AuthClientDTO;
  token: string;           // JWT or session token
  expiresIn: number;       // seconds
}

// Response: ApiResponse<LoginRes>
```

**Error Codes**:
- 400: Validation error
- 401: Invalid credentials
- 429: Too many attempts (rate limit)

---

### POST /auth/logout
Invalidate user session.

**Request**: (headers only, token in Authorization header)

**Response**:
```typescript
interface LogoutRes {
  success: boolean;
}

// Response: ApiResponse<LogoutRes>
```

---

### POST /auth/refresh-token
Refresh expired session token.

**Request**:
```typescript
interface RefreshTokenReq {
  refreshToken: string;
}
```

**Response**: Same as LoginRes

---

## 2. Goal Module

### POST /goals
Create a new goal.

**Request**:
```typescript
interface CreateGoalReq {
  title: string;              // 1-200 chars
  description?: string;       // max 2000 chars
  periodType: 'quarter' | 'half_year' | 'custom'; // default: 'quarter'
  periodLabel?: string;       // e.g., "Q1 2026"
  startDate?: ISO8601Date;    // required if periodType='custom'
  endDate?: ISO8601Date;      // required if periodType='custom'
  priority?: 'low' | 'medium' | 'high';
}
```

**Response**:
```typescript
interface GoalClientDTO {
  id: string;
  userId: string;
  title: string;
  description?: string;
  periodType: string;
  periodLabel?: string;
  startDate?: ISO8601Date;
  endDate?: ISO8601Date;
  status: 'draft';
  priority?: string;
  progress: 0;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<GoalClientDTO>
```

---

### PATCH /goals/:id
Update a goal.

**Request**:
```typescript
interface UpdateGoalReq {
  title?: string;
  description?: string;
  periodLabel?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  // Note: Cannot update dates after creation
}
```

**Response**: `ApiResponse<GoalClientDTO>`

---

### GET /goals/:id
Retrieve a single goal with key results.

**Request**: None

**Query Parameters**:
```typescript
interface GetGoalQuery {
  includeKeyResults?: boolean;  // default: true
  includeLinkedTasks?: boolean; // default: false
}
```

**Response**:
```typescript
interface GoalDetailDTO extends GoalClientDTO {
  keyResults?: KeyResultClientDTO[];
  linkedTasksCount?: number;
}

// Response: ApiResponse<GoalDetailDTO>
```

---

### GET /goals
List goals with pagination and filtering.

**Query Parameters**:
```typescript
interface ListGoalsQuery {
  page?: number;              // default: 1
  limit?: number;             // default: 20, max: 100
  status?: string;            // filter by status
  periodType?: string;        // filter by period type
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'progress'; // default: 'updatedAt'
  sortOrder?: 'asc' | 'desc'; // default: 'desc'
}
```

**Response**:
```typescript
interface ListGoalsRes {
  data: GoalClientDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Response: ApiResponse<ListGoalsRes>
```

---

### DELETE /goals/:id
Delete a goal (soft delete).

**Response**: `ApiResponse<GoalClientDTO>`

---

## 3. Key Result Module

### POST /goals/:goalId/key-results
Create a key result for a goal.

**Request**:
```typescript
interface CreateKeyResultReq {
  title: string;           // 1-200 chars
  description?: string;    // max 2000 chars
  targetValue: number;     // > 0
}
```

**Response**:
```typescript
interface KeyResultClientDTO {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: 0;
  progress: 0;
  status: 'in_progress';
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<KeyResultClientDTO>
```

---

### PATCH /key-results/:id
Update key result progress or status.

**Request**:
```typescript
interface UpdateKeyResultReq {
  title?: string;
  description?: string;
  currentValue?: number;    // user-provided progress value
  status?: 'in_progress' | 'completed' | 'archived';
}
```

**Response**: `ApiResponse<KeyResultClientDTO>`

---

### GET /goals/:goalId/key-results
List key results for a goal.

**Query Parameters**:
```typescript
interface ListKeyResultsQuery {
  status?: string;
  sortBy?: 'progress' | 'createdAt' | 'title'; // default: 'createdAt'
}
```

**Response**:
```typescript
interface ListKeyResultsRes {
  data: KeyResultClientDTO[];
  goalProgress: number; // average of all KR progress
}

// Response: ApiResponse<ListKeyResultsRes>
```

---

## 4. Task Module

### POST /tasks
Create a task.

**Request**:
```typescript
interface CreateTaskReq {
  title: string;              // 1-200 chars
  description?: string;       // max 4000 chars
  keyResultId?: string;       // optional link to KR
  goalId?: string;            // optional link to Goal
  dueAt?: ISO8601DateTime;
  priority?: 'low' | 'medium' | 'high'; // default: 'medium'
  recurrenceRule?: string;    // RFC 5545 RRULE
  parentTaskId?: string;      // for subtasks
}
```

**Response**:
```typescript
interface TaskClientDTO {
  id: string;
  userId: string;
  keyResultId?: string;
  goalId?: string;
  title: string;
  description?: string;
  dueAt?: ISO8601DateTime;
  priority: string;
  status: 'not_started';
  recurrenceRule?: string;
  parentTaskId?: string;
  completedAt: null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<TaskClientDTO>
```

---

### PATCH /tasks/:id
Update task status, priority, or other fields.

**Request**:
```typescript
interface UpdateTaskReq {
  title?: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  dueAt?: ISO8601DateTime;
  // Note: Cannot change parent or KR after creation
}
```

**Response**: `ApiResponse<TaskClientDTO>`

**Business Logic**: 
- Marking as `completed` auto-sets `completedAt=now()`
- If recurring, creating new instance automatically

---

### GET /tasks/:id
Retrieve a single task.

**Response**: `ApiResponse<TaskClientDTO>`

---

### GET /tasks
List tasks with filtering.

**Query Parameters**:
```typescript
interface ListTasksQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  keyResultId?: string;
  goalId?: string;
  dueBefore?: ISO8601Date;
  dueAfter?: ISO8601Date;
  sortBy?: 'dueAt' | 'priority' | 'createdAt'; // default: 'dueAt'
  sortOrder?: 'asc' | 'desc';
}
```

**Response**:
```typescript
interface ListTasksRes {
  data: TaskClientDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Response: ApiResponse<ListTasksRes>
```

---

### DELETE /tasks/:id
Delete a task (soft delete).

**Response**: `ApiResponse<TaskClientDTO>`

---

## 5. Reminder Module

### POST /reminders
Create a reminder/habit.

**Request**:
```typescript
interface CreateReminderReq {
  name: string;                    // 1-120 chars
  description?: string;            // max 1000 chars
  scheduledTime: string;           // HH:MM format
  recurrenceRule: string;          // RFC 5545 RRULE
  snoozeMinutes?: number;          // 1-240
  channels?: ('browser' | 'in_app' | 'email' | 'sound')[]; // default: ['in_app']
}
```

**Response**:
```typescript
interface ReminderClientDTO {
  id: string;
  userId: string;
  name: string;
  description?: string;
  scheduledTime: string;
  recurrenceRule: string;
  snoozeMinutes?: number;
  channels: string[];
  active: true;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<ReminderClientDTO>
```

---

### PATCH /reminders/:id
Update reminder settings.

**Request**:
```typescript
interface UpdateReminderReq {
  name?: string;
  description?: string;
  scheduledTime?: string;
  recurrenceRule?: string;
  channels?: string[];
  active?: boolean;
}
```

**Response**: `ApiResponse<ReminderClientDTO>`

---

### GET /reminders
List reminders.

**Query Parameters**:
```typescript
interface ListRemindersQuery {
  activeOnly?: boolean; // default: true
  sortBy?: 'scheduledTime' | 'createdAt';
}
```

**Response**:
```typescript
interface ListRemindersRes {
  data: ReminderClientDTO[];
}

// Response: ApiResponse<ListRemindersRes>
```

---

## 6. Repository Module

### POST /repository
Create a repository item (upload file or create note).

**Request** (Multipart or JSON):
```typescript
// For notes:
interface CreateRepositoryNoteReq {
  type: 'note';
  title: string;          // 1-200 chars
  content: string;        // markdown
  folderId?: string;
  tags?: string[];
}

// For media:
interface CreateRepositoryMediaReq {
  type: 'image' | 'audio' | 'video' | 'document';
  title: string;
  file: File;             // multipart upload
  folderId?: string;
  tags?: string[];
}
```

**Response**:
```typescript
interface RepositoryItemClientDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  content?: string;       // for notes
  fileUrl?: string;       // for media
  fileSize?: number;
  fileType?: string;
  folderId?: string;
  tags: string[];
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<RepositoryItemClientDTO>
```

---

### GET /repository/:id
Retrieve a repository item.

**Response**: `ApiResponse<RepositoryItemClientDTO>`

---

### GET /repository
List repository items with search and filtering.

**Query Parameters**:
```typescript
interface ListRepositoryQuery {
  page?: number;
  limit?: number;
  type?: string;          // filter by type
  folderId?: string;      // filter by folder
  tags?: string[];        // filter by tags
  search?: string;        // full-text search
  sortBy?: 'updatedAt' | 'createdAt' | 'title';
}
```

**Response**:
```typescript
interface ListRepositoryRes {
  data: RepositoryItemClientDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Response: ApiResponse<ListRepositoryRes>
```

---

### PATCH /repository/:id
Update repository item.

**Request**:
```typescript
interface UpdateRepositoryItemReq {
  title?: string;
  content?: string;       // for notes only
  folderId?: string;
  tags?: string[];
}
```

**Response**: `ApiResponse<RepositoryItemClientDTO>`

---

### DELETE /repository/:id
Delete a repository item (soft delete).

**Response**: `ApiResponse<RepositoryItemClientDTO>`

---

## 7. Note/Editor Module

### POST /notes
Create or open a note in the editor.

**Request**:
```typescript
interface CreateNoteReq {
  title: string;
  markdown?: string;      // default: empty
  autosaveIntervalSec?: number; // 10-3600, default: 60
}
```

**Response**:
```typescript
interface NoteClientDTO {
  id: string;
  userId: string;
  repositoryItemId?: string;
  title: string;
  markdown: string;
  autosaveIntervalSec?: number;
  lastSavedAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<NoteClientDTO>
```

---

### GET /notes/:id
Retrieve note for editing.

**Response**: `ApiResponse<NoteClientDTO>`

---

### PUT /notes/:id
Save note content (explicit save).

**Request**:
```typescript
interface SaveNoteReq {
  title: string;
  markdown: string;
  autosaveIntervalSec?: number;
}
```

**Response**: `ApiResponse<NoteClientDTO>`

---

### PATCH /notes/:id/autosave
Autosave note content (called by frontend at intervals).

**Request**:
```typescript
interface AutosaveNoteReq {
  markdown: string;
}
```

**Response**: `ApiResponse<{ lastSavedAt: ISO8601DateTime }>`

---

## 8. Notification Module

### GET /notifications
List notifications for current user.

**Query Parameters**:
```typescript
interface ListNotificationsQuery {
  page?: number;
  limit?: number;
  status?: 'unread' | 'read' | 'archived'; // default: 'unread'
  type?: string;
  sortBy?: 'createdAt'; // default: 'createdAt'
  sortOrder?: 'desc';   // default: 'desc'
}
```

**Response**:
```typescript
interface NotificationClientDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  resourceType?: string;
  resourceId?: string;
  status: string;
  sentAt?: ISO8601DateTime;
  readAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
}

interface ListNotificationsRes {
  data: NotificationClientDTO[];
  pagination: { ... };
  unreadCount: number;
}

// Response: ApiResponse<ListNotificationsRes>
```

---

### PATCH /notifications/:id
Mark notification as read or archive.

**Request**:
```typescript
interface UpdateNotificationReq {
  status: 'read' | 'archived';
}
```

**Response**: `ApiResponse<NotificationClientDTO>`

---

### DELETE /notifications/:id
Delete notification (soft delete).

**Response**: `ApiResponse<NotificationClientDTO>`

---

## 9. Schedule Module

### POST /schedule
Create a calendar event or link existing item.

**Request**:
```typescript
interface CreateScheduleItemReq {
  type: 'event' | 'goal' | 'task' | 'reminder';
  sourceId?: string;      // for linking existing items
  title?: string;         // required for type='event'
  startAt: ISO8601DateTime;
  endAt?: ISO8601DateTime;
  allDay?: boolean;
}
```

**Response**:
```typescript
interface ScheduleItemClientDTO {
  id: string;
  userId: string;
  type: string;
  sourceId?: string;
  title: string;
  startAt: ISO8601DateTime;
  endAt?: ISO8601DateTime;
  allDay: boolean;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<ScheduleItemClientDTO>
```

---

### GET /schedule
List schedule items for a date range.

**Query Parameters**:
```typescript
interface ListScheduleQuery {
  startDate: ISO8601Date; // required
  endDate: ISO8601Date;   // required
  type?: string;          // filter by type
  sortBy?: 'startAt';     // default: 'startAt'
}
```

**Response**:
```typescript
interface ListScheduleRes {
  data: ScheduleItemClientDTO[];
}

// Response: ApiResponse<ListScheduleRes>
```

---

## 10. Settings Module

### GET /settings
Retrieve user settings.

**Response**:
```typescript
interface SettingsClientDTO {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'zh-CN';
  editorAutosaveSec: number;
  markdownFlavor: 'commonmark' | 'gfm';
  syntaxHighlight: boolean;
  repoView: 'list' | 'grid';
  repoSort: 'updated_at' | 'created_at' | 'title';
  notificationChannels: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Response: ApiResponse<SettingsClientDTO>
```

---

### PATCH /settings
Update user settings.

**Request**:
```typescript
interface UpdateSettingsReq {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'en' | 'zh-CN';
  editorAutosaveSec?: number;
  markdownFlavor?: 'commonmark' | 'gfm';
  syntaxHighlight?: boolean;
  repoView?: 'list' | 'grid';
  repoSort?: 'updated_at' | 'created_at' | 'title';
  notificationChannels?: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}
```

**Response**: `ApiResponse<SettingsClientDTO>`

---

## Common Error Responses

All endpoints may return these error codes:

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Validation failed",
  "data": null,
  "error": {
    "type": "ValidationError",
    "details": {
      "title": ["must be between 1 and 200 chars"],
      "dueAt": ["invalid date format"]
    }
  }
}
```

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Authentication required",
  "data": null,
  "error": {
    "type": "AuthenticationError"
  }
}
```

### 403 Forbidden
```json
{
  "code": 403,
  "message": "Access denied",
  "data": null,
  "error": {
    "type": "AuthorizationError"
  }
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Resource not found",
  "data": null,
  "error": {
    "type": "NotFoundError",
    "details": {
      "resource": "Goal",
      "id": "uuid-here"
    }
  }
}
```

### 409 Conflict
```json
{
  "code": 409,
  "message": "Resource already exists",
  "data": null,
  "error": {
    "type": "ConflictError",
    "details": {
      "field": "email",
      "value": "user@example.com"
    }
  }
}
```

### 429 Too Many Requests
```json
{
  "code": 429,
  "message": "Rate limit exceeded",
  "data": null,
  "error": {
    "type": "RateLimitError",
    "details": {
      "retryAfter": 60
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "code": 500,
  "message": "Internal server error",
  "data": null,
  "error": {
    "type": "InternalError"
  }
}
```

---

## Summary Table

| Module | Endpoints | Auth Required |
|--------|-----------|---------------|
| Auth | signup, login, logout, refresh | varies |
| Goal | create, read, update, delete, list | yes |
| Key Result | create, read, update, list | yes |
| Task | create, read, update, delete, list | yes |
| Reminder | create, read, update, delete, list | yes |
| Repository | create, read, update, delete, list, search | yes |
| Note | create, read, update, autosave, delete | yes |
| Notification | list, mark-read, delete | yes |
| Schedule | create, read, list | yes |
| Settings | read, update | yes |

