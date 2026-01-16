# Task API - Sorting & Filtering Guide

**Story:** 2.5 - 支持排序参数和过滤选项 - 后端扩展  
**Status:** Ready for development  
**Version:** 1.0

## Overview

The Task API now supports flexible sorting and filtering of task lists through the `sortBy` and `filterBy` query parameters. This enables clients to customize how tasks are displayed without needing backend-specific implementations.

## Quick Start

```bash
# Get high-priority active tasks
GET /api/task-templates?sortBy=priority&filterBy=importance:important&filterBy=status:active

# Get all tasks due in next 7 days, sorted by due date
GET /api/task-templates?sortBy=dueDate&filterBy=dueDate:upcoming

# Get all overdue tasks
GET /api/task-templates?filterBy=dueDate:overdue

# Get vital tasks sorted by creation time
GET /api/task-templates?sortBy=createdAt&filterBy=importance:vital
```

## Sorting Options (sortBy)

### priority (default)

Returns tasks sorted by calculated priority score (descending).

- **Formula:** `priority = (importance * 0.6) + (urgency * 0.4)`
- **Range:** 0-100 (higher = more important)
- **Backlog tasks:** Sorted by importance only (no due date penalty)

**Example:**
```
GET /api/task-templates?sortBy=priority
```

### dueDate

Returns tasks sorted by due date (ascending).

- **Earlier due dates** appear first
- **Tasks without due date** appear last
- Useful for deadline-driven planning

**Example:**
```
GET /api/task-templates?sortBy=dueDate
```

### createdAt

Returns tasks sorted by creation time (descending).

- **Most recently created** tasks appear first
- Useful for recent activity view

**Example:**
```
GET /api/task-templates?sortBy=createdAt
```

### importance

Returns tasks sorted by importance level (descending).

- **Order:** Vital > Important > Moderate > Minor > Trivial
- Useful for importance-focused prioritization

**Example:**
```
GET /api/task-templates?sortBy=importance
```

## Filtering Options (filterBy)

All filters support multiple values with **AND logic** - all filter conditions must be satisfied.

### Importance Filters

Filter tasks by importance level (inclusive threshold):

- `importance:vital` - Only tasks marked as Vital
- `importance:important` - Important and above (Important + Vital)
- `importance:moderate` - Moderate and above (Moderate + Important + Vital)
- `importance:minor` - Minor and above
- `importance:trivial` - All tasks (no filtering)

**Example:**
```
GET /api/task-templates?filterBy=importance:important
→ Returns: Vital + Important tasks only
```

### Status Filters

Filter tasks by current status (exact match):

- `status:active` - Active tasks only
- `status:completed` - Completed tasks only
- `status:blocked` - Blocked tasks only
- `status:cancelled` - Cancelled tasks only

**Example:**
```
GET /api/task-templates?filterBy=status:active
→ Returns: Only active tasks
```

### Time Filters

Filter tasks by due date relationships:

- `dueDate:overdue` - Tasks past their due date
- `dueDate:today` - Tasks due today
- `dueDate:upcoming` - Tasks due in next 7 days
- `dueDate:noDueDate` - Tasks without a due date

**Example:**
```
GET /api/task-templates?filterBy=dueDate:overdue
→ Returns: Only overdue tasks
```

## Combining Parameters

### Multiple Filters (AND Logic)

When you specify multiple `filterBy` parameters, they are combined with **AND logic**:

```
GET /api/task-templates?filterBy=importance:important&filterBy=status:active
→ Returns: Tasks that are BOTH important AND active
```

### Sorting with Filtering

Filters are applied first, then sorting is applied to the filtered results:

```
GET /api/task-templates?sortBy=dueDate&filterBy=importance:vital&filterBy=status:active
→ Step 1: Filter to vital + active tasks
→ Step 2: Sort results by due date ascending
```

## Response Format

### Success Response (200 OK)

```json
{
  "ok": true,
  "data": {
    "templates": [
      {
        "uuid": "task-123",
        "title": "Important task",
        "importance": "VITAL",
        "priority": 95,
        "dueDate": 1705363200000,
        "status": "ACTIVE",
        ...
      }
    ],
    "meta": {
      "count": 5,
      "sortedBy": "dueDate",
      "filteredBy": ["importance:vital", "status:active"]
    }
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "ok": false,
  "error": "Invalid sortBy value: \"invalid\". Allowed values: priority, dueDate, createdAt, importance"
}
```

## Backward Compatibility

The new parameters are **optional and backward compatible**:

- If you don't provide `sortBy`, defaults to `priority`
- If you don't provide `filterBy`, no filtering is applied
- Old parameters (`status`, `folderUuid`, `goalUuid`, `tags`) still work but are deprecated
- Mix old and new parameters (old ones are ignored if new ones are present)

```
# Old style (deprecated)
GET /api/task-templates?status=ACTIVE

# New style (preferred)
GET /api/task-templates?filterBy=status:active

# Both work (new parameters take precedence)
GET /api/task-templates?sortBy=priority&filterBy=status:active
```

## Implementation Notes

### Performance

- All filtering/sorting happens in-memory after fetching tasks
- Suitable for typical daily-use scenarios (< 5,000 tasks)
- For larger datasets (> 10,000 tasks), consider database-level optimization

### Validation

- All parameter values are case-sensitive
- Invalid `sortBy` or `filterBy` values return 400 Bad Request
- Parameter validation messages clearly indicate allowed values

### Client Implementation

**JavaScript/TypeScript:**

```typescript
// Web client
const tasks = await taskApiClient.getTaskTemplates({
  sortBy: 'dueDate',
  filterBy: ['importance:vital', 'status:active'],
});

// Desktop client
const tasks = taskStore.getTemplatesWithFiltering({
  sortBy: 'priority',
  filterBy: ['dueDate:overdue'],
});
```

## Common Use Cases

### 1. Today's Urgent Tasks

```
GET /api/task-templates?sortBy=dueDate&filterBy=importance:important&filterBy=dueDate:today
```

Returns: Important tasks due today, sorted by due time

### 2. High-Priority Backlog

```
GET /api/task-templates?sortBy=priority&filterBy=importance:vital&filterBy=status:active
```

Returns: All vital active tasks, sorted by calculated priority

### 3. Overdue Items

```
GET /api/task-templates?filterBy=dueDate:overdue&filterBy=status:active
```

Returns: All active tasks that missed their deadline, sorted by priority (default)

### 4. Recent Important Changes

```
GET /api/task-templates?sortBy=createdAt&filterBy=importance:important
```

Returns: Recently created important tasks

### 5. No Deadline but Important

```
GET /api/task-templates?sortBy=priority&filterBy=dueDate:noDueDate&filterBy=importance:important
```

Returns: Important tasks without due dates, sorted by priority

## Migration Guide for Clients

### If You're Currently Using `status` Parameter

**Before:**
```
GET /api/task-templates?status=ACTIVE
```

**After:**
```
GET /api/task-templates?filterBy=status:active
```

### If You Want To Sort by Priority

**Before:**
```javascript
// Client-side sorting
const sorted = tasks.sort((a, b) => b.priority - a.priority);
```

**After:**
```
GET /api/task-templates?sortBy=priority
```

### Mixed Filtering and Sorting

**Before:**
```javascript
const filtered = tasks.filter(t => t.status === 'ACTIVE' && t.importance === 'VITAL');
const sorted = filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
```

**After:**
```
GET /api/task-templates?sortBy=dueDate&filterBy=status:active&filterBy=importance:vital
```

## FAQ

### Q: Can I combine multiple filterBy values?

**A:** Yes! Use AND logic by repeating the `filterBy` parameter:

```
?filterBy=importance:vital&filterBy=status:active
```

### Q: What's the difference between `importance:vital` and `importance:important`?

**A:** `importance:vital` returns ONLY vital tasks.  
`importance:important` returns important AND vital tasks (threshold-based).

### Q: Which sortBy should I use?

- **priority** - Daily task management (default)
- **dueDate** - Deadline-focused planning
- **createdAt** - Activity tracking
- **importance** - Pure importance-based view

### Q: What if I don't provide sortBy or filterBy?

**A:** You get the default behavior:
- `sortBy` defaults to `priority` (calculated priority score)
- `filterBy` defaults to no filtering (all active tasks)

### Q: Are the parameters case-sensitive?

**A:** Yes. Use lowercase: `sortBy=priority`, not `sortBy=PRIORITY`.

### Q: What's the response format for filtered/sorted results?

**A:** The response includes a `meta` object with:
- `count` - Number of results
- `sortedBy` - Applied sort field
- `filteredBy` - Applied filters array

## References

- [Story 2.1: In-Memory Task Sorting](../2-1-implement-task-list-in-memory-sorting-logic-get-tasks-with-priority-sorting.md)
- [Story 2.2: Frontend API Integration](../2-2-frontend-api-integration-get-sorted-task-list.md)
- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [OpenAPI Specification](../../http/routes/taskTemplateRoutes.ts)

## Support

For issues or questions about sorting/filtering:

1. Check response error messages - they indicate invalid parameters
2. Review examples above for correct parameter format
3. Ensure parameters are lowercase and match enum values
4. Verify filters are AND-combined (all must be satisfied)

---

**Last Updated:** 2026-01-16  
**Author:** Backend Development Team  
**Status:** Production Ready
