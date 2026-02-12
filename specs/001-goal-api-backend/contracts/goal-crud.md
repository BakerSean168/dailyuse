# API Contracts: Goal CRUD

**Date**: 2026-02-11
**Purpose**: Define request/response contracts for goal CRUD operations
**Related**: [data-model.md](../data-model.md)

**IMPORTANT**: Use types from `@dailyuse/contracts/modules/goal`:
- Request/Response: `GoalServerDTO`, `KeyResultServerDTO`
- Domain types: `GoalId`, `IdentityId`, `GoalStatus`, `ImportanceLevel`
- Do NOT redefine these types here

## Create Goal

### Request

**Route**: `POST /api/goals`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body**:
```typescript
interface CreateGoalRequest {
  name: string;                    // Required, 1-200 chars
  description?: string;            // Optional
  importance: ImportanceLevel;     // Required: CRITICAL | HIGH | MEDIUM | LOW
  color?: string;                  // Optional, hex color
  tags?: string[];                 // Optional
  folderId?: GoalFolderId;         // Optional, folder reference
  parentGoalId?: GoalId;           // Optional, parent goal reference
  startDate?: number;              // Optional, Unix timestamp (ms)
  targetDate?: number;             // Optional, Unix timestamp (ms)
  keyResults?: CreateKeyResultRequest[];  // Optional, initial key results (max 5)
  // Missing from contracts - will need to add:
  calculationMethod?: ProgressCalculationMethod;  // Default WEIGHTED_AVERAGE
}

interface CreateKeyResultRequest {
  name: string;                    // Required, 1-200 chars
  description?: string;            // Optional
  unit?: string;                   // Optional (e.g., "hours", "kg")
  initialValue?: number;           // Optional, default 0
  targetValue: number;             // Required
  weight?: number;                 // Optional, default 1.0, must be > 0
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
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  MAX = 'MAX',
  MIN = 'MIN',
  LATEST = 'LATEST',
  SUM = 'SUM'
}

enum ValueType {
  INCREMENTAL = 'INCREMENTAL',
  DECREMENTAL = 'DECREMENTAL',
  BINARY = 'BINARY'
}
```

**Validation**:
- `name` must not be empty or whitespace-only
- `targetDate` (if provided) must be in the future
- `keyResults` array must not exceed 5 items
- `folderId` must exist and belong to user
- `parentGoalId` must exist and belong to user
- `tags` array max 20 items, each max 50 chars

### Response

**Success (201 Created)**:
```typescript
interface CreateGoalResponse {
  goal: GoalServerDTO;  // From @dailyuse/contracts
}

// GoalServerDTO structure (from contracts):
// {
//   id: GoalId;
//   identityId: IdentityId;
//   name: string;
//   description: string | null;
//   status: GoalStatus;
//   importance: ImportanceLevel;
//   priority: number | null;  // Dynamic priority (computed)
//   tags: string[];
//   folderId: GoalFolderId | null;
//   parentGoalId: GoalId | null;
//   startDate: TransferDate | null;
//   targetDate: TransferDate | null;
//   keyResults: KeyResultServerDTO[] | null;
//   goalReviews: GoalReviewServerDTO[] | null;
//   version: number;
//   createdAt: TransferDate;
//   updatedAt: TransferDate;
//   ... other fields from contracts
// }
```

**Error Responses**:

- `400 Bad Request`: Validation error
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Title is required",
      "field": "title"
    }
  }
  ```

- `404 Not Found`: Folder or parent goal not found
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Folder not found: <uuid>",
      "resource": "folder"
    }
  }
  ```

- `409 Conflict`: Business rule violation (e.g., max 5 key results)
  ```json
  {
    "error": {
      "code": "BUSINESS_RULE_VIOLATION",
      "message": "Cannot add more than 5 key results to a goal",
      "rule": "MAX_KEY_RESULTS"
    }
  }
  ```

---

## Get Goal

### Request

**Route**: `GET /api/goals/:id`

**Headers**:
- `Authorization: Bearer <token>` (required)

**Query Parameters**:
- `includeKeyResults` (boolean, default: true) - Include key results
- `includeReviews` (boolean, default: false) - Include goal reviews

### Response

**Success (200 OK)**:
```typescript
interface GetGoalResponse {
  goal: GoalServerDTO;  // From @dailyuse/contracts
}

// The GoalServerDTO from contracts includes:
// - keyResults: KeyResultServerDTO[] | null (if requested)
// - goalReviews: GoalReviewServerDTO[] | null (if requested)
```

**Error Responses**:

- `404 Not Found`: Goal does not exist or doesn't belong to user
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Goal not found: <id>"
    }
  }
  ```

---

## Update Goal

### Request

**Route**: `PUT /api/goals/:id` or `PATCH /api/goals/:id`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body** (all fields optional for PATCH):
```typescript
interface UpdateGoalRequest {
  name?: string;
  description?: string;
  importance?: ImportanceLevel;
  targetDate?: number | null;       // Set to null to clear
  folderId?: GoalFolderId | null;
  tags?: string[];
  color?: string | null;
  // Missing from contracts - will need to add:
  calculationMethod?: ProgressCalculationMethod;
}
```

**Validation**:
- Cannot update archived/completed goals (status check)
- Same validation rules as create

### Response

**Success (200 OK)**:
```typescript
interface UpdateGoalResponse {
  goal: GoalServerDTO;  // From @dailyuse/contracts
}
```

**Error Responses**:

- `400 Bad Request`: Validation error or invalid status transition
- `404 Not Found`: Goal not found

---

## Delete Goal

### Request

**Route**: `DELETE /api/goals/:id`

**Headers**:
- `Authorization: Bearer <token>` (required)

**Query Parameters**:
- `confirm` (boolean, required: true) - Safety confirmation

### Response

**Success (204 No Content)**: Empty body

**Error Responses**:

- `400 Bad Request`: Missing confirmation
  ```json
  {
    "error": {
      "code": "MISSING_CONFIRMATION",
      "message": "Must provide confirm=true to delete goal"
    }
  }
  ```

- `404 Not Found`: Goal not found

**Behavior**:
- Cascade deletes all related entities (key results, progress records, reviews, reminders)
- If goal has children, they are orphaned (parentGoalId set to null)

---

## List Goals

### Request

**Route**: `GET /api/goals`

**Headers**:
- `Authorization: Bearer <token>` (required)

**Query Parameters**:
- `status` (string, optional) - Filter by status: IN_PROGRESS | COMPLETED | ARCHIVED | ABANDONED
- `folderId` (GoalFolderId, optional) - Filter by folder
- `tags` (string, optional) - Comma-separated tags (OR logic)
- `sortBy` (string, default: createdAt) - Sort field: createdAt | targetDate | importance
- `sortOrder` (string, default: desc) - asc | desc
- `page` (number, default: 1) - Page number
- `pageSize` (number, default: 20, max: 100) - Items per page
- `includeKeyResults` (boolean, default: true) - Include key results for each goal

### Response

**Success (200 OK)**:
```typescript
interface ListGoalsResponse {
  goals: GoalServerDTO[];  // From @dailyuse/contracts
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Change Goal Status

### Request

**Route**: `POST /api/goals/:id/status`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body**:
```typescript
interface ChangeGoalStatusRequest {
  status: GoalStatus;              // IN_PROGRESS | COMPLETED | ARCHIVED | ABANDONED
  reason?: string;                 // Optional reason for status change
}
```

### Response

**Success (200 OK)**:
```typescript
interface ChangeGoalStatusResponse {
  goal: GoalServerDTO;  // From @dailyuse/contracts
}
```

**Error Responses**:

- `400 Bad Request`: Invalid status transition
- `404 Not Found`: Goal not found

---

## Notes

- All timestamps are Unix timestamps in milliseconds
- All IDs use strong types: `GoalId`, `IdentityId`, `GoalFolderId`
- Authentication extracts `identityId` from JWT token (see NFR-001/002 in spec.md)
- All endpoints enforce ownership: users can only access their own goals
- Response DTOs use `GoalServerDTO`, `KeyResultServerDTO` from `@dailyuse/contracts/modules/goal`
- Do NOT redefine these types - import from contracts package
