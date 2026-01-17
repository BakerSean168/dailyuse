# Code Patterns & Anti-Patterns

## 1. 🚨 Zero-Compromise Rules

### Rule #1: Type Centralization (`@dailyuse/contracts`)
- **NEVER** define shared types, DTOs, or Interfaces in `application-*` or `infrastructure-*` if they are used across boundaries.
- **ALWAYS** place them in `packages/contracts`.

### Rule #2: API Response Format
- **ALWAYS** use `ok: boolean`. **NEVER** use `success: boolean`.

#### ✅ Pattern: Standard Result
```typescript
import type { ActionResult } from '@dailyuse/contracts';

export async function doSomething(): Promise<ActionResult> {
  // Logic...
  return { ok: true };
}
```

#### ❌ Anti-Pattern: Ad-hoc Structure
```typescript
return { success: true, message: "Done" }; // Wrong key 'success'
```

### Rule #3: Layer Isolation
- **Domain** code must NOT import from `infrastructure`.

#### ✅ Pattern: Dependency Inversion
```typescript
// Domain: defines interface
export interface TaskRepository {
  save(task: Task): Promise<void>;
}

// Application: uses interface
export class AssignmentService {
  constructor(private repo: TaskRepository) {}
}
```

#### ❌ Anti-Pattern: Direct Dependency
```typescript
// Domain: imports implementation
import { prisma } from '@dailyuse/infrastructure-server'; // FORBIDDEN
```
