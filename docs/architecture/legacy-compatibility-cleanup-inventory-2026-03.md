# Legacy Compatibility Cleanup Inventory (2026-03)

## Purpose

This document inventories historical compatibility layers, legacy code paths, stale comments, deprecated interfaces, placeholder implementations, and old contracts that still exist in the repository.

The goal is to prepare a safe, staged cleanup pass that removes obsolete compatibility code without breaking active product flows.

## Scope

This audit focused on:

- `apps/*`
- `packages/*`
- desktop Electron glue, preload, IPC, and composition roots
- frontend composables, stores, routes, and UI-level compatibility wrappers
- package-level deprecated containers, facades, aliases, and initialization hooks

## Summary

This inventory started as a prep document and has now been partially executed.

The repo still contains four major categories of cleanup debt:

1. deprecated compatibility facades and singleton containers
2. placeholder or partial frontend methods still exposed as real APIs
3. old IPC/routes/contracts preserved for backward compatibility
4. stale comments/docs that no longer match the current implementation

Some items have already been removed. Others are still active compatibility bridges and need consumer migration first.

## Completed In This Cleanup Pass

- Removed desktop preload/system compatibility wrappers for `app:getInfo`, `app:checkDIStatus`, and `system:getDIStatus`.
- Removed app-vue compatibility exports for setting aliases and dashboard type re-exports.
- Removed compatibility-only repository component exports from the main barrel.
- Removed deprecated API initialization files for authentication, repository, schedule, and task.
- Removed deprecated DI/container files for authentication, goal, schedule, task, and ai.
- Removed deprecated auth offline-mode IPC alias.
- Removed deprecated public exports for authentication, goal, and ai legacy module/container wrappers.
- Removed notification compatibility facade exports and deleted the facade implementation file.
- Removed the reminder `schedule-shim.d.ts` shim and refactored reminder handler support away from `ScheduleContainer`.
- Renamed editor desktop IPC channels away from the old `editor:document:*` / `editor:content:*` compatibility naming.
- Migrated the API RBAC middleware off legacy result-builder exports and stopped re-exporting those legacy result helpers from the contracts root.
- Removed duplicate legacy repository API request interfaces from contracts and aligned the repository RPC map to canonical Zod-derived request types.
- Implemented governance revisions loading, notification dismiss-all, and account settings update end to end.

## Remaining Highest-Value Debt

- desktop shared initialization shell in `apps/desktop/src/shared/initialization/index.ts`
- legacy result exports in `packages/contracts/src/result/http.ts`
- frontend product stubs like governance revisions, account settings fake success, and notification dismiss-all
- desktop singleton-style managers that still bypass the newer lifecycle/composition-root direction
- historical docs/ADR content that still references removed containers and old initialization flows

## A. Safe Or Mostly Safe Removals First

These are the best candidates for the first cleanup pass.

### 1. Desktop DI status compatibility shim

- Files:
  - `apps/desktop/src/main/di/index.ts`
  - `apps/desktop/src/main/ipc/system-handlers.ts`
- Why this is debt:
  - the old DI facade is effectively inert after `ElectronBootstrapper`
  - `configureMainProcessDependencies()` and `resetAllContainers()` are no-ops
  - DI status checks still exist only for compatibility
- Removal risk: medium
- Blockers:
  - remove `app:checkDIStatus` / `system:getDIStatus` consumers first
  - then remove related contract constants and tests

### 2. Desktop shared initialization shell

- Files:
  - `apps/desktop/src/shared/initialization/index.ts`
  - `apps/desktop/src/shared/initialization/infraInitialization.ts`
- Why this is debt:
  - this path appears superseded by `ElectronBootstrapper`
  - remaining logic is shell/registration style code with no clear active role
- Removal risk: low
- Blockers:
  - confirm nothing external imports `registerAllInitializationTasks()`

### 3. Preload convenience wrappers over generic IPC

- Files:
  - `apps/desktop/src/preload/preload.ts`
  - `apps/desktop/src/main/ipc/system-handlers.ts`
- Why this is debt:
  - `getAppInfo()` and `checkDIStatus()` are backward-compat helper methods on top of the generic bridge
  - no in-repo callers were identified during audit
- Removal risk: low-medium
- Blockers:
  - confirm no renderer code outside this repo depends on `window.electronAPI.getAppInfo()` or `window.electronAPI.checkDIStatus()`

### 4. Setting store/composable backward-compat aliases

- Files:
  - `packages/app-vue/src/modules/setting/stores/settingStore.ts`
  - `packages/app-vue/src/modules/setting/stores/userSettingStore.ts`
  - `packages/app-vue/src/modules/setting/composables/useUserSetting.ts`
- Why this is debt:
  - compatibility aliases remain exported with no known in-repo callers
- Removal risk: medium
- Blockers:
  - confirm no downstream imports depend on `useSettingStore` or `useUserSettingData`

### 5. Dashboard type re-exports for backward compatibility

- File:
  - `packages/app-vue/src/modules/dashboard/composables/useDashboard.ts`
- Why this is debt:
  - it re-exports types only for backward compatibility
  - current internal imports already use the canonical types file
- Removal risk: low
- Blockers:
  - verify no external imports rely on the re-exported type surface

### 6. Repository compatibility-only folder-first panels

- Files:
  - `packages/app-vue/src/modules/repository/components/index.ts`
  - `packages/app-vue/src/modules/repository/components/FileTreePanel.vue`
  - `packages/app-vue/src/modules/repository/components/FilesPanel.vue`
  - `packages/app-vue/src/modules/repository/components/ResourcesPanel.vue`
- Why this is debt:
  - these are explicitly documented as compatibility-only components
  - audit found only self/storybook-style references
- Removal risk: low
- Blockers:
  - remove stories/demo references first

### 7. Deprecated no-op initialization hooks

- Files:
  - `packages/schedule/src/api/initialization.ts`
  - `packages/authentication/src/api/initialization.ts`
  - `packages/repository/src/api/initialization.ts`
- Why this is debt:
  - these preserve older startup contracts that are now replaced by runtime/module composition
  - at least one path is explicitly a no-op compatibility stub
- Removal risk: low-medium
- Blockers:
  - remove re-exports from API barrels
  - verify no legacy bootstrap path still imports these symbols

### 8. Stale docs/comments that no longer match reality

- Files:
  - `packages/notification/COMPOSITION_ROOT.md`
  - `packages/notification/REFACTOR_PLAYBOOK.md`
  - `packages/repository/REFACTOR_PLAYBOOK.md`
  - `packages/goal/src/shared/di.ts`
- Why this is debt:
  - docs/comments still describe removed singleton/client/container patterns
- Removal risk: low
- Blockers:
  - none beyond updating documentation references

## B. Compatibility Bridges That Need Consumer Migration First

These should not be deleted until callers are migrated.

### 9. Offline-mode auth alias still exposed over IPC

- Status: removed in this cleanup pass

- Files:
  - `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
  - `apps/desktop/src/main/modules/authentication/desktop-auth.electron-module.ts`
- Why this is debt:
  - `enterOfflineMode()` is deprecated and only aliases `enterGuestMode()`
  - old IPC channel remains registered
- Removal risk: medium
- Blockers:
  - remove `auth:enter-offline-mode` from contracts, adapters, and tests
  - migrate any renderer or external consumers to guest mode

### 10. Schedule deprecated container still has a live downstream dependency

- Status: removed in this cleanup pass

- Files:
  - `packages/schedule/src/infrastructure-server/di/schedule-container.ts`
  - `packages/schedule/src/infrastructure-server/index.ts`
  - `packages/reminder/src/application-server/handlers/reminder-handler-support.ts`
  - `packages/reminder/src/schedule-shim.d.ts`
- Why this is debt:
  - deprecated schedule singleton container still exists because reminder code depends on it
- Removal risk: high
- Blockers:
  - reminder must stop importing `ScheduleContainer`
  - schedule package must provide proper emitted declarations so `schedule-shim.d.ts` can be removed

### 11. Authentication deprecated module/class exports

- Status: public exports removed in this cleanup pass

- Files:
  - `packages/authentication/src/infrastructure-server/authentication.module.ts`
  - `packages/authentication/src/index.ts`
  - `packages/authentication/src/infrastructure-server/index.ts`
  - `packages/authentication/src/application-client/index.ts`
- Why this is debt:
  - deprecated class facade and singleton proxy remain in public exports
- Removal risk: medium
- Blockers:
  - remove from package root only after confirming no downstream imports use them

### 12. Goal deprecated module/container exports

- Status: public exports removed in this cleanup pass

- Files:
  - `packages/goal/src/infrastructure-server/goal.module.ts`
  - `packages/goal/src/infrastructure-server/index.ts`
  - `packages/goal/src/infrastructure-server/di/goal-container.ts`
- Why this is debt:
  - old module/container path remains exported after migration to composition-root style assembly
- Removal risk: medium
- Blockers:
  - remove package-root exports only after caller audit

### 13. Task deprecated singleton DI container

- Status: removed in this cleanup pass

- Files:
  - `packages/task/src/infrastructure-server/di/task-container.ts`
  - `packages/task/src/infrastructure-server/di/index.ts`
  - `packages/task/src/api/initialization.ts`
- Why this is debt:
  - old singleton container and initialization path remain for compatibility
- Removal risk: medium
- Blockers:
  - verify no old bootstrap path still depends on registration/init symbols

### 14. AI deprecated module wrappers and container

- Status: public exports and DI files removed in this cleanup pass

- Files:
  - `packages/ai/src/infrastructure-server/ai.module.ts`
  - `packages/ai/src/infrastructure-server/powersync.ts`
  - `packages/ai/src/infrastructure-server/di/ai-container.ts`
  - `packages/ai/src/infrastructure-server/di/ai-repository.factory.ts`
  - `packages/ai/src/index.ts`
- Why this is debt:
  - deprecated wrappers and legacy container are still exported from the package root
- Removal risk: medium
- Blockers:
  - migrate external consumers to canonical factories before deleting exports

### 15. Notification compatibility facades

- Status: removed in this cleanup pass

- File:
  - `packages/notification/src/application-server/use-cases/commands/notification-application-services.ts`
- Why this is debt:
  - old facade classes still coexist with the canonical module API
  - they now delegate to real behavior, but they still preserve the old shape
- Removal risk: medium
- Blockers:
  - identify and migrate any callers still constructing the old classes directly

### 16. Editor legacy IPC channel surface

- Status: canonical channel names applied in this cleanup pass

- Files:
  - `packages/editor/src/electron-entry/index.ts`
  - `packages/contracts/src/electron/ipc-channels.ts`
- Why this is debt:
  - editor workspace/document operations still ride old `editor:document:*` channel names for compatibility
  - some content operations also bridge into repository content paths
- Removal risk: high
- Blockers:
  - all renderer/electron clients must migrate to canonical channel names first
  - tests/contracts must be updated together

### 17. Legacy result exports still broadly re-exported

- Status: public root/result re-exports removed in this cleanup pass; deprecated aliases still exist only inside `packages/contracts/src/result/http.ts`

- Files:
  - `packages/contracts/src/result/http.ts`
  - `packages/contracts/src/result/index.ts`
  - `packages/contracts/src/index.ts`
  - active consumer: `apps/api/src/shared/infrastructure/http/middlewares/rbacMiddleware.ts`
- Why this is debt:
  - old response-builder/result symbols still exist in public exports
- Removal risk: high
- Blockers:
  - migrate active consumers off `ResponseCode` / `ResponseBuilder` style exports first

### 18. Repository legacy interface duplication in contracts

- Status: removed in this cleanup pass

- Files:
  - `packages/contracts/src/modules/repository/api/index.ts`
  - `packages/contracts/src/modules/repository/protocol/repository-rpc-map.ts`
- Why this is debt:
  - old interfaces coexist with the newer Zod-derived API types
- Removal risk: medium
- Blockers:
  - RPC map and downstream imports must be migrated before deletion

## C. Real Product Debt Hidden Behind Old APIs

These are not just stale wrappers. They are still exposed behaviors that remain stubbed, partial, or misleading.

### 19. Schedule frontend methods still stubbed or drifting

- File:
  - `packages/app-vue/src/modules/schedule/composables/useSchedule.ts`
- Why this is debt:
  - `updateTask()` and `fetchExecutions()` are still stubs
  - this is adapter drift because schedule backend support exists for at least part of this surface
- Removal risk: medium
- Blockers:
  - either wire transport/service support or remove these methods from the composable API

### 20. Notification dismiss-all stub

- File:
  - `packages/app-vue/src/modules/notification/composables/useNotification.ts`
- Why this is debt:
  - `dismissAll()` still only warns
- Removal risk: low
- Blockers:
  - either implement service support or remove/hide any UI action that suggests it works

### 21. Setting defaults load stub

- Files:
  - `packages/app-vue/src/modules/setting/composables/useUserSetting.ts`
  - `packages/app-vue/src/modules/setting/stores/userSettingStore.ts`
- Why this is debt:
  - `loadDefaults()` remains exposed but unimplemented
- Removal risk: low
- Blockers:
  - implement or remove from public/store API

### 22. Governance revisions surface is stubbed but used by views

- Status: implemented in this cleanup pass

- Files:
  - `packages/app-vue/src/modules/governance/composables/useGovernance.ts`
  - `packages/app-vue/src/modules/governance/views/GovernanceDetailView.vue`
  - `packages/app-vue/src/modules/governance/views/RevisionHistoryView.vue`
- Why this is debt:
  - `fetchRevisions()` is a stub but real views call it
- Removal risk: high
- Blockers:
  - implement the real API path or remove the revision UI/routes first

### 23. Account settings update is fake-success behavior

- Status: implemented in this cleanup pass

- File:
  - `packages/app-vue/src/modules/account/composables/useAccount.ts`
- Why this is debt:
  - `updateSettings()` ignores input and reports success without persistence
- Removal risk: high
- Blockers:
  - wire through account API/client before keeping the UI exposed

### 24. Notification preference compatibility payload path

- File:
  - `packages/notification/src/application-server/use-cases/commands/notification-application-services.ts`
- Why this is debt:
  - old flat `channels` payload shape is still translated into module preferences for compatibility
- Removal risk: medium
- Blockers:
  - confirm all clients now send the canonical nested categories/modules shape

### 25. Authentication phone auth stubs still exposed

- File:
  - `packages/authentication/src/infrastructure-server/authentication.module.ts`
- Why this is debt:
  - `registerByPhone`, `loginByPhone`, and `sendSmsCode` remain exposed but intentionally unavailable
- Removal risk: medium
- Blockers:
  - this needs product/API contract confirmation because phone auth may be intentionally excluded rather than removable

## D. UI/Data Compatibility Shapes To Retire Carefully

### 26. Legacy schedule route redirect

- Files:
  - `packages/app-vue/src/modules/schedule/router/index.ts`
  - `apps/web/e2e/schedule/schedule-week-view.spec.ts`
- Why this is debt:
  - `/schedule/week` survives as backward-compat redirect
- Removal risk: low-medium
- Blockers:
  - update links/bookmarks and E2E coverage first

### 27. Goal chart accepts both old and new date fields

- File:
  - `packages/app-vue/src/modules/goal/components/echarts/GoalProgressChart.vue`
- Why this is debt:
  - chart still tolerates legacy `startTime` / `endTime` alongside `startDate` / `targetDate`
- Removal risk: medium
- Blockers:
  - confirm persisted/API payloads are fully migrated

### 28. Goal template type shim duplicated in app-vue

- Files:
  - `packages/app-vue/src/modules/goal/application/templates/GoalTemplates.ts`
  - `packages/app-vue/src/modules/goal/components/template/TemplateBrowser.vue`
- Why this is debt:
  - app-vue duplicates a template type surface that already exists in `packages/goal`
- Removal risk: low-medium
- Blockers:
  - switch to canonical package type and verify field compatibility

### 29. Schedule domain old-name aliases

- Files:
  - `packages/schedule/src/domain-client/aggregates/schedule-job.ts`
  - `packages/schedule/src/domain-server/aggregates/schedule.ts`
  - `packages/schedule/src/domain-server/value-objects/ScheduleErrors.ts`
  - `packages/schedule/src/domain-server/value-objects/TaskMetadata.ts`
  - `packages/schedule/src/domain-server/calculators/recurrence.ts`
  - `packages/schedule/src/domain-server/aggregates/schedule-task.ts`
- Why this is debt:
  - old names and reconstruction helpers remain exported for compatibility
- Removal risk: low-medium
- Blockers:
  - confirm all callers use canonical symbol names before pruning aliases

### 30. Editor deprecated type aliases

- File:
  - `packages/contracts/src/modules/editor/aggregates/editor-workspace-server.ts`
- Why this is debt:
  - deprecated `WorkspaceLayout` / `WorkspaceSettings` aliases still exist
- Removal risk: low
- Blockers:
  - remove only after any external type imports are migrated

## E. Singleton/Manager Architecture Debt

These are larger architectural debts, not quick deletions.

### 31. Desktop singleton-style managers outside the newer bootstrap direction

- Files:
  - `apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts`
  - `apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts`
  - `apps/desktop/src/main/modules/authentication/infrastructure/RememberedAccountsService.ts`
  - `apps/desktop/src/main/modules/authentication/infrastructure/NetworkStateManager.ts`
  - `apps/desktop/src/main/services/notification.service.ts`
  - `apps/desktop/src/main/services/custom-notification.manager.ts`
  - `apps/desktop/src/main/modules/auto-update/auto-update-manager.ts`
  - `apps/desktop/src/main/utils/ipc-cache.ts`
  - `apps/desktop/src/main/utils/memory-monitor.ts`
- Why this is debt:
  - these managers are still active and singleton-shaped
  - they bypass the newer lifecycle/composition-root direction
- Removal risk: high
- Blockers:
  - replace with lifecycle-owned instances wired through `ElectronBootstrapper` before deleting or flattening them

## Priority Recommendation

### Phase 1: Low-Risk Cleanup

- stale docs/comments
- dashboard/setting type and alias cleanup
- compatibility-only repository components
- deprecated no-op initialization hooks
- preload convenience wrapper cleanup after consumer check

### Phase 2: Public API Pruning

- deprecated module/class exports in authentication/goal/task/ai
- legacy schedule aliases and editor type aliases
- old route redirects and chart compatibility fields
- notification compatibility facades after caller audit

### Phase 3: Contract And IPC Cleanup

- offline-mode auth alias
- desktop DI status compatibility handlers
- editor legacy IPC channel names
- repository contract legacy interfaces
- contracts result legacy exports

### Phase 4: Architecture Debt Removal

- schedule deprecated container after reminder migration
- reminder schedule shim removal
- desktop singleton manager refactor

## Recommended Execution Order

1. update stale docs/comments first so the repo describes reality
2. remove low-risk unused aliases and compatibility-only components
3. audit external/downstream consumers of public package exports
4. migrate old IPC/channel consumers to canonical contracts
5. remove deprecated containers/facades after call sites are gone
6. do architecture-level singleton cleanup last

## Current Remaining Focus

- desktop singleton/lifecycle manager refactors
- notification preference compatibility payload cleanup once all callers are canonical
- contracts/http internal deprecated aliases cleanup if we want to remove the last in-file compatibility helpers
- documentation/ADR refresh for old container-based examples

## Notes

- This document is for cleanup preparation, not feature-gap tracking.
- Some items are product decisions rather than pure cleanup, especially phone auth and any UI that currently exposes stubbed behavior.
- The highest-risk hidden dependency identified in this audit is reminder -> schedule deprecated container coupling.
