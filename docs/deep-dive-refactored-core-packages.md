# Deep-Dive: Refactored Core Packages

**Generated:** 2026-02-06
**Scan Level:** Exhaustive
**Target Packages:** contracts, domain-shared, domain-server, domain-client, utils
**Purpose:** Understanding refactored layers for designing business process flows

---

## Executive Summary

DailyUse follows a **Domain-Driven Design (DDD)** architecture with clear layer separation. The core packages form a dependency hierarchy:

```
contracts (types/schemas)
    ↓
domain-shared (shared value objects)
    ↓
utils (DDD base classes, event bus)
    ↓
domain-server ←→ domain-client (layer-specific implementations)
```

The refactored packages provide a solid foundation for implementing business process flows through:
- **Typed event-driven architecture** with `EventBus` + typed registries
- **Result pattern** for protocol-agnostic operation results
- **Three-layer DTO pattern** (Domain → Transfer → Persistence)
- **Branded ID types** for type-safe entity references

---

## Package Overview

### 1. @dailyuse/contracts

**Purpose:** Type definitions, Zod schemas, and protocol contracts

**Key Exports:**
- `Result<T, E>` - Protocol-agnostic result type (inspired by Rust Result)
- Module sub-paths for tree-shaking: `/goal`, `/task`, `/schedule`, `/reminder`, etc.
- Branded ID types in `/primitives`
- Event and RPC maps in each module's `/protocol`

**Structure per module:**
```
modules/{module}/
├── aggregates/     # *ServerDTO, *ClientDTO, *PersistenceDTO, *Server, *Client
├── entities/       # Entity DTOs
├── value-objects/  # Enums, branded types
├── protocol/       # EventMap, RpcMap
├── api/            # Request/Response types
├── events/         # Domain event payloads
└── dtos/           # Additional DTOs
```

### 2. @dailyuse/domain-shared

**Purpose:** Value objects and enums shared between client and server

**Key Exports per module:**
- Enums: `GoalStatus`, `TaskInstanceStatus`, `ReminderStatus`, etc.
- Value objects: Branded types, configuration types
- Re-exported via barrel files for each domain module

### 3. @dailyuse/domain-server

**Purpose:** Server-side domain entities, aggregates, repositories, and services

**Structure per module:**
```
{module}/
├── aggregates/     # Aggregate root classes
├── entities/       # Entity classes
├── value-objects/  # Server-specific VOs
├── repositories/   # I*Repository interfaces
├── services/       # Domain services (pure logic)
├── events/         # Domain event handlers
└── errors/         # Domain errors
```

### 4. @dailyuse/domain-client

**Purpose:** Client-side domain models with DTO conversion

**Dependency Rules:**
- ✅ Allowed: contracts, domain-shared, utils
- ❌ Forbidden: domain-server, infrastructure-*, application-*

**Key Pattern:** `fromDTO()` / `toDTO()` for API communication

### 5. @dailyuse/utils

**Purpose:** Cross-cutting utilities and DDD infrastructure

**Key Exports:**
- `Entity<TId>` - Base class with identity-based equality
- `AggregateRoot<TId>` - Extends Entity, adds domain event collection
- `ValueObject<T>` - Immutable, structural equality
- `eventBus` - Global typed event bus (singleton)
- `createIdType()` - Factory for branded ID types

---

## Domain Modules

### Goal Module (OKR Management)

**Aggregates:**
| Aggregate | Purpose | Key Properties |
|-----------|---------|----------------|
| `Goal` | OKR objective | name, status, importance, priority, keyResults[], goalReviews[] |
| `GoalFolder` | Goal organization | name, color, parentFolderId, sortOrder |
| `FocusSession` | Pomodoro sessions | goalId, durationMinutes, status, pausedDurationMinutes |

**Entities:**
- `KeyResult` - Measurable results for goals
- `GoalReview` - Periodic goal reviews
- `GoalRecord` - Progress records

**Domain Services:**
- `FocusSessionDomainService` - Session validation, state transitions, statistics
- `GoalProgressCalculator` - Progress calculation

**Events (GoalEventMap):**
- `goal:create`, `goal:update`, `goal:status-change`, `goal:complete`, `goal:archive`, `goal:delete`
- `goal:key-result-add`, `goal:key-result-update`, `goal:key-result-delete`
- `goal:folder-create`, `goal:folder-update`, `goal:folder-delete`
- `goal:focus-session-start`, `goal:focus-session-pause`, `goal:focus-session-complete`

**RPC (GoalRpcMap):**
- `goal:create`, `goal:get`, `goal:list`
- `key-result:add`, `key-result:list`
- `goal-folder:create`, `goal-folder:list`
- `focus:get-status`

---

### Task Module (Work Management)

**Aggregates:**
| Aggregate | Purpose | Key Properties |
|-----------|---------|----------------|
| `TaskTemplate` | Reusable task definition | name, recurrence, estimatedDuration, priority |
| `TaskInstance` | Specific task occurrence | templateId, scheduledAt, completedAt, status |
| `TaskFolder` | Task organization | name, color, sortOrder |
| `TaskDependency` | Task relationships | sourceTaskId, targetTaskId, type |

**Entities:**
- `Subtask` - Child tasks within a task

**Domain Services:**
- `TaskInstanceGenerationService` - Generate instances from templates
- `TaskExpirationService` - Handle expired tasks
- `TaskDependencyService` - Manage dependencies, circular validation
- `calculateTaskPriority` - Priority calculation algorithm

**Key Features:**
- Recurring task patterns (daily, weekly, monthly, custom)
- Task dependencies with circular dependency detection
- Priority management based on multiple factors

---

### Schedule Module (Time Management)

**Aggregates:**
| Aggregate | Purpose | Key Properties |
|-----------|---------|----------------|
| `ScheduleJob` | Main schedule container | name, timezone, status |
| `ScheduleTask` | Scheduled task execution | sourceModule, sourceEntityId, cronExpression, schedule, execution, retryPolicy |

**Value Objects:**
- `ScheduleConfigServer` - Cron expression, timezone, date range, max executions
- `ExecutionInfoServer` - Next/last run, execution count, consecutive failures
- `RetryPolicyServer` - Max retries, backoff strategy, retryable statuses
- `TaskMetadataServer` - Payload, tags, priority, timeout

**Entities:**
- `ScheduleExecution` - Individual execution records

**Domain Events (ScheduleTaskDomainEvent):**
- `schedule.task.created`, `schedule.task.paused`, `schedule.task.resumed`
- `schedule.task.completed`, `schedule.task.cancelled`, `schedule.task.failed`
- `schedule.task.executed` - Core integration event for triggering business modules
- `schedule.task.schedule.updated`

**Key Feature: Cross-Module Integration**
The `ScheduleTask` links to any source module via:
```typescript
sourceModule: SourceModule  // 'goal' | 'task' | 'reminder' | etc.
sourceEntityId: string      // ID of the source entity
```

---

### Reminder Module (Reminder Management)

**Aggregates:**
| Aggregate | Purpose | Key Properties |
|-----------|---------|----------------|
| `ReminderTemplate` | Reminder definition | title, type, trigger, recurrence, notificationConfig, stats |
| `ReminderGroup` | Reminder organization | name, color, reminders[] |
| `UserReminderPreferences` | User settings | timeSlots, channels, doNotDisturb |

**Value Objects:**
- `TriggerConfigServer` - When to trigger
- `RecurrenceConfigServer` - Recurrence pattern
- `ActiveTimeConfigServer` - Active time window
- `ActiveHoursConfigServer` - Active hours of day
- `NotificationConfigServer` - Notification channels, templates
- `ReminderStatsServer` - Click rate, ignore rate, effectiveness

**Entities:**
- `ReminderHistory` - Historical trigger records

**Key Feature: Smart Frequency**
Auto-adjusts reminder frequency based on user response patterns:
- Click rate, ignore rate, average response time
- Snooze count, effectiveness score
- Original vs adjusted interval with reasons

---

### Notification Module (Multi-Channel Notifications)

**Aggregates:**
| Aggregate | Purpose |
|-----------|---------|
| `Notification` | Individual notification |
| `NotificationPreference` | User notification settings |
| `NotificationTemplate` | Reusable notification content |

**Entities:**
- `NotificationChannel` - Delivery channel configuration
- `NotificationHistory` - Delivery records

**Channels:** Email, SMS, Push, In-App

**Domain Services:**
- `NotificationDeliveryService` - Send notifications
- `NotificationBatchService` - Batch sending

---

## Core Architectural Patterns

### 1. Result Pattern

Protocol-agnostic operation results:

```typescript
// Success
const result = ok({ id: '123', name: 'Test' });

// Failure
const result = fail({ code: 'NOT_FOUND', message: 'Resource not found' });

// Usage
if (isOk(result)) {
  console.log(result.data);
} else {
  console.error(result.error);
}

// Composition
const mapped = map(result, user => user.name);
const chained = flatMap(result, user => getUserProfile(user.id));
```

**Adapters:**
- `toHttpResponse()` / `fromHttpResponse()` - HTTP integration
- `toIpcResult()` / `fromIpcResult()` - Electron IPC integration

### 2. Three-Layer DTO Pattern

Each aggregate has three representations:

| Layer | Type | Date Type | Purpose |
|-------|------|-----------|---------|
| **Domain** | `*Server` / `*Client` | `DomainDate` | In-memory business logic |
| **Transfer** | `*ServerDTO` / `*ClientDTO` | `TransferDate` (epoch ms) | API payloads |
| **Persistence** | `*PersistenceDTO` | `PersistenceDate` (Date) | Database storage |

### 3. Event-Driven Architecture

**CrossPlatformEventBus** (based on mitt):

```typescript
// One-way events
eventBus.send('goal:create', payload);
eventBus.on('goal:create', handler);

// Two-way RPC
const result = await eventBus.invoke('goal:get', { id: '123' });
eventBus.handle('goal:get', async (params) => { ... });
```

**Typed Registries:**
- `AppEventRegistry` - All event types with payloads
- `AppRpcRegistry` - All RPC types with [Request, Response]

### 4. Domain Events in Aggregates

```typescript
// AggregateRoot automatically collects events
this.addDomainEvent('goal:complete', { goalId: this.id });

// Application layer pulls and dispatches
const events = aggregate.pullDomainEvents();
for (const event of events) {
  eventBus.send(event.eventType, event.payload);
}
```

### 5. Branded ID Types

Type-safe entity references:

```typescript
type GoalId = string & { readonly __brand: 'GoalId' };
type TaskInstanceId = string & { readonly __brand: 'TaskInstanceId' };

// Prevents mixing IDs at compile time
function getGoal(id: GoalId): Goal { ... }
getGoal(taskId); // TS Error: TaskInstanceId not assignable to GoalId
```

---

## Business Process Flow Design Recommendations

Based on the refactored architecture, here are key integration points for business flows:

### 1. Goal → Task → Schedule Flow

```
User creates Goal
  ↓
Goal.addKeyResult() creates KeyResult
  ↓
KeyResult links to TaskTemplate (optional)
  ↓
TaskInstanceGenerationService creates TaskInstances
  ↓
ScheduleTask created for each TaskInstance
  ↓
ScheduleTask.executed event triggers task completion check
```

### 2. Reminder → Notification Flow

```
ReminderTemplate.nextTriggerAt reached
  ↓
ScheduleTask.executed event fires
  ↓
ReminderSchedulingService creates Notification
  ↓
NotificationDeliveryService sends via configured channels
  ↓
ReminderHistory recorded with response metrics
  ↓
Smart Frequency adjusts next trigger interval
```

### 3. Focus Session → Goal Progress Flow

```
FocusSession.start() linked to Goal
  ↓
FocusSession.complete() triggers GoalAggregateRefreshEvent
  ↓
GoalProgressCalculator recalculates progress
  ↓
goal:statistics-recalculate event fires
  ↓
Frontend receives event via eventBus
  ↓
Pinia store updates, UI reacts
```

---

## Files Analyzed Summary

| Package | Modules | Key Files |
|---------|---------|-----------|
| **contracts** | 14 modules | ~100+ type definition files |
| **domain-shared** | 11 modules | ~96 value object files |
| **domain-server** | 11 modules | ~95+ aggregate/service files |
| **domain-client** | 11 modules | ~80 client model files |
| **utils** | 7 sub-modules | ~47 utility files |

**Total:** ~420+ files analyzed exhaustively

---

## Additional Domain-Server Details (from Exhaustive Scan)

### Authentication Security Rules

| Rule | Implementation |
|------|----------------|
| **Brute-force Protection** | 5 failed attempts → 15 minute account lock |
| **Session Duration** | Default 7 days, sliding window 1 hour threshold |
| **Password Security** | Hashed storage, 90-day age validation |
| **Multi-Credential** | Password, OAuth, Phone - must keep at least 1 |

### AI Module Business Rules

| Rule | Implementation |
|------|----------------|
| **Quota Enforcement** | Daily/Weekly/Monthly reset periods, auto-reset |
| **API Key Security** | Masked for client, full for server/persistence |
| **Provider Priority** | 1-999 range (1=highest), inactive can't be default |
| **Validation** | KRs: 3-5, weights sum 100±5; Tasks: 5-10; Summary: 50-150 words |

### Task State Machine

```
TaskTemplate States:
  Active ←→ Paused → Archived → Deleted (soft)

TaskInstance States:
  Pending → InProgress → Completed
                      → Skipped
                      → Expired
```

### Reminder Smart Frequency (Story 5-2)

```typescript
ResponseMetrics {
  clickRate: number;
  ignoreRate: number;
  avgResponseTime: number;
  snoozeCount: number;
  effectivenessScore: number;
}

FrequencyAdjustment {
  originalInterval: number;
  adjustedInterval: number;
  adjustmentReason: string;
  isAutoAdjusted: boolean;
  userConfirmed: boolean;
}
```

### Cross-Module Patterns Discovered

1. **Repository Pattern** - All modules use `I*Repository` interfaces hiding persistence
2. **Event Naming** - Format: `'module:action'` (e.g., `'task:complete'`)
3. **Factory Methods** - `create()`, `fromServerDTO()`, `fromPersistenceDTO()`
4. **DTO Conversion** - `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
5. **ID Value Objects** - `of(string)`, `generate()` methods

---

## Next Steps for Infrastructure Implementation

1. **Repository Implementations** - Implement `I*Repository` interfaces with Prisma
2. **Application Services** - Orchestrate domain services with repository calls
3. **Event Handlers** - Subscribe to domain events for cross-module coordination
4. **API Controllers** - Map HTTP/IPC to application services using Result pattern
5. **State Management** - Pinia stores consuming domain-client models

---

## Domain-Shared - Value Object Patterns

### Three Value Object Patterns

**Pattern 1: Branded Enum Type**
```typescript
export type GoalStatus = IGoalStatus & { readonly __brand: unique symbol };
export const GoalStatus = {
  Active: 'ACTIVE' as GoalStatus,
  Completed: 'COMPLETED' as GoalStatus,
  of(value: string): GoalStatus { ... },
  isValid(value: string): value is GoalStatus { ... },
  isTerminal(status: GoalStatus): boolean { ... }
};
```

**Pattern 2: Class-based Value Object**
```typescript
export class RecurrenceRule extends ValueObject<RecurrenceRuleDTO> {
  static create(props): RecurrenceRule { ... }
  static createDaily(interval): RecurrenceRule { ... }
  static fromDTO(dto): RecurrenceRule { ... }

  get frequency(): Frequency { return this.props.frequency; }
  setInterval(interval): RecurrenceRule { return new RecurrenceRule({...}); }

  toDTO(): RecurrenceRuleDTO { ... }
  toPersistenceDTO(): RecurrenceRulePersistenceDTO { ... }
}
```

**Pattern 3: ID Type (from createIdType)**
```typescript
export const GoalId = createIdType<IGoalId>('GoalId');
export type GoalId = IGoalId;
```

### Key Shared Business Logic

**DailyPriorityCalculator** - Pure function shared by client/server:
```typescript
calculate(targetDate, importance, referenceDate?): number
mapScoreToLevel(score): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
compare(a, b): number // For sorting
```

**Sync Module** - Conflict resolution utilities:
```typescript
detectConflict(clientChange, serverData, serverMetadata): SyncConflict | null
resolveConflict(conflict, strategy, manualData?): { data, syncMetadata }
// Strategies: ClientWins, ServerWins, LastWriteWins, Manual
```

### Module Value Objects Summary

| Module | Key Value Objects |
|--------|-------------------|
| **Account** | AccountProfile, AccountSettings, ContactEmail, ContactPhone |
| **Auth** | PlainPassword (with strength), HashedPassword, DeviceInfo |
| **Goal** | GoalMetadata, GoalTimeRange, KeyResultProgress |
| **Task** | RecurrenceRule, TaskReminderConfig, ChecklistItemDefinition |
| **Reminder** | RecurrenceConfig, TriggerConfig, ActiveHoursConfig, ReminderStats |
| **Schedule** | ScheduleConfig, ExecutionInfo, RetryPolicy, ConflictDetectionResult |
| **Notification** | NotificationMetadata, CategoryPreference, DoNotDisturbConfig |

---

## Utils Package - Cross-Cutting Utilities

### DDD Base Classes

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `Entity<TId>` | Identity-based equality | `equals()`, supports ValueObject IDs |
| `AggregateRoot<TId>` | Domain event collection | `addDomainEvent()`, `pullDomainEvents()` |
| `ValueObject<T>` | Immutable, structural equality | `equals()` (deep), `getRawProps()` |

### ID Generator Factory

```typescript
const UserId = createIdType<UserId>('usr');
const id = UserId.generate(); // "usr_<uuid>"
const validated = UserId.of(rawString); // Type cast with prefix validation
```

### Event Bus Architecture

**CrossPlatformEventBus<TEvents, TRpc>**:
- Built on `mitt` library
- Single-directional: `send()`, `on()`, `off()`
- Request-response: `invoke()`, `handle()`, `removeHandler()`
- Auto-timeout (30s default)
- Cross-platform UUID generation

### Error Handling Hierarchy

```
DomainError (abstract)
├── BusinessRuleViolationError (400)
├── NotFoundError (404)
├── ValidationError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── ConflictError (409)
└── InternalServerError (500)
```

**Rich Context**: `code`, `context`, `operationId`, `step`, `originalError`, `getErrorChain()`

### Form Validation System

**FormValidator** features:
- Async/await with AbortController cancellation
- Event system (beforeValidate, afterValidate)
- Conditional rule execution
- Dependency tracking
- Built-in validators: `required`, `email`, `phone`, `pattern`, `min/max`, `custom`, `async`

### Frontend Utilities

| Utility | Purpose |
|---------|---------|
| `createDebounce()` | Delay execution until calls stop |
| `createThrottle()` | Max once per interval |
| `createRAFThrottle()` | requestAnimationFrame-based |
| `LoadingState<T, E>` | Async state management with retry |
| `createCachedLoader()` | Cache with TTL |
| `createPollingLoader()` | Repeated async polling |

### Logging System

**Transports**: Console, File, HTTP (batch with flush)
**Winston Integration**: Daily rotate files, error-only files

### Initialization Managers

**InitializationManager** - Server/Desktop:
- Phases: `APP_STARTUP`, `BEFORE_USER_LOGIN`, `USER_LOGIN`, `USER_LOGOUT`, `APP_SHUTDOWN`
- Priority-based with dependency resolution

**WebInitializationManager** - SPA:
- Module groups: `critical`, `authenticated`, `optional`
- Lazy loading with retry logic
- Progress reporting

---

## Appendix: Complete ID Type Registry

```typescript
// Identity/Auth
IdentityId, AuthCredentialId, AuthSessionId

// Goal
GoalId, GoalFolderId, KeyResultId, FocusSessionId, FocusModeId, GoalRecordId, GoalReviewId

// Task
TaskTemplateId, TaskInstanceId, TaskDependencyId, SubtaskId, TaskFolderId

// Schedule
ScheduleId, ScheduleTaskId, ScheduleExecutionId, ScheduleStatisticId

// Reminder
ReminderTemplateId, ReminderGroupId, ReminderInstanceId, ReminderHistoryId, ReminderResponseId

// Notification
NotificationId, NotificationChannelId, NotificationPreferenceId, NotificationTemplateId, NotificationHistoryId

// Repository/Document
RepositoryId, ResourceId, FolderId, DocumentId, DocumentVersionId, DocumentLinkId

// Editor
EditorWorkspaceId, EditorSessionId, EditorGroupId, EditorTabId, LinkedResourceId, SearchEngineId

// Settings
SettingId, SettingEntryId, SettingHistoryId, SettingGroupId, AppConfigId

// AI
AiConversationId, AiMessageId, AiGenerationTaskId, AiProviderConfigId, AiUsageQuotaId

// Sync
SyncProfileId, SyncSessionId, SyncConflictId, PendingChangeId, DataSnapshotId

// Dashboard
DashboardId, WidgetId
```
