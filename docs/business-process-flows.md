# DailyUse Business Process Flows

**Generated:** 2026-02-06
**Purpose:** Detailed business process flows based on refactored contract and domain layers
**Architecture:** Event-driven DDD with typed EventBus

---

## Table of Contents

1. [Core Integration Patterns](#core-integration-patterns)
2. [Process Flow 1: OKR Lifecycle (Goal → KeyResult → Task)](#process-flow-1-okr-lifecycle)
3. [Process Flow 2: Task Execution Pipeline (Template → Instance → Schedule)](#process-flow-2-task-execution-pipeline)
4. [Process Flow 3: Focus Session → Goal Progress](#process-flow-3-focus-session-goal-progress)
5. [Process Flow 4: Reminder → Notification Delivery](#process-flow-4-reminder-notification-delivery)
6. [Process Flow 5: User Authentication & Session](#process-flow-5-user-authentication-session)
7. [Process Flow 6: Sync & Conflict Resolution](#process-flow-6-sync-conflict-resolution)
8. [Cross-Module Event Matrix](#cross-module-event-matrix)
9. [Implementation Recommendations](#implementation-recommendations)

---

## Core Integration Patterns

### Event Bus Architecture

All cross-module communication uses `CrossPlatformEventBus`:

```typescript
// Type-safe event emission
eventBus.send('goal:complete', { goalId: '...' });

// Type-safe event subscription
eventBus.on('goal:complete', async (event) => {
  // event is typed as GoalCompletedEvent
});

// RPC for request-response
const result = await eventBus.invoke('goal:get', { id: '...' });
```

### Result Pattern

All operations return `Result<T, E>` for protocol-agnostic error handling:

```typescript
const result = await goalService.complete(goalId);
if (isOk(result)) {
  // Success path
} else {
  // Error path with typed error
}
```

### ScheduleTask as Cross-Module Scheduler

`ScheduleTask` links to any source module via:
- `sourceModule`: 'goal' | 'task' | 'reminder' | ...
- `sourceEntityId`: ID of the source entity

When schedule executes, it emits `schedule:task-execute` with `sourceModule` and `sourceEntityId` for the target module to handle.

---

## Process Flow 1: OKR Lifecycle

### Overview

User creates Goals (Objectives) → Breaks into Key Results → Links Tasks → Tracks Progress

### Detailed Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      OKR LIFECYCLE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

[User Action]          [Domain Operation]           [Events Emitted]
     │                        │                           │
     ▼                        ▼                           ▼
Create Goal      ──►   Goal.create()           ──►   'goal:create'
     │                        │                           │
     │                        │                           ▼
     │                        │               ┌──────────────────────┐
     │                        │               │ Event Handlers:      │
     │                        │               │ • GoalFolder.addGoal │
     │                        │               │ • Statistics.update  │
     │                        │               └──────────────────────┘
     │
     ▼
Add Key Result   ──►   Goal.addKeyResult()     ──►   'goal:key-result-add'
     │                        │                           │
     │                        │                           ▼
     │                        │               ┌──────────────────────┐
     │                        │               │ Event Handlers:      │
     │                        │               │ • Progress.recalc    │
     │                        │               │ • TaskLink.suggest   │
     │                        │               └──────────────────────┘
     │
     ▼
Link Task        ──►   KeyResult.linkTask()    ──►   [Internal Update]
(Optional)                    │
     │                        │
     ▼                        ▼
Update KR        ──►   KeyResult.update()      ──►   'goal:key-result-update'
Progress                      │                           │
     │                        │                           ▼
     │                        ▼               ┌──────────────────────┐
     │              Goal.recalcProgress()     │ Event Handlers:      │
     │                        │               │ • Goal.updateProgress│
     │                        │               │ • CheckCompletion    │
     │                        ▼               └──────────────────────┘
     │              (if all KRs complete)
     ▼                        ▼
Complete Goal    ──►   Goal.complete()         ──►   'goal:complete'
                              │                           │
                              │                           ▼
                              │               ┌──────────────────────┐
                              │               │ Event Handlers:      │
                              │               │ • Achievement.check  │
                              │               │ • Notification.send  │
                              │               │ • Statistics.update  │
                              │               │ • Folder.statsUpdate │
                              │               └──────────────────────┘
```

### State Transitions

```
Goal States:
  DRAFT ──► ACTIVE ──► COMPLETED
                   └──► ARCHIVED
                   └──► CANCELLED

KeyResult States:
  PENDING ──► IN_PROGRESS ──► COMPLETED
                          └──► CANCELLED
```

### Application Service Implementation

```typescript
// packages/application-server/src/goal/services/goal-application.service.ts
class GoalApplicationService {
  async createGoal(command: CreateGoalCommand): Promise<Result<GoalServerDTO, DomainError>> {
    // 1. Create aggregate
    const goal = Goal.create(command);

    // 2. Persist
    const saved = await this.goalRepository.save(goal);
    if (!isOk(saved)) return saved;

    // 3. Dispatch domain events
    const events = goal.pullDomainEvents();
    for (const event of events) {
      eventBus.send(event.eventType, event.payload);
    }

    return ok(goal.toServerDTO());
  }
}
```

### Event Subscriptions Required

| Event | Subscriber Module | Handler Action |
|-------|-------------------|----------------|
| `goal:create` | Statistics | Increment goal count |
| `goal:create` | GoalFolder | Add to folder if specified |
| `goal:key-result-add` | Goal | Recalculate progress |
| `goal:key-result-update` | Goal | Recalculate progress, check completion |
| `goal:complete` | Notification | Send completion notification |
| `goal:complete` | Statistics | Update completion stats |
| `goal:complete` | Achievement | Check achievement criteria |

---

## Process Flow 2: Task Execution Pipeline

### Overview

TaskTemplate (reusable definition) → TaskInstance (specific occurrence) → ScheduleTask (execution)

### Detailed Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 TASK EXECUTION PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘

[User Action]          [Domain Operation]           [Events Emitted]
     │                        │                           │
     ▼                        ▼                           ▼
Create Template  ──►   TaskTemplate.create()    ──►   [template:create]
     │                        │
     │               ┌────────┴────────┐
     │               │ If recurring:   │
     │               │ isRecurring=true│
     │               └────────┬────────┘
     │                        │
     ▼                        ▼
[System: Daily]  ──►   TaskInstanceGeneration   ──►   'task:create' (batch)
                       Service.generate()
                              │
                              ▼
                    ┌─────────────────────┐
                    │ For each instance:  │
                    │ 1. Create instance  │
                    │ 2. Create schedule  │
                    └─────────┬───────────┘
                              │
                              ▼
                       ScheduleTask.create()    ──►   'schedule:task-create'
                       (sourceModule: 'task',
                        sourceEntityId: instanceId)
                              │
                              │
                              ▼
[At Scheduled    ──►   ScheduleTask.execute()   ──►   'schedule:task-execute'
 Time]                        │                  {sourceModule: 'task',
                              │                   sourceEntityId: '...'}
                              ▼
                    ┌─────────────────────────────────┐
                    │ TaskModule handles execution:   │
                    │ 1. Load TaskInstance            │
                    │ 2. Check preconditions          │
                    │ 3. Notify user (reminder)       │
                    └─────────────────────────────────┘
                              │
                              ▼
[User Action]    ──►   TaskInstance.complete()  ──►   'task:complete'
                              │                  {goalId: '...'}
                              │
                              ▼
                    ┌─────────────────────────────────┐
                    │ Cross-Module Event Handlers:    │
                    │ • Statistics.recordCompletion   │
                    │ • Goal.updateLinkedKRProgress   │
                    │ • Achievement.checkCriteria     │
                    │ • Schedule.markCompleted        │
                    └─────────────────────────────────┘
```

### Recurrence Patterns

```typescript
// RecurrenceRule value object patterns
RecurrenceRule.createDaily(1)       // Every day
RecurrenceRule.createWeekly([1,3,5]) // Mon, Wed, Fri
RecurrenceRule.createMonthly(15)     // 15th of each month
RecurrenceRule.createCustom({...})   // Custom cron
```

### Task Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                 TASK DEPENDENCY FLOW                             │
└─────────────────────────────────────────────────────────────────┘

TaskA (blocks TaskB)
     │
     ▼
TaskA.complete()  ──►  'task:complete'
                              │
                              ▼
                 TaskDependencyService.onTaskComplete()
                              │
                              ▼
                 Find all tasks blocked by TaskA
                              │
                              ▼
                 TaskB.removeBlock(TaskA.id)
                              │
                              ▼
                 If no more blocks:
                    TaskB.setStatus(PENDING → READY)
```

### ScheduleTask Integration

```typescript
// Creating schedule for task instance
const scheduleTask = ScheduleTask.create({
  name: `Task: ${taskInstance.name}`,
  sourceModule: 'task',
  sourceEntityId: taskInstance.id,
  schedule: {
    cronExpression: taskInstance.scheduledAt.toCron(),
    timezone: userPreferences.timezone,
  },
  execution: {
    maxExecutions: 1,
  },
  metadata: {
    priority: taskInstance.priority,
    tags: ['task-instance'],
  }
});
```

---

## Process Flow 3: Focus Session → Goal Progress

### Overview

Focus sessions (Pomodoro technique) linked to Goals update progress and statistics.

### Detailed Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              FOCUS SESSION → GOAL PROGRESS                       │
└─────────────────────────────────────────────────────────────────┘

[User Action]          [Domain Operation]           [Events Emitted]
     │                        │                           │
     ▼                        ▼                           ▼
Start Session    ──►   FocusSession.start()     ──►   'goal:focus-session-start'
(linked to Goal)       {goalId, duration}
     │                        │
     │                        ▼
     │               FocusSessionDomainService
     │               .validateStart()
     │                        │
     │                        ▼
     │               Create timer
     │                        │
[User Pauses]    ──►   FocusSession.pause()     ──►   'goal:focus-session-pause'
     │                        │
     │                        ▼
     │               Record pausedDurationMs
     │                        │
[User Resumes]   ──►   FocusSession.resume()    ──►   'goal:focus-session-resume'
     │                        │
     │                        ▼
     │               Resume timer
     │                        │
[Timer Ends]     ──►   FocusSession.complete()  ──►   'goal:focus-session-complete'
     │                        │                   {duration: ms}
     │                        │
     │                        ▼
     │               ┌─────────────────────────────────┐
     │               │ Event Handler Chain:            │
     │               │                                 │
     │               │ 1. GoalProgressService          │
     │               │    .recordFocusTime(goalId, ms) │
     │               │                                 │
     │               │ 2. Goal.addFocusedTime(ms)      │
     │               │    → Recalculate progress       │
     │               │                                 │
     │               │ 3. Emit 'goal:statistics-       │
     │               │    recalculate'                 │
     │               │                                 │
     │               │ 4. Client receives event        │
     │               │    → Pinia store updates        │
     │               │    → UI refreshes               │
     │               └─────────────────────────────────┘
     │
[User Cancels]   ──►   FocusSession.cancel()    ──►   'goal:focus-session-cancel'
                       (no progress recorded)
```

### Focus Mode Integration

```typescript
// FocusMode defines session presets
const FocusModes = {
  POMODORO: { workMinutes: 25, breakMinutes: 5 },
  DEEP_WORK: { workMinutes: 90, breakMinutes: 15 },
  QUICK_FOCUS: { workMinutes: 15, breakMinutes: 3 },
};

// Domain service validates session
class FocusSessionDomainService {
  validateStart(session: FocusSession): Result<void, DomainError> {
    // Check if another session is active
    // Validate duration against focus mode
    // Validate goal exists and is active
  }

  calculateStatistics(sessions: FocusSession[]): FocusStatistics {
    // Total focus time
    // Average session duration
    // Completion rate
    // Streak count
  }
}
```

### Real-time UI Update Path

```
Server                                    Client
  │                                          │
  ▼                                          │
FocusSession.complete()                      │
  │                                          │
  ▼                                          │
eventBus.send('goal:focus-                   │
  session-complete', {...})                  │
  │                                          │
  ▼                                          │
WebSocket/SSE broadcast   ──────────────►    │
  │                                          ▼
  │                               eventBus.on('goal:focus-
  │                                 session-complete', ...)
  │                                          │
  │                                          ▼
  │                               goalStore.handleFocusComplete()
  │                                          │
  │                                          ▼
  │                               Reactive UI update
```

---

## Process Flow 4: Reminder → Notification Delivery

### Overview

Reminder templates trigger notifications through multiple channels with smart frequency adjustment.

### Detailed Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              REMINDER → NOTIFICATION PIPELINE                    │
└─────────────────────────────────────────────────────────────────┘

[Setup Phase]          [Domain Operation]           [Result]
     │                        │                        │
     ▼                        ▼                        ▼
Create Reminder  ──►   ReminderTemplate.create()
Template                      │
     │                        ▼
     │               ScheduleTask.create({
     │                 sourceModule: 'reminder',
     │                 sourceEntityId: templateId,
     │                 cronExpression: trigger.cron
     │               })
     │                        │
     │                        ▼
     │               'schedule:task-create'
     │
     │
[Execution Phase - At Scheduled Time]
     │
     ▼
ScheduleTask     ──►   'schedule:task-execute'
.execute()             {sourceModule: 'reminder',
     │                  sourceEntityId: templateId}
     │
     ▼
ReminderModule   ──►   ReminderSchedulingService
handles event          .processScheduledReminder()
     │                        │
     │                        ▼
     │               ┌─────────────────────────────────┐
     │               │ Pre-execution Checks:           │
     │               │ 1. Is within active time?       │
     │               │ 2. Is within active hours?      │
     │               │ 3. Is not in DND period?        │
     │               │ 4. User preferences allow?      │
     │               └─────────────────────────────────┘
     │                        │
     │                        ▼
     │               If checks pass:
     │               Notification.create({
     │                 sourceModule: 'reminder',
     │                 sourceEntityId: templateId,
     │                 channels: template.notificationConfig.channels,
     │                 content: template.content
     │               })
     │                        │
     │                        ▼
     │               'notification:create'
     │                        │
     ▼                        ▼
[Delivery]       ──►   NotificationDeliveryService
                       .deliver(notification)
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                 EMAIL      PUSH     IN-APP
                    │         │         │
                    ▼         ▼         ▼
               'notification:send' (per channel)
                              │
                              ▼
                    ┌─────────────────────────────────┐
                    │ On failure:                     │
                    │ 'notification:channel-failed'   │
                    │ → Retry with backoff            │
                    │ → Fallback to next channel      │
                    └─────────────────────────────────┘
                              │
                              ▼
[User Response]  ──►   ReminderHistoryService
                       .recordResponse({
                         action: 'clicked' | 'ignored' | 'snoozed',
                         responseTime: ms
                       })
                              │
                              ▼
                       'reminder:trigger'
                       (recorded for analytics)
                              │
                              ▼
                       ┌─────────────────────────────────┐
                       │ Smart Frequency Adjustment:     │
                       │                                 │
                       │ If clickRate < threshold:       │
                       │   → Increase interval           │
                       │   → Record adjustment reason    │
                       │                                 │
                       │ If ignoreRate > threshold:      │
                       │   → Decrease frequency          │
                       │   → Suggest reminder changes    │
                       └─────────────────────────────────┘
```

### Smart Frequency Algorithm

```typescript
class SmartFrequencyService {
  adjustFrequency(stats: ReminderStats): FrequencyAdjustment {
    const { clickRate, ignoreRate, avgResponseTime, snoozeCount } = stats;

    // Calculate effectiveness score (0-100)
    const effectivenessScore = calculateEffectiveness(stats);

    if (effectivenessScore < 30) {
      // Low effectiveness: reduce frequency
      return {
        originalInterval: stats.currentInterval,
        adjustedInterval: stats.currentInterval * 1.5,
        adjustmentReason: 'LOW_EFFECTIVENESS',
        isAutoAdjusted: true,
        userConfirmed: false,
      };
    }

    if (snoozeCount > 3) {
      // Frequent snoozing: shift time window
      return {
        ...stats,
        suggestedTimeShift: calculateOptimalTime(stats),
        adjustmentReason: 'FREQUENT_SNOOZE',
      };
    }

    // No adjustment needed
    return null;
  }
}
```

### Notification Channel Fallback

```
Primary Channel          Fallback 1           Fallback 2
     │                       │                    │
     ▼                       ▼                    ▼
  PUSH    ───[fail]───►   EMAIL   ───[fail]───►  IN-APP
     │                       │                    │
     │                       │                    ▼
     │                       │              Always delivered
     │                       │              (last resort)
     │                       │
     ▼                       ▼
 Success               Success
```

---

## Process Flow 5: User Authentication & Session

### Overview

User registration, login, session management, and multi-credential support.

### Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

[User Action]          [Domain Operation]           [Events Emitted]
     │                        │                           │
     ▼                        ▼                           ▼
Submit           ──►   AuthenticationService
Registration           .register(email, password)
     │                        │
     │                        ▼
     │               ┌─────────────────────────────────┐
     │               │ 1. Validate email uniqueness    │
     │               │ 2. Validate password strength   │
     │               │    (PlainPassword.checkStrength)│
     │               │ 3. Hash password                │
     │               │    (HashedPassword.create)      │
     │               └─────────────────────────────────┘
     │                        │
     │                        ▼
     │               Identity.create({...})
     │                        │
     │                        ▼
     │               'auth:user-register'
     │                        │
     │                        ▼
     │               Account.create({...})    ──►   'account:create'
     │                        │
     │                        ▼
     │               Create initial settings
     │               Create sync profile
     │               Create AI quota
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       LOGIN FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

[User Action]          [Domain Operation]           [Security Check]
     │                        │                           │
     ▼                        ▼                           ▼
Submit Login     ──►   AuthenticationService
                       .login(email, password)
     │                        │
     │                        ▼
     │               ┌─────────────────────────────────┐
     │               │ BRUTE-FORCE PROTECTION:         │
     │               │                                 │
     │               │ Check failed attempts:          │
     │               │ • ≥5 failed in 15 min?          │
     │               │   → LOCK ACCOUNT                │
     │               │   → Return "Account locked"     │
     │               │                                 │
     │               │ If not locked:                  │
     │               │ • Find Identity by email        │
     │               │ • Verify password               │
     │               │ • Check Identity.status=ACTIVE  │
     │               └─────────────────────────────────┘
     │                        │
     │                        ▼
     │               [Password Correct?]
     │               ┌────────┴────────┐
     │               │                 │
     │               ▼                 ▼
     │             YES                NO
     │               │                 │
     │               ▼                 ▼
     │         AuthSession       RecordFailedAttempt
     │         .create({         Return "Invalid credentials"
     │           deviceInfo,
     │           expiresAt: +7 days
     │         })
     │               │
     │               ▼
     │         'auth:user-login'
     │               │
     │               ▼
     │         'auth:session-create'
     │               │
     │               ▼
     │         Return {
     │           accessToken,
     │           refreshToken,
     │           expiresAt
     │         }
```

### Session Management

```
┌─────────────────────────────────────────────────────────────────┐
│                 SESSION LIFECYCLE                                │
└─────────────────────────────────────────────────────────────────┘

Session Creation
     │
     ▼
AuthSession.create()  ──►  'auth:session-create'
     │                     {sessionId, deviceInfo}
     │
     ├─────────────────────────────────────────┐
     │                                         │
     ▼                                         ▼
[Normal Access]                          [Sliding Window]
     │                                         │
     ▼                                         ▼
Validate session                        If lastAccessAt + 1hr < now:
on each request                           session.extendExpiration()
     │
     │
[Session Expiry]                        [Manual Logout]
     │                                         │
     ▼                                         ▼
Session.isExpired()=true               AuthSession.revoke()
     │                                         │
     ▼                                         ▼
'auth:session-invalidate'              'auth:session-revoke'
     │                                         │
     ▼                                         ▼
Clear client tokens                    'auth:user-logout'
```

### Multi-Credential Support

```typescript
// Identity can have multiple credentials
const identity = await identityRepository.findById(identityId);

// Check credential types
identity.hasCredential('password');  // true
identity.hasCredential('oauth:google');  // true
identity.hasCredential('phone');  // false

// Add OAuth credential
identity.addOAuthCredential({
  provider: 'google',
  providerId: 'google-user-id',
  email: 'user@gmail.com',
});
// Emits: 'auth:identity-provider-connected'

// Remove credential (with validation)
identity.removeCredential('password');
// Error if it's the last credential!
// Must keep at least 1 credential
```

---

## Process Flow 6: Sync & Conflict Resolution

### Overview

Offline-first sync with conflict detection and resolution strategies.

### Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNC FLOW                                     │
└─────────────────────────────────────────────────────────────────┘

[Client Offline]
     │
     ▼
Local changes stored
in PendingChanges queue
     │
     │
[Client Online]
     │
     ▼
SyncService.pushChanges()
     │
     ▼
For each PendingChange:
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ CONFLICT DETECTION                                               │
│                                                                  │
│ detectConflict(clientChange, serverData, serverMetadata)         │
│                                                                  │
│ Returns SyncConflict if:                                         │
│ • serverVersion > clientBaseVersion                              │
│ • serverModifiedAt > clientModifiedAt                            │
│ • Fields modified on both sides differ                           │
└─────────────────────────────────────────────────────────────────┘
     │
     ├──────────────────────┐
     │                      │
     ▼                      ▼
[No Conflict]         [Conflict Detected]
     │                      │
     ▼                      ▼
Apply change         ┌─────────────────────────────────────────┐
directly             │ CONFLICT RESOLUTION STRATEGIES:         │
     │               │                                         │
     │               │ 1. ClientWins                           │
     │               │    → Use client data                    │
     │               │    → Overwrite server                   │
     │               │                                         │
     │               │ 2. ServerWins                           │
     │               │    → Use server data                    │
     │               │    → Discard client changes             │
     │               │                                         │
     │               │ 3. LastWriteWins                        │
     │               │    → Compare timestamps                 │
     │               │    → Use most recent                    │
     │               │                                         │
     │               │ 4. Manual                               │
     │               │    → Present both versions to user      │
     │               │    → User chooses resolution            │
     │               └─────────────────────────────────────────┘
     │                      │
     ▼                      ▼
SyncMetadata.update   resolveConflict(conflict, strategy)
     │                      │
     ▼                      ▼
Return success       Return merged data
```

### Sync Metadata Tracking

```typescript
interface SyncMetadata {
  version: number;           // Incrementing version counter
  lastModifiedAt: number;    // Epoch ms timestamp
  lastSyncedAt: number;      // Last successful sync
  deviceId: string;          // Originating device
  checksum?: string;         // Optional content hash
}

// Every synced entity includes:
interface SyncableEntity {
  id: string;
  data: EntityData;
  syncMetadata: SyncMetadata;
}
```

### Conflict Resolution Example

```typescript
const conflict = detectConflict(clientChange, serverData, serverMetadata);

if (conflict) {
  // For non-critical data: auto-resolve
  if (conflict.entityType === 'task-instance') {
    const resolved = resolveConflict(conflict, 'LastWriteWins');
    return applyResolution(resolved);
  }

  // For critical data: prompt user
  if (conflict.entityType === 'goal') {
    // Store conflict for user resolution
    await syncConflictRepository.save(conflict);

    // Notify user
    eventBus.send('sync:conflict-detected', {
      conflictId: conflict.id,
      entityType: conflict.entityType,
      summary: formatConflictSummary(conflict),
    });

    return pending(conflict.id);
  }
}
```

---

## Cross-Module Event Matrix

### Event Producers and Consumers

| Event | Producer | Consumers | Purpose |
|-------|----------|-----------|---------|
| `goal:create` | Goal Module | Statistics, Folder | Track goal count |
| `goal:complete` | Goal Module | Notification, Achievement, Statistics | Celebrate & record |
| `goal:key-result-update` | Goal Module | Goal (progress calc) | Recalc progress |
| `goal:focus-session-complete` | Goal Module | Goal (time tracking), Statistics | Track focus time |
| `goal:statistics-recalculate` | Goal Module | Client (Pinia) | UI refresh |
| `task:create` | Task Module | Schedule (create job) | Schedule task |
| `task:complete` | Task Module | Goal (KR progress), Statistics, Achievement | Update linked goals |
| `task:reschedule` | Task Module | Schedule (update job) | Reschedule execution |
| `schedule:task-execute` | Schedule Module | Task/Reminder (handle) | Trigger execution |
| `schedule:task-fail` | Schedule Module | Alert, Retry Service | Handle failure |
| `reminder:trigger` | Reminder Module | Statistics (track response) | Track effectiveness |
| `notification:create` | Notification Module | Delivery Service | Send to channels |
| `notification:send` | Notification Module | History | Record delivery |
| `notification:channel-failed` | Notification Module | Retry, Fallback | Handle failure |
| `auth:user-login` | Auth Module | Session, Audit | Create session, log |
| `auth:session-create` | Auth Module | Account (last login) | Track logins |
| `sync:conflict-detected` | Sync Module | UI (show resolution) | User resolution |

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CROSS-MODULE EVENT FLOW                       │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │    AUTH     │──────► Session/Audit
    └─────────────┘
           │
           ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   ACCOUNT   │◄────►│    GOAL     │◄────►│    TASK     │
    └─────────────┘      └─────────────┘      └─────────────┘
                               │                    │
                               │                    │
                               ▼                    ▼
                        ┌─────────────┐      ┌─────────────┐
                        │   SCHEDULE  │◄────►│  REMINDER   │
                        └─────────────┘      └─────────────┘
                               │                    │
                               │                    │
                               ▼                    ▼
                        ┌───────────────────────────────┐
                        │         NOTIFICATION          │
                        └───────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────────┐
                        │         STATISTICS            │
                        └───────────────────────────────┘
```

---

## Implementation Recommendations

### 1. Application Service Layer (Priority: HIGH)

Create application services that orchestrate domain operations and dispatch events:

```typescript
// packages/application-server/src/goal/goal-application.service.ts
@Injectable()
export class GoalApplicationService {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly eventBus: CrossPlatformEventBus,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async createGoal(command: CreateGoalCommand): Promise<Result<GoalServerDTO, DomainError>> {
    return this.unitOfWork.execute(async () => {
      // 1. Create domain aggregate
      const goal = Goal.create(command);

      // 2. Persist
      await this.goalRepository.save(goal);

      // 3. Dispatch domain events
      this.dispatchEvents(goal.pullDomainEvents());

      // 4. Return DTO
      return ok(goal.toServerDTO());
    });
  }

  private dispatchEvents(events: DomainEvent[]): void {
    for (const event of events) {
      this.eventBus.send(event.eventType, event.payload);
    }
  }
}
```

### 2. Event Handler Registration (Priority: HIGH)

Register cross-module event handlers at application startup:

```typescript
// packages/application-server/src/event-handlers/index.ts

// Goal → Statistics
eventBus.on('goal:create', (event) => statisticsService.incrementGoalCount(event.identityId));
eventBus.on('goal:complete', (event) => statisticsService.recordGoalCompletion(event));

// Task → Goal
eventBus.on('task:complete', (event) => {
  if (event.goalId) {
    goalService.updateKeyResultProgress(event.goalId, event.taskId);
  }
});

// Reminder → Notification
eventBus.on('reminder:trigger', (event) => notificationService.createFromReminder(event));

// Schedule → Module Routing
eventBus.on('schedule:task-execute', (event) => {
  const handler = moduleRouterMap[event.sourceModule];
  handler?.handleScheduledExecution(event);
});
```

### 3. Repository Implementations (Priority: HIGH)

Implement domain repository interfaces with Prisma:

```typescript
// packages/infrastructure-server/src/goal/goal.repository.ts
@Injectable()
export class GoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: GoalId): Promise<Result<Goal | null, DomainError>> {
    const data = await this.prisma.goal.findUnique({
      where: { id },
      include: { keyResults: true, reviews: true },
    });

    if (!data) return ok(null);

    return ok(Goal.fromPersistenceDTO(data));
  }

  async save(goal: Goal): Promise<Result<void, DomainError>> {
    const dto = goal.toPersistenceDTO();
    await this.prisma.goal.upsert({
      where: { id: dto.id },
      create: dto,
      update: dto,
    });
    return ok(undefined);
  }
}
```

### 4. RPC Handler Registration (Priority: MEDIUM)

Register RPC handlers for request-response operations:

```typescript
// Goal RPC handlers
eventBus.handle('goal:get', async (params) => {
  const goal = await goalRepository.findById(params.id);
  return goal.toServerDTO();
});

eventBus.handle('goal:list', async (params) => {
  const goals = await goalRepository.findByIdentity(params.identityId, params.filters);
  return goals.map(g => g.toServerDTO());
});
```

### 5. Scheduled Job Runner (Priority: MEDIUM)

Implement the schedule execution engine:

```typescript
// packages/infrastructure-server/src/schedule/schedule-runner.service.ts
@Injectable()
export class ScheduleRunnerService {
  private readonly scheduler: NodeScheduler;

  async startAll(): Promise<void> {
    const activeTasks = await this.scheduleTaskRepository.findActive();

    for (const task of activeTasks) {
      this.scheduleJob(task);
    }
  }

  private scheduleJob(task: ScheduleTask): void {
    this.scheduler.schedule(task.schedule.cronExpression, async () => {
      const executionId = ScheduleExecutionId.generate();

      try {
        // Emit execution event
        eventBus.send('schedule:task-execute', {
          scheduleTaskId: task.id,
          executionId,
          sourceModule: task.sourceModule,
          sourceEntityId: task.sourceEntityId,
          status: 'started',
          duration: 0,
        });

        // Let source module handle
        // The source module's event handler will process

      } catch (error) {
        eventBus.send('schedule:task-fail', {
          scheduleTaskId: task.id,
          sourceModule: task.sourceModule,
          sourceEntityId: task.sourceEntityId,
          error: error.message,
          consecutiveFailures: task.execution.consecutiveFailures + 1,
        });
      }
    });
  }
}
```

### 6. Client Event Bridge (Priority: MEDIUM)

Bridge server events to client via WebSocket/SSE:

```typescript
// Server: Forward events to client
const clientEvents = ['goal:create', 'goal:update', 'goal:complete', 'goal:statistics-recalculate'];

for (const eventName of clientEvents) {
  eventBus.on(eventName, (payload) => {
    websocketServer.broadcast(payload.identityId, {
      type: eventName,
      payload,
    });
  });
}

// Client: Receive and dispatch locally
websocket.onMessage((message) => {
  eventBus.send(message.type, message.payload);
});
```

---

## Next Steps

1. **Infrastructure Layer** - Implement repository interfaces with Prisma
2. **Application Services** - Create orchestration services for each module
3. **Event Handlers** - Register cross-module event subscriptions
4. **API Controllers** - Map HTTP routes to application services
5. **Pinia Stores** - Implement client state management with event subscriptions
6. **Testing** - Integration tests for event flows

---

*Document generated as part of BMAD analyst workflow*
