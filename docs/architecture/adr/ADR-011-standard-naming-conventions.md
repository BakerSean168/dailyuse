# ADR-011: Standard - Naming Conventions

## Status
Accepted

## Date
2026-01-15

## Context
Inconsistent naming (kebab-case vs PascalCase files, inconsistent variable names) increases cognitive load and makes file navigation difficult.

## Decision
We enforce strict naming conventions for files and symbols to maintain uniformity.

### 1. File & Directory Naming
*   **ALL files and directories:** `kebab-case` (lowercase, hyphens).
*   **Examples:** `task-service.ts`, `user-profile-view.vue`, `use-auth.ts`.
*   **Why:** Case sensitivity issues on different OS (Windows/Mac/Linux) are avoided.

### 2. Code Symbol Naming
*   **Classes / Interfaces / Types:** `PascalCase` (`TaskService`, `IUserRepo`).
*   **Variables / Functions / Methods:** `camelCase` (`getTask`, `isLoading`).
*   **Constants:** `SNAKE_CASE` (or camelCase for simple consts, specific rule: `default_page_size` per previous standard). *Correction: Following common TS practice, global consts are UPPER_SNAKE, but local consts are camel. Previous standard mentioned snake_case for constants.*
*   **Boolean vars:** Prefix with `is`, `has`, `can`, `should` (e.g., `isValid`).

### 3. Specific Patterns
*   **DTOs:** Suffix with `Request`, `Response`, or `DTO` (`CreateUserRequest`).
*   **Composables:** Prefix with `use` (`useTheme`).
*   **Components:** `PascalCase` export (`TaskCard`), `kebab-case` filename (`task-card.vue`).

### 4. Examples
*   File: `modules/goal/application/goal-service.ts`
*   Class: `export class GoalService { ... }`

## Consequences
*   **Positive:** Predictable file locations; Reduced git merge conflicts due to casing; Professional codebase appearance.
*   **Negative:** Renaming existing PascalCase files will lose git history for those specific files unless carefully done.
