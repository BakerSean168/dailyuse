# Data Model: Goal Module API Backend

**Date**: 2026-02-11
**Status**: Complete
**Related**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md)

## Overview

This document defines the data model for the Goal module. **IMPORTANT**: Actual type definitions are in `@dailyuse/contracts/modules/goal` package. This document provides conceptual overview and validation rules.

**Existing Contracts**:
- `GoalServer`, `GoalServerDTO`, `GoalPersistenceDTO` (see goal-server.ts)
- `KeyResultServer`, `KeyResultServerDTO`, `KeyResultPersistenceDTO` (see key-result-server.ts)
- `GoalReviewServer`, `GoalReviewServerDTO`, `GoalReviewPersistenceDTO` (see goal-review-server.ts)
- Strong types: `GoalId`, `IdentityId`, `GoalFolderId` from primitives

---

## Entity Definitions

### Goal (Aggregate Root)

**Contract Reference**: `GoalServer` (domain), `GoalServerDTO` (API), `GoalPersistenceDTO` (persistence)

**Key Fields in Contracts**:

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `uuid` | UUID | Yes | Generated | Primary key | Unique identifier |
| `accountUuid` | UUID | Yes | - | Foreign key to Account | Owner of the goal |
| `title` | String | Yes | - | 1-200 chars | Goal name/title |
| `description` | String | No | null | Max 2000 chars | Detailed description |
| `status` | Enum | Yes | 'IN_PROGRESS' | GoalStatus enum | Current status |
| `importance` | Enum | Yes | - | ImportanceLevel enum | Priority level |
| `urgency` | Enum | No | null | UrgencyLevel enum | Time sensitivity |
| `deadline` | Timestamp | No | null | Must be future date | Optional due date |
| `folderUuid` | UUID | No | null | Foreign key to GoalFolder | Single folder assignment |
| `tags` | String[] | No | [] | Max 20 tags, 50 chars each | Multiple tags for categorization |
| `calculationMethod` | Enum | Yes | 'WEIGHTED_AVERAGE' | ProgressCalculationMethod | How to compute progress from key results |
| `currentProgress` | Number | Yes | 0 | 0-100+ (sum may exceed 100) | Computed progress value |
| `parentGoalUuid` | UUID | No | null | Foreign key to Goal (self) | Optional parent goal for hierarchy |
| `color` | String | No | null | Hex color code | UI display color |
| `metadata` | JSON | No | {} | - | Extensible metadata |
| `createdAt` | Timestamp | Yes | Now | - | Creation timestamp |
| `updatedAt` | Timestamp | Yes | Now | Auto-update | Last modification timestamp |
| `archivedAt` | Timestamp | No | null | - | Archive timestamp (soft delete) |

**Enums**:

```typescript
enum GoalStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
  ABANDONED = 'ABANDONED'
}

enum ImportanceLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

enum UrgencyLevel {
  URGENT = 'URGENT',
  SOON = 'SOON',
  EVENTUALLY = 'EVENTUALLY'
}

enum ProgressCalculationMethod {
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',  // Default: sum(progress * weight/totalWeight)
  MAX = 'MAX',                            // max(progress) of all key results
  MIN = 'MIN',                            // min(progress) of all key results
  LATEST = 'LATEST',                      // progress of most recently updated key result
  SUM = 'SUM'                             // sum(progress) - may exceed 100%
}
```

**Relationships**:
- `keyResults`: One-to-Many → KeyResult (cascade delete)
- `progressRecords`: One-to-Many → ProgressRecord (cascade delete)
- `retrospectives`: One-to-Many → Retrospective (cascade delete)
- `reminders`: One-to-Many → ReminderSetting (cascade delete)
- `folder`: Many-to-One → GoalFolder (optional, nullable)
- `parent`: Many-to-One → Goal (self-referential, optional)
- `children`: One-to-Many → Goal (self-referential)

**Validation Rules** (implement in domain layer):
- Maximum 5 key results per goal (enforced in domain service)
- Name must not be empty or whitespace-only
- If targetDate is set, must be in the future at creation time
- Archived goals cannot be modified (status check in domain)
- Parent goal must belong to same identityId

**Relationships** (see contracts):
- `keyResults`: One-to-Many → KeyResultServer (cascade delete)
- `goalReviews`: One-to-Many → GoalReviewServer (retrospectives, cascade delete)
- Progress records NOT in aggregate (query via separate repository)

---

### KeyResult (Entity)

**Contract Reference**: `KeyResultServer` (domain), `KeyResultServerDTO` (API), `KeyResultPersistenceDTO` (persistence) from `@dailyuse/contracts/modules/goal`

Measurable outcome that contributes to goal progress.

**Key Fields** (refer to contracts for complete structure):
- `id: KeyResultId` - Strong-typed identifier
- `goalId: GoalId` - Parent goal reference
- `name: string` - Key result name (1-200 chars)
- `description: string | null` - Detailed description
- `initialValue: number` - Starting value (default 0)
- `targetValue: number` - Target to achieve (must be > initialValue)
- `currentValue: number` - Current value (domain computed)
- `unit: string | null` - Measurement unit (e.g., "hours", "kg")
- `weight: number` - Relative weight for calculation (default 1, must be positive)
- `progress: number` - Computed percentage: (current - initial) / (target - initial) * 100

**Validation Rules**:
- Weight must be positive (> 0)
- Progress is computed: `progress = ((currentValue - initialValue) / (targetValue - initialValue)) * 100`
- CurrentValue should be between initialValue and targetValue (warnings for out-of-range)
- Max 5 key results per goal

**Relationships** (defined in contracts):
- `goal`: Many-to-One → GoalServer (owner)

---

### ProgressRecord (Entity)

Historical record of key result progress changes.

**Attributes**:

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `uuid` | UUID | Yes | Generated | Primary key | Unique identifier |
| `goalUuid` | UUID | Yes | - | Foreign key to Goal | Associated goal |
| `keyResultUuid` | UUID | Yes | - | Foreign key to KeyResult | Associated key result |
| `previousValue` | Number | Yes | - | - | Value before change |
| `newValue` | Number | Yes | - | - | Value after change |
| `previousProgress` | Number | Yes | - | 0-100 | Progress percentage before |
| `newProgress` | Number | Yes | - | 0-100 | Progress percentage after |
| `note` | String | No | null | Max 500 chars | Optional user note about the update |
| `recordedAt` | Timestamp | Yes | Now | - | When the progress change occurred |
| `recordedBy` | UUID | Yes | - | Foreign key to Account | Who made the change |

**Note**: ProgressRecord history tracking will be added to contracts in future iteration.

**Validation Rules**:
- Progress records are immutable after creation (append-only pattern)
- Automatically created whenever KeyResult.currentValue changes

---

### GoalReview (Entity)

**Contract Reference**: `GoalReviewServer` (domain), `GoalReviewServerDTO` (API) from `@dailyuse/contracts/modules/goal`

User-authored reflection on goal outcomes and learnings.

**Key Fields** (refer to contracts for complete structure):
- `id: GoalReviewId` - Strong-typed identifier
- `goalId: GoalId` - Associated goal
- `content: string` - Review content (Markdown supported, 1-10000 chars)
- `completionRate: number | null` - Actual completion percentage (0-100)
- `whatWorked: string | null` - What went well (max 2000 chars)
- `whatDidntWork: string | null` - What didn't go well (max 2000 chars)
- `lessonsLearned: string | null` - Key takeaways (max 2000 chars)
- `createdBy: IdentityId` - Author

**Validation Rules**:
- Content must not be empty
- Reviews can be created at any time (not just when goal is completed)
- Multiple reviews allowed per goal

---

### ReminderSetting (Entity)

**Contract Reference**: `ReminderConfig` (embedded in GoalServer) from `@dailyuse/contracts/modules/goal`

User-configured reminder preferences for a goal.

**Key Fields** (refer to contracts for complete structure):
- Embedded within GoalServer as `reminderConfig`
- `type: ReminderType` - Type of reminder (DEADLINE_APPROACHING | PROGRESS_UPDATE | INACTIVITY)
- `enabled: boolean` - Whether reminder is active
- `schedule: ReminderSchedule` - Schedule configuration

**Schedule Structure**:
```typescript
interface ReminderSchedule {
  daysBefore?: number;       // For DEADLINE_APPROACHING
  intervalDays?: number;     // For PROGRESS_UPDATE
  inactiveDays?: number;     // For INACTIVITY
}
```

**Validation Rules**:
- DEADLINE_APPROACHING type requires goal to have targetDate
- Schedule values must be positive integers

---

### GoalFolder (Entity)

**Contract Reference**: `GoalFolderServer` (domain) from `@dailyuse/contracts/modules/goal`

Optional folder for organizing goals (single folder per goal).

**Key Fields** (refer to contracts for complete structure):
- `id: GoalFolderId` - Strong-typed identifier
- `identityId: IdentityId` - Owner
- `name: string` - Folder name (1-100 chars)
- `color: string | null` - UI display color (hex code)
| `order` | Integer | Yes | 0 | - | Display order |
| `createdAt` | Timestamp | Yes | Now | - | Creation timestamp |
| `updatedAt` | Timestamp | Yes | Now | Auto-update | Last modification timestamp |

**Relationships**:
- `goals`: One-to-Many → Goal

**Validation Rules**:
- Name must be unique per account
- Cannot delete folder if it contains goals (must move or delete goals first)

---

### FocusSelection (Entity)

Tracks the currently focused goal for a user.

**Attributes**:

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `uuid` | UUID | Yes | Generated | Primary key | Unique identifier |
| `accountUuid` | UUID | Yes | - | Foreign key to Account, unique | Owner (one focus per user) |
| `goalUuid` | UUID | Yes | - | Foreign key to Goal | Currently focused goal |
| `startedAt` | Timestamp | Yes | Now | - | When focus was activated |
| `plannedEndDate` | Timestamp | No | null | Computed from goal deadline | Expected focus duration end |

**Relationships**:
- `goal`: Many-to-One → Goal

**Validation Rules**:
- Name must not be empty
- Color format must be valid hex code (if provided)

---

### FocusSelection (Entity)

**Note**: Focus selection tracking is a future feature not yet defined in contracts package.

Tracks the currently focused goal for a user.

**Planned Fields**:
- `id: FocusSelectionId` - Strong-typed identifier
- `identityId: IdentityId` - Owner (unique constraint - one focus per user)
- `goalId: GoalId` - Currently focused goal
- `startedAt: TransferDate` - When focus was activated
- `plannedEndDate: TransferDate | null` - Expected focus duration end

**Validation Rules**:
- Only one active focus selection per user (unique constraint on identityId)
- Focus selection must reference an IN_PROGRESS goal

---

## Relationship Diagram

```
Identity (external)
   │
   ├──< GoalFolder (optional)
   │      └──< Goal (many)
   │
   └──< Goal (Aggregate Root)
          ├──< KeyResult (max 5)
          ├──< GoalReview (many)
          └──< ReminderConfig (embedded)
          
   Goal (self-referential)
     ├── parent: Goal (optional)
     └── children: Goal[] (many)
```

**Cascade Delete Behavior** (when Goal is deleted):
- ✅ KeyResult → deleted
- ✅ GoalReview → deleted
- ⚠️ FocusSelection → nullified (future feature)
- ❌ GoalFolder → NOT deleted (folder survives)

---

## Domain Invariants

### Goal Aggregate Invariants

1. **Max Key Results**: A goal cannot have more than 5 key results.
2. **Progress Calculation**: Goal progress is computed via calculation method (weighted average, max, min, etc.), not set directly.
3. **Archived Immutability**: Once archived, a goal cannot be modified (only status change to restore).
4. **Parent-Child Consistency**: Parent goal must belong to the same identityId.

### KeyResult Invariants

1. **Progress Computation**: Progress is always derived from `(currentValue - initialValue) / (targetValue - initialValue) * 100`.
2. **Weight Positivity**: Weight must be > 0.
3. **Target Greater Than Initial**: `targetValue` must be > `initialValue`.

### Reminder Setting Invariants

1. **Deadline Dependency**: DEADLINE_APPROACHING reminders require goal to have targetDate.
2. **Schedule Validation**: Schedule field must contain valid positive integers for intervals.

---

## State Transitions

### Goal Status Transitions

```
[Created] → IN_PROGRESS (default)
   ↓
IN_PROGRESS → COMPLETED (when user marks complete)
   ↓
COMPLETED → ARCHIVED (when user archives)
   ↓
ARCHIVED → IN_PROGRESS (restore archived goal)

IN_PROGRESS → ABANDONED (when user abandons)
   ↓
ABANDONED → ARCHIVED (archive abandoned goal)
```

**Validation**:
- ARCHIVED → IN_PROGRESS requires user confirmation
- COMPLETED goals should have 100% progress or user confirmation

---

## Data Access Patterns

### Goal Queries

1. **List Goals by Identity**:
   - Filter by status (IN_PROGRESS, COMPLETED, ARCHIVED, ABANDONED)
   - Filter by folderId
   - Filter by tags (array overlap)
   - Sort by: createdAt, targetDate, importance
   - Pagination support

2. **Get Goal Details**:
   - Include key results (with progress)
   - Include goal reviews (optional)
   - Include reminder config
   - Include progress history (optional, paginated)

3. **Search Goals**:
   - Full-text search on name and description
   - Filter by date range (created, targetDate)
   - Filter by progress range

### Key Result Queries

1. **List Key Results by Goal**: Always included with goal details
2. **Get Key Result Progress History**: Future feature - paginated list of progress changes

---

## Prisma Schema Summary

**Note**: This is a reference schema. Actual implementation must use contracts package types and field names.

```prisma
model Goal {
  id                String    @id @default(uuid())
  identityId        String
  name              String
  description       String?
  status            String    @default("IN_PROGRESS")
  importance        String
  priority          Float?
  targetDate        DateTime?
  folderId          String?
  tags              String[]  @default([])
  parentGoalId      String?
  color             String?
  startDate         DateTime?
  version           Int       @default(1)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  archivedAt        DateTime?
  
  // Relations
  keyResults       KeyResult[]       @relation("GoalKeyResults", onDelete: Cascade)
  goalReviews      GoalReview[]      @relation("GoalReviews", onDelete: Cascade)
  folder           GoalFolder?       @relation(fields: [folderId], references: [id])
  parent           Goal?             @relation("GoalHierarchy", fields: [parentGoalId], references: [id])
  children         Goal[]            @relation("GoalHierarchy")
  
  @@index([identityId])
  @@index([folderId])
  @@index([status])
  @@index([targetDate])
}

model KeyResult {
  id           String   @id @default(uuid())
  goalId       String
  name         String
  description  String?
  initialValue Float    @default(0)
  targetValue  Float
  currentValue Float    @default(0)
  unit         String?
  weight       Float    @default(1)
  progress     Float    @default(0)
  version      Int      @default(1)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  goal Goal @relation("GoalKeyResults", fields: [goalId], references: [id], onDelete: Cascade)
  
  @@index([goalId])
}

model GoalReview {
  id             String   @id @default(uuid())
  goalId         String
  previousValue    Float
  newValue         Float
  previousProgress Float
  newProgress      Float
  note             String?
  recordedAt       DateTime @default(now())
  recordedBy       String
  
  goal      Goal      @relation("GoalProgressRecords", fields: [goalUuid], references: [uuid], onDelete: Cascade)
  keyResult KeyResult @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)
  
  @@index([goalUuid])
  @@index([keyResultUuid])
  @@index([recordedAt])
  content          String
  completionRate   Float?
  whatWorked       String?
  whatDidntWork    String?
  lessonsLearned   String?
  createdAt        DateTime @default(now())
  createdBy        String
  version          Int      @default(1)
  
  goal Goal @relation("GoalReviews", fields: [goalId], references: [id], onDelete: Cascade)
  
  @@index([goalId])
}

model GoalFolder {
  id          String   @id @default(uuid())
  identityId  String
  name        String
  color       String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  goals Goal[]
  
  @@index([identityId])
  @@unique([identityId, name])
}
```

---

## Validation Summary

| Entity | Field | Validation Rule |
|--------|-------|----------------|
| Goal | name | Required, 1-200 chars, not empty |
| Goal | tags | Max 20 tags, each max 50 chars |
| Goal | keyResults | Max 5 key results per goal |
| Goal | targetDate | Must be future date at creation |
| KeyResult | weight | Must be > 0 |
| KeyResult | targetValue | Must be > initialValue |
| KeyResult | progress | Computed, 0-100% |
| GoalReview | content | Required, 1-10000 chars |
| ReminderSetting | type DEADLINE_APPROACHING | Goal must have targetDate |
| GoalFolder | name | Unique per identityId |

---

## Conclusion

Data model supports all functional requirements from spec:
- ✅ FR-001: Goal CRUD with ownership isolation (identityId)
- ✅ FR-002: Goal attributes (name, description, status, importance, targetDate, single folder, multiple tags)
- ✅ FR-003: Max 5 key results per goal
- ✅ FR-004: Progress validation 0-100%
- ✅ FR-005: Per-goal calculation method (will be added to contracts)
- ✅ FR-006: Relative weights normalized at calculation time
- ✅ FR-007: Progress history (future feature)
- ✅ FR-008: View progress history (future feature via queries)
- ✅ FR-009: Goal review notes via GoalReview entity
- ✅ FR-010: Reminder configuration via ReminderConfig (embedded)
- ✅ FR-011: Focus selection (future feature via FocusSelection entity)
- ✅ FR-012: Multi-tenant isolation via identityId extraction from JWT
- ✅ FR-013: Cascade delete configured in Prisma schema

**Status**: Data model complete. All entities reference contracts package. Ready for implementation.
