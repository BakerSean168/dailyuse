# Naming Conventions

## 1. General Rules

| Entity | Case Style | Pattern | Positive Example (Do) | Negative Example (Don't) |
| --- | --- | --- | --- | --- |
| **Class** | PascalCase | `Noun` | `UserProfile` | `userProfile`, `user_profile` |
| **Interface** | PascalCase | `Noun` | `TaskRepository` | `ITaskRepository` (No 'I' prefix) |
| **Variable** | camelCase | `noun` / `adjNoun` | `userList`, `isValid` | `UserList`, `user_list` |
| **Function** | camelCase | `verbNoun` | `createUser`, `fetchData` | `CreateUser` |
| **Constant** | SCREAMING_SNAKE | `NOUN_VERB` | `MAX_RETRY_COUNT` | `maxRetryCount` |
| **File (.ts/js)** | kebab-case | `noun-verb` | `user-service.ts` | `UserService.ts` |
| **React Comp** | PascalCase | `Noun` | `SubmitButton.tsx` | `submit-button.tsx` |
| **Folder** | kebab-case | `noun` | `user-profile` | `UserProfile` |

## 2. Exports
- **Prefer named exports** over default exports to ensure consistent naming during imports.
```typescript
// ✅ Do
export class UserService {}

// ❌ Don't
export default class UserService {}
```
