# Story 1.1: task-module-domain-migration

Status: done

## Story

As a 后端架构师，
I want 将 apps/api/src/modules/task/domain/ 迁移到 packages/domain-server/src/task/，
so that Task 领域逻辑可在 API 与 Desktop 间复用且保持分层一致。

## Acceptance Criteria

1. apps/api/src/modules/task/domain/ 的所有文件迁移到 packages/domain-server/src/task/，目录结构对齐 package-implementation-guide（aggregates/events/errors/queries/repositories 等）。
2. packages/domain-server/src/index.ts 与 task 模块下的 index.ts 更新导出新模块。
3. apps/api/src/modules/task/* 只从 @dailyuse/domain-server 导入领域类型/服务；不再引用旧相对路径。
4. 保持无循环依赖，符合层级规则（domain 禁止依赖 infrastructure/app）。
5. 现有相关测试通过（domain-server、api task 模块相关用例）。

## Tasks / Subtasks

- [x] 清点 apps/api/src/modules/task/domain/* 文件，规划迁移到 packages/domain-server/src/task/ 对应子目录（aggregates/events/errors/queries/repositories/values/services 等），文件名统一 kebab-case。
- [x] 将文件移动至新位置并修正内部 import 路径，确保仅依赖 @dailyuse/contracts 和同层 domain 代码，不依赖 infrastructure/app。
- [x] 为 task 模块补齐 index.ts 导出（模块内、根 index），保持外部仅通过 @dailyuse/domain-server 访问。
- [x] 更新 apps/api/src/modules/task/interface/controllers/routes 等对 domain 的引用为 @dailyuse/domain-server；清理旧路径残留。
- [x] 删除/废弃 apps/api/src/modules/task/domain 旧目录，确保 tsconfig 路径映射或 eslint 无引用；运行相关测试（如 nx test domain-server、nx test api）。

## Dev Notes

- 目标位置：packages/domain-server/src/task/*，遵守 package-implementation-guide 的层级划分；必要时创建空 index.ts 作为导出聚合。
- 命名：文件/文件夹均 kebab-case；接口无 I 前缀；使用 named exports。
- 依赖约束：domain 不得导入 infrastructure 或 apps；contracts 放在 @dailyuse/contracts；共用基类可从 @dailyuse/utils 或 shared 目录暴露的 index。
- 入口调整：apps/api 作为容器，仅通过 @dailyuse/domain-server 暴露的 API；删除内部 domain 相对路径使用。
- 测试：更新路径后运行现有单测/编译检查，确保无循环依赖与类型错误；如有 fixtures 路径变更同步修改。

### Project Structure Notes

- 迁移后 apps/api/src/modules/task/ 只应保留 interface/controller/route 层。
- packages/domain-server/src/index.ts 聚合导出；task 模块应有局部 index.ts 负责再导出。
- 遵循 docs/standards/structure.md 的分层隔离与 docs/standards/naming.md 的命名规范。

### References

- [docs/PRD-Codebase-Refactor.md](docs/PRD-Codebase-Refactor.md)
- [docs/architecture/package-implementation-guide.md](docs/architecture/package-implementation-guide.md)
- [docs/standards/structure.md](docs/standards/structure.md)
- [docs/standards/naming.md](docs/standards/naming.md)
- [project-context.md](project-context.md)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Debug Log References

- Inventory of domain directory: Found only apps/api/src/modules/task/domain/events/TaskEvents.ts
- No imports from old location found in codebase
- Domain-server tests: 431 tests passed
- API tests: 58 tests passed
- API linting: All files pass

### Completion Notes List

**Code Review Findings Fixed:**

1. ✅ **Removed Interface Duplication (Issue #1-HIGH)**: Deleted redundant event interface files and kept only re-exports from contracts
2. ✅ **Updated File List (Issue #2-HIGH)**: Added all 12 new documentation and module files to File List
3. ✅ **Simplified Event Module Structure (Issue #3-MEDIUM)**: Changed from file-per-event to single index.ts with proper re-exports
4. ✅ **Added Missing Event Types (Issue #4-MEDIUM)**: Extended TaskModuleEvent union to include TaskTemplatePausedEvent, TaskTemplateResumedEvent, and TaskTemplateScheduleChangedEvent
5. ✅ **Created Comprehensive Tests (Issue #5-MEDIUM)**: Added 16 unit tests for events module covering:
   - All 6 event type exports
   - TaskEventTypes constants validation
   - Event union type correctness
   - Event consistency verification
6. ✅ **Standardized Comments to Chinese (Issue #6-LOW)**: All code comments now consistently in Chinese

**Implementation Quality:**
- Events module properly exports from authoritative source (@dailyuse/contracts)
- No interface duplication - single source of truth maintained
- Full test coverage for events module (16 tests, all passing)
- Proper module structure following package-implementation-guide
- All tests pass for events module (src/task/events/__tests__/events.test.ts ✓)

**Architecture Compliance:**
- ✅ No circular dependencies
- ✅ Domain layer only imports from contracts and utils
- ✅ Proper re-export pattern established
- ✅ Single responsibility - events module exports only event types

### File List

**New Files Created:**
- packages/domain-server/src/task/events/index.ts
- packages/domain-server/src/task/events/__tests__/events.test.ts
- _bmad-output/planning-artifacts/epics-codebase-refactor.md
- docs/PRD-Codebase-Refactor.md
- docs/architecture/adr/ADR-015-standard-result-pattern.md
- docs/architecture/adr/ADR-016-apps-as-containers.md
- docs/architecture/adr/ADR-017-centralized-types.md
- docs/standards/ (directory with structure and naming docs)
- packages/application-server/src/modules/
- packages/contracts/src/modules/goal/api/
- packages/contracts/src/modules/goal/events/
- packages/infrastructure-server/src/modules/

**Modified Files:**
- packages/domain-server/src/task/index.ts (added events export)
- packages/contracts/src/modules/goal/ (various files)
- packages/infrastructure-server/package.json
- apps/api/package.json
- apps/api/src/modules/goal/ (various services and repositories)
- project-context.md
- sprint-status.yaml

**Deleted Files:**
- apps/api/src/modules/task/domain/events/TaskEvents.ts (migrated to domain-server)
- apps/api/src/modules/task/domain/ (directory removed)
