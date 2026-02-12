# API Contracts: Key Result Management

**Date**: 2026-02-11
**Purpose**: Define request/response contracts for key result operations
**Related**: [goal-crud.md](goal-crud.md), [data-model.md](../data-model.md)

**IMPORTANT**: Use types from `@dailyuse/contracts/modules/goal`:
- Request/Response: `KeyResultServerDTO`
- Domain types: `GoalId`, `KeyResultId`, `IdentityId`
- Do NOT redefine these types here

## Add Key Result to Goal

### Request

**Route**: `POST /api/goals/:goalId/key-results`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body**:
```typescript
interface AddKeyResultRequest {
  name: string;                    // Required, 1-200 chars
  description?: string;            // Optional
  initialValue?: number;           // Optional, default 0
  targetValue: number;             // Required
  unit?: string;                   // Optional (e.g., "hours", "kg")
  weight?: number;                 // Optional, default 1.0, must be > 0
}
```

**Validation**:
- Goal must exist and belong to user
- Goal cannot have more than 5 key results
- `name` must not be empty
- `targetValue` must be > `initialValue`
- `weight` must be positive

### Response

**Success (201 Created)**:
```typescript
interface AddKeyResultResponse {
  keyResult: KeyResultServerDTO;  // From @dailyuse/contracts
  goal: GoalServerDTO;            // Updated goal with recalculated progress
}
```

**Error Responses**:

- `400 Bad Request`: Validation error
- `404 Not Found`: Goal not found
- `409 Conflict`: Max 5 key results limit reached
  ```json
  {
    "error": {
      "code": "MAX_KEY_RESULTS_REACHED",
      "message": "Cannot add more than 5 key results to a goal"
    }
  }
  ```

---

## Update Key Result Progress

### Request

**Route**: `PATCH /api/goals/:goalId/key-results/:keyResultId/progress`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body**:
```typescript
interface UpdateKeyResultProgressRequest {
  currentValue: number;    // Required, new currentValue
  note?: string;           // Optional, max 500 chars
}
```

**Validation**:
- Goal and key result must exist and belong to user
- `currentValue` should be between `initialValue` and `targetValue` (warnings for out-of-range)

### Response

**Success (200 OK)**:
```typescript
interface UpdateKeyResultProgressResponse {
  keyResult: KeyResultServerDTO;  // From @dailyuse/contracts
  goal: GoalServerDTO;            // Updated goal with recalculated progress
}
```

**Behavior**:
- Recalculates goal's progress based on goal's calculation method
- Publishes domain event: `KeyResultProgressUpdated`

---

## Get Key Result Progress History

### Request

**Route**: `GET /api/goals/:goalId/key-results/:keyResultId/history`

**Headers**:
- `Authorization: Bearer <token>` (required)

**Query Parameters**:
- `page` (number, default: 1)
- `pageSize` (number, default: 20, max: 100)
- `startDate` (number, optional) - Unix timestamp (ms)
- `endDate` (number, optional) - Unix timestamp (ms)

### Response

**Success (200 OK)**:
```typescript
interface GetKeyResultHistoryResponse {
  keyResult: KeyResultServerDTO;  // From @dailyuse/contracts
  // Note: Progress history not yet in contracts, will be added
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

## Update Key Result Metadata

### Request

**Route**: `PATCH /api/goals/:goalId/key-results/:keyResultId`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body** (all fields optional):
```typescript
interface UpdateKeyResultRequest {
  name?: string;
  description?: string;
  targetValue?: number;     // Can adjust target mid-progress
  weight?: number;          // Can adjust weight for recalculation
  unit?: string;
}
```

**Validation**:
- Same validation rules as create
- Adjusting `targetValue` or `weight` triggers goal progress recalculation

### Response

**Success (200 OK)**:
```typescript
interface UpdateKeyResultResponse {
  keyResult: KeyResultServerDTO;  // From @dailyuse/contracts
  goal: GoalServerDTO;            // With recalculated progress
}
```

---

## Delete Key Result

### Request

**Route**: `DELETE /api/goals/:goalId/key-results/:keyResultId`

**Headers**:
- `Authorization: Bearer <token>` (required)

**Query Parameters**:
- `confirm` (boolean, required: true)

### Response

**Success (204 No Content)**: Empty body

**Error Responses**:

- `400 Bad Request`: Missing confirmation or cannot delete only key result
  ```json
  {
    "error": {
      "code": "CANNOT_DELETE_ONLY_KEY_RESULT",
      "message": "Cannot delete the only key result; goal must have at least one key result or delete the goal instead"
    }
  }
### Response

**Success (204 No Content)**: Empty body

**Error Responses**:

- `400 Bad Request`: Missing confirmation
- `404 Not Found`: Key result not found

**Behavior**:
- Recalculates goal progress based on remaining key results
- If goal has only one key result, deletion may be rejected (design choice)

---

## Reorder Key Results

### Request

**Route**: `POST /api/goals/:goalId/key-results/reorder`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body**:
```typescript
interface ReorderKeyResultsRequest {
  orderedIds: KeyResultId[];  // Array of key result IDs in desired order
}
```

**Validation**:
- All IDs must belong to the goal
- Array length must match current key result count

### Response

**Success (200 OK)**:
```typescript
interface ReorderKeyResultsResponse {
  keyResults: KeyResultServerDTO[];  // From @dailyuse/contracts
}
```

---

## Batch Update Key Result Progress

### Request

**Route**: `POST /api/goals/:goalId/key-results/batch-update`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body**:
```typescript
interface BatchUpdateProgressRequest {
  updates: Array<{
    keyResultId: KeyResultId;
    currentValue: number;
    note?: string;
  }>;
}
```

**Validation**:
- All key results must belong to the goal
- Individual validations apply to each update

### Response

**Success (200 OK)**:
```typescript
interface BatchUpdateProgressResponse {
  keyResults: KeyResultServerDTO[];  // From @dailyuse/contracts
  goal: GoalServerDTO;               // With recalculated progress (once)
}
```

**Behavior**:
- Processes all updates in a single transaction
- Recalculates goal progress once after all updates
- More efficient than individual updates for bulk progress tracking

---

## Notes

- All timestamps are Unix timestamps in milliseconds
- All IDs use strong types: `GoalId`, `KeyResultId`, `IdentityId`
- Authentication extracts `identityId` from JWT token
- Progress calculation is performed by the domain layer
- Weight changes trigger immediate goal progress recalculation
- Response DTOs use `KeyResultServerDTO` from `@dailyuse/contracts/modules/goal`
