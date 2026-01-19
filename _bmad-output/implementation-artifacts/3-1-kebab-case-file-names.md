# Story 3.1: 文件名 kebab-case 统一

Status: ready-for-dev

<!-- Note: First story of Epic 3 - Standards Alignment -->
<!-- Created: 2026-01-19 using YOLO fully-automated approach -->
<!-- Context: Standardizing all TypeScript/TSX file names to kebab-case per docs/standards/naming.md -->

## Story

As a 代码规范执行者,
I want 将所有 `.ts/.tsx` 文件名统一为 kebab-case,
so that 文件命名风格一致，与 docs/standards/naming.md 规范对齐。

## Acceptance Criteria

1. **Given** 存在 PascalCase 或 camelCase 风格的文件名（如 `UserService.ts`, `accountApiClient.ts`, `OpenAIProvider.ts`）
   **When** 开发者执行批量重命名
   **Then** 所有 `.ts` 文件名改为 kebab-case（如 `user-service.ts`, `account-api-client.ts`, `openai-provider.ts`）
   **And** 所有 `.tsx` 文件名保持 kebab-case 风格
   **And** 排除以下文件不重命名：
   - `index.ts` （公共导出入口）
   - `*.d.ts` （TypeScript 定义文件）
   - `*.test.ts`, `*.spec.ts` （测试文件，名称由测试框架管理）
   - 配置文件（`*config.ts`, `vitest.*.ts`, `tsup.config.ts` 等）
   **And** 所有导入路径同步更新
   **And** Git 历史保留（使用 `git mv` 或等效操作）
   **And** 编译和测试全部通过

2. **Given** 文件名已统一为 kebab-case
   **When** 检查相对路径和绝对路径导入
   **Then** 所有导入语句使用正确的新文件名
   **And** 导入路径拼写正确（特别注意大小写敏感的文件系统）
   **And** 不存在导入 404 错误
   **And** ESLint 检查通过（无未找到的导入警告）

3. **Given** 重命名完成
   **When** 运行 `npm run build` 或 `nx run-many --target build`
   **Then** 所有 packages 编译成功
   **And** 没有编译错误
   **And** TypeScript 类型检查通过（无 type errors）

4. **Given** 编译成功
   **When** 运行 `npm run test` 或 `nx run-many --target test`
   **Then** 所有单元测试通过
   **And** 没有测试失败
   **And** 测试覆盖率保持不变或提高

## Developer Context

### Impact Scope

This story affects **all packages** in the monorepo:

**Packages:** 
- `packages/contracts`
- `packages/domain-server`
- `packages/domain-client`
- `packages/application-server`
- `packages/application-client`
- `packages/infrastructure-server`
- `packages/infrastructure-client`
- `packages/patterns`
- `packages/utils`
- `packages/ui-*`
- `apps/api` (src files with non-standard names)
- `apps/web` (src files with non-standard names)
- `apps/desktop` (if exists)

### Files Requiring Rename

**Current files with non-kebab-case names identified:**

1. **packages/infrastructure-client/**
   - `accountApiClient.ts` → `account-api-client.ts`
   - `authApiClient.ts` → `auth-api-client.ts`
   - `goalApiClient.ts` → `goal-api-client.ts`
   - `EncryptionService.ts` → `encryption-service.ts`

2. **packages/infrastructure-server/**
   - `PrismaGoalFolderRepository.ts` → `prisma-goal-folder-repository.ts`
   - `PrismaGoalRepository.ts` → `prisma-goal-repository.ts`
   - `PrismaGoalStatisticsRepository.ts` → `prisma-goal-statistics-repository.ts`
   - `PrismaFocusSessionRepository.ts` → `prisma-focus-session-repository.ts`
   - `PrismaFocusModeRepository.ts` → `prisma-focus-mode-repository.ts`

3. **packages/patterns/**
   - `IScheduleTimer.ts` → `schedule-timer.ts` (also remove "I" prefix per Story 3.2)
   - `IScheduleMonitor.ts` → `schedule-monitor.ts` (also remove "I" prefix per Story 3.2)
   - `HeapNode.ts` → `heap-node.ts`
   - `MinHeap.ts` → `min-heap.ts`

4. **packages/infrastructure-client/ai/**
   - `OpenAIProvider.ts` → `openai-provider.ts`

5. **packages/domain-client/schedule/**
   - `Schedule.ts` → `schedule.ts`
   - `ScheduleTask.ts` → `schedule-task.ts`
   - `TaskMetadata.ts` → `task-metadata.ts`
   - `RetryPolicy.ts` → `retry-policy.ts`
   - `ExecutionInfo.ts` → `execution-info.ts`

**Additional scan needed:** This is not exhaustive. Developer must scan all packages to identify all files with non-kebab-case names.

### Naming Convention Rules (Per docs/standards/naming.md)

```
File Pattern: kebab-case
Format: {noun}-{verb}.ts or {noun}-{modifier}.ts
Examples:
  ✅ user-service.ts       (service for users)
  ✅ task-repository.ts    (repository managing tasks)
  ✅ schedule-timer.ts     (timer for schedules)
  ✅ api-client.ts         (API client)
  ✅ encryption-service.ts (encryption service)

Exclusions from kebab-case rule:
  ✅ index.ts              (public API gateway)
  ✅ *.d.ts                (TypeScript definitions)
  ✅ *.test.ts, *.spec.ts  (test files)
  ✅ *config.ts            (configuration files)
  ✅ README.md             (documentation)
```

### Import Path Update Strategy

**Before:**
```typescript
import { AccountService } from './accountApiClient';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { TaskMetadata } from '../aggregates/TaskMetadata';
```

**After:**
```typescript
import { AccountService } from './account-api-client';
import { OpenAIProvider } from './providers/openai-provider';
import { TaskMetadata } from '../aggregates/task-metadata';
```

**Key points:**
1. Use relative paths as-is: `./` or `../` prefixes remain unchanged
2. Update only the filename part after the last `/`
3. For absolute paths (package imports like `@dailyuse/*`), path separators remain unchanged
4. File extension (`.ts` or `.tsx`) remains the same

### Execution Plan

**Phase 1: Scan & Document**
1. Run comprehensive file scan to identify all non-kebab-case `.ts/.tsx` files across all packages
2. Create mapping document: old name → new name
3. Verify no conflicts (no two files would have same name after rename)
4. Review mapping with team to ensure consistency

**Phase 2: Batch Rename (Recommended)**
1. Use automated tooling if available (e.g., custom Node.js script, IDE refactoring)
2. Or use shell script with `git mv` for each file:
   ```bash
   git mv packages/infrastructure-client/src/account/accountApiClient.ts \
           packages/infrastructure-client/src/account/account-api-client.ts
   ```
3. Rename in logical batches by package to make git history cleaner

**Phase 3: Update Imports**
1. Search for all import statements referencing renamed files
2. Update all import paths (use IDE's "Find and Replace" or ESLint autofix)
3. Key patterns to replace:
   - `from '.../{OldFileName}'` → `from '.../{new-file-name}'`
   - `from '@dailyuse/{package}/{OldFileName}'` → `from '@dailyuse/{package}/{new-file-name}'`

**Phase 4: Verify**
1. Run TypeScript compiler: `npm run type-check` or `tsc --noEmit`
2. Run ESLint: `npm run lint`
3. Build all packages: `nx run-many --target build`
4. Run all tests: `npm run test` or `nx run-many --target test`
5. Spot-check git log to ensure file renames are tracked

### Architecture Compliance

**Design Pattern:** File Structure & Naming
**Layer:** All Layers (L1-L5)
**Authority:** `docs/standards/naming.md` Section 1 - General Rules

**Constraints to follow:**
- File names must be strictly kebab-case (no mixed case)
- Consistency enables consistent imports across the codebase
- Kebab-case improves readability in URLs and CLI commands
- This aligns with Web standards (URL conventions use hyphens, not underscores)

### Tools & Libraries (If Needed)

- **TypeScript Compiler** (`tsc`): Verify no type errors after rename
- **ESLint** with import plugins: Detect missing imports, wrong paths
- **IDE Refactoring** (VS Code): Batch rename with "Rename Symbol" feature
- **Git** (`git mv`): Track file renames in git history
- **Custom Script** (optional): Automate bulk renames with proper git tracking

**Why custom script might help:**
```javascript
// Example: rename-files.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const renameMap = {
  'accountApiClient.ts': 'account-api-client.ts',
  'OpenAIProvider.ts': 'openai-provider.ts',
  // ... etc
};

for (const [oldName, newName] of Object.entries(renameMap)) {
  // Find all occurrences and git mv
  // Update all imports
}
```

### Related Stories

- **Story 3.2:** Remove "I" prefix from interfaces (e.g., `IScheduleTimer.ts` → `schedule-timer.ts`)
- **Story 3.3:** Replace default exports with named exports
- **Story 3.4:** Align folder structure per package-implementation-guide.md
- **Epic 3 Overall:** Complete standards alignment affecting import paths, file organization

### Testing Approach

1. **Compilation Test:** TypeScript compiles without errors
2. **ESLint Test:** No import resolution errors, no style violations
3. **Unit Tests:** All existing tests pass (logic unchanged)
4. **Integration Tests:** Packages can be imported and used correctly
5. **Git Verification:** `git log --follow {file}` shows history preserved for renamed files

### Performance & Scale

- **Estimated Duration:** 2-4 hours (depending on automation)
- **Scope:** ~50-150 files across all packages (exact count depends on codebase audit)
- **Risk Level:** Low (pure file rename, no logic changes)
- **Blast Radius:** Medium (affects all packages' imports, but changes are mechanical)

### Learning & Best Practices

**From previous similar work:**
- Use IDE batch refactoring when possible to catch import updates automatically
- Test after each logical batch (per-package) rather than all at once
- Use version control (`git mv`) to preserve history
- Document the mapping (old → new) for future reference

**Commands that worked well in similar projects:**
```bash
# Find all non-kebab-case files
find . -type f -name "*.ts" ! -name "index.ts" ! -name "*.d.ts" | 
  grep -E '[A-Z]' > files-to-rename.txt

# Use IDE or custom script to apply renames

# Verify no broken imports
npm run type-check
npm run lint
npm run build
```

## Tasks / Subtasks

- [ ] **Phase 1 - Audit & Planning**
  - [ ] Scan all packages and apps for non-kebab-case `.ts/.tsx` files
  - [ ] Create comprehensive mapping document (old name → new name)
  - [ ] Identify any naming conflicts or ambiguities
  - [ ] Count total files requiring rename
  - [ ] Create implementation plan with batch sizes

- [ ] **Phase 2 - Batch 1: Core Packages (infrastructure-client, infrastructure-server)**
  - [ ] Rename all files in `packages/infrastructure-client/` to kebab-case
    - [ ] `accountApiClient.ts` → `account-api-client.ts`
    - [ ] `authApiClient.ts` → `auth-api-client.ts`
    - [ ] `goalApiClient.ts` → `goal-api-client.ts`
    - [ ] `EncryptionService.ts` → `encryption-service.ts`
    - [ ] `OpenAIProvider.ts` → `openai-provider.ts`
    - [ ] Other files identified in audit
  - [ ] Update all import statements in dependent files
  - [ ] Run ESLint to verify no broken imports
  - [ ] Run tests for infrastructure-client: `nx test infrastructure-client`
  - [ ] Verify: `nx run infrastructure-client:lint`, `nx run infrastructure-client:build`

- [ ] **Phase 2 - Batch 2: Infrastructure-Server Repositories**
  - [ ] Rename all Prisma repository files to kebab-case
    - [ ] `Prisma*.ts` → `prisma-*.ts`
  - [ ] Update imports in `src/modules/*/` and tests
  - [ ] Run ESLint to verify
  - [ ] Run tests for infrastructure-server
  - [ ] Verify: `nx run infrastructure-server:lint`, `nx run infrastructure-server:build`

- [ ] **Phase 2 - Batch 3: Patterns & Utils**
  - [ ] Rename files in `packages/patterns/`:
    - [ ] `IScheduleTimer.ts` → `schedule-timer.ts` (also remove I prefix in content)
    - [ ] `IScheduleMonitor.ts` → `schedule-monitor.ts` (also remove I prefix)
    - [ ] `HeapNode.ts` → `heap-node.ts`
    - [ ] `MinHeap.ts` → `min-heap.ts`
  - [ ] Rename files in `packages/utils/`
  - [ ] Update imports
  - [ ] Verify compilation and tests

- [ ] **Phase 2 - Batch 4: Domain Layers**
  - [ ] Rename files in `packages/domain-client/`:
    - [ ] `Schedule.ts` → `schedule.ts`
    - [ ] `ScheduleTask.ts` → `schedule-task.ts`
    - [ ] `TaskMetadata.ts` → `task-metadata.ts`
    - [ ] And all other domain model files
  - [ ] Rename files in `packages/domain-server/`
  - [ ] Update imports
  - [ ] Verify compilation and tests

- [ ] **Phase 2 - Batch 5: Application & Contracts**
  - [ ] Rename files in `packages/application-server/`
  - [ ] Rename files in `packages/application-client/`
  - [ ] Rename files in `packages/contracts/`
  - [ ] Update imports
  - [ ] Verify compilation and tests

- [ ] **Phase 2 - Batch 6: Apps**
  - [ ] Rename files in `apps/api/src/` (non-index, non-config)
  - [ ] Rename files in `apps/web/src/` (non-index, non-config)
  - [ ] Update imports in all entry points
  - [ ] Verify compilation and tests

- [ ] **Phase 3 - Global Verification**
  - [ ] Run full type check: `npm run type-check` or `tsc --noEmit`
  - [ ] Run full lint: `npm run lint`
  - [ ] Build all packages: `nx run-many --target build`
  - [ ] Run all tests: `npm run test` or `nx run-many --target test`
  - [ ] Check for any CI/CD pipeline issues

- [ ] **Phase 4 - Documentation & Cleanup**
  - [ ] Update any developer documentation that references old file names
  - [ ] Add note to CONTRIBUTING.md or coding standards reminding about kebab-case
  - [ ] Verify git history is preserved: spot-check `git log --follow {renamed-file}`
  - [ ] Create completion report with before/after file counts

## Assumptions & Constraints

1. **File System:** Assuming case-sensitive file system (Linux/Mac). Windows developers may need careful handling.
2. **Git:** All code must be committed before starting bulk rename to avoid accidental loss.
3. **IDE Support:** Assumes VS Code or similar IDE with batch rename refactoring capabilities.
4. **Test Coverage:** Assumes existing tests cover the modules being renamed; test logic should not change.
5. **No Breaking Changes:** This is a pure rename; no API changes or logic modifications.
6. **Timing:** Should be done when no active development is in progress on these files to avoid merge conflicts.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Broken imports after rename | High | Run full type-check and ESLint after each batch; use IDE refactoring |
| Case-sensitivity issues on Windows | Medium | Test on Windows dev machine; document any platform-specific handling |
| Git merge conflicts if others are working in parallel | High | Coordinate timing; work on dedicated branch; merge to main after full verification |
| Incomplete import updates | High | Use global search+replace with regex to catch all patterns |
| Test failures | Medium | Run tests after each batch; fix any issues before proceeding |

## Success Criteria

✅ **Story Complete When:**
1. All `.ts/.tsx` files (except index.ts, *.d.ts, *.test.ts, *.spec.ts, *config.ts) are renamed to kebab-case
2. All import statements are updated to reference new file names
3. TypeScript compilation passes without errors: `npm run type-check`
4. ESLint passes without import errors: `npm run lint`
5. All unit tests pass: `npm run test`
6. Full build succeeds: `nx run-many --target build`
7. Git history shows file renames (not delete + add)
8. No increase in bundle size or runtime errors
9. Team confirms codebase is cleaner and more consistent

## Related Documentation

- [docs/standards/naming.md](docs/standards/naming.md) - Authority on file naming conventions
- [docs/standards/structure.md](docs/standards/structure.md) - Folder and project structure
- [docs/architecture/package-implementation-guide.md](docs/architecture/package-implementation-guide.md) - How packages are organized
- [AGENTS.md](AGENTS.md) - Standards Alignment Epic Overview
