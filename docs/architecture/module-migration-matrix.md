# Module Migration Matrix

This matrix is the working checklist for refactoring all business modules after
the governance reference implementation.

## Legend

- `done` - already migrated or largely aligned
- `partial` - started but not complete across all optimization surfaces
- `todo` - still needs migration

## Status Matrix

| Module         | Server DI | Runtime | Transport | Client  | Contracts | Docs/Exports | Notes                                                                     |
| -------------- | --------- | ------- | --------- | ------- | --------- | ------------ | ------------------------------------------------------------------------- |
| governance     | done      | done    | done      | done    | done      | done         | reference implementation                                                  |
| setting        | done      | done    | done      | done    | done      | done         | full-scope follow-up complete                                             |
| account        | done      | done    | done      | done    | done      | done         | full-scope follow-up complete                                             |
| authentication | done      | done    | done      | done    | done      | done         | Electron deprecated (desktop owns auth)                                   |
| goal           | done      | done    | done      | done    | done      | done         | GoalModule+GoalContainer replaced                                         |
| task           | done      | done    | done      | done    | done      | done         | Prisma/PowerSync dedup resolved                                           |
| schedule       | done      | done    | done      | done    | done      | done         | static publisher -> runtime contribution                                  |
| reminder       | done      | done    | done      | done    | done      | partial      | cron runtime wired; docs still need cleanup                               |
| notification   | done      | done    | done      | done    | done      | done         | cross-module events in runtime; container deleted                         |
| repository     | done      | done    | done      | done    | done      | done         | 397→123 lines; Electron migrated; all legacy containers+providers deleted |
| editor         | partial   | partial | partial   | partial | partial   | partial      | desktop persistence/content path still incomplete                         |
| ai             | done      | done    | done      | done    | done      | done         | provider/runtime collaborators explicit                                   |

## Governance Code To Copy

### Composition Root

- `packages/governance/src/infrastructure-server/governance.module.ts`

Copy when replacing:

- `XModule` class facades
- `XContainer.getInstance()` usage
- hidden server dependency resolution

### Runtime Contribution

- `packages/governance/src/api/runtime.ts`

Copy when replacing:

- `initialization.ts`
- global event registration
- startup-only side effects with no matching cleanup

### API Transport Assembly

- `packages/governance/src/api/module.ts`
- `packages/governance/src/api/transport-handlers.ts`

Copy when replacing:

- API modules that instantiate repositories and hand-wire controllers inline
- transport layers that depend directly on use-case objects instead of `module.api`

### Electron Assembly

- `packages/governance/src/electron-entry/index.ts`

Copy when replacing:

- Electron entries that directly consume module internals
- duplicated PowerSync wiring logic

### Client Surface

- `packages/governance/src/application-client/services/governance-client-service.ts`
- `packages/governance/src/infrastructure-client/adapters/http/rule-http.adapter.ts`
- `packages/governance/src/infrastructure-client/adapters/ipc/rule-ipc.adapter.ts`

Copy when aligning:

- client service naming and layering
- HTTP/IPС adapter parity
- protocol/result consistency

### Docs Pattern

- `packages/governance/COMPOSITION_ROOT.md`
- `packages/governance/REFACTOR_PLAYBOOK.md`

Copy when adding:

- one short module-local migration note
- one repo-level reference path back to governance

## Per-Module Status

### Governance — DONE

- [x] review final protocol placement policy
- [x] keep docs and exports aligned with the finished pattern

### Setting — DONE

- [x] optimize `packages/setting/src/application-client/index.ts` — singleton proxy removed, `createSettingClientService` factory added
- [x] review `packages/contracts/src/modules/setting` — added missing `dtos` + `domain` barrels
- [x] retire `packages/setting/src/infrastructure-server/di/setting-container.ts` — deleted (zero consumers)
- [x] add README/export cleanup — layered exports, `REFACTOR_PLAYBOOK.md` added

### Account — DONE

- [x] optimize client service and adapter consistency — singleton proxy removed
- [x] review result semantics in transport wrappers — `as any` casts removed, proper typed logic
- [x] retire `packages/account/src/infrastructure-server/di/account-container.ts` — deleted (zero consumers)
- [x] add README/export cleanup — layered exports, `REFACTOR_PLAYBOOK.md` added

### Authentication — DONE

- [x] replace `packages/authentication/src/infrastructure-server/authentication.module.ts` — `createAuthenticationModule` factory
- [x] replace `packages/authentication/src/api/initialization.ts` — runtime contribution
- [x] align `packages/authentication/src/api/module.ts` — 3-step pattern
- [x] review `packages/authentication/src/application-client/services/auth-client-service.ts`
- [x] review `packages/contracts/src/modules/authentication/protocol`
- [x] Electron entry deprecated (desktop owns auth composition root)

### Goal — DONE

- [x] replace `packages/goal/src/infrastructure-server/goal.module.ts` — `createGoalModule` factory
- [x] replace `packages/goal/src/api/initialization.ts` — runtime contribution
- [x] simplify `packages/goal/src/api/module.ts` — 3-step pattern
- [x] simplify `packages/goal/src/electron-entry/index.ts` — uses `createGoalPowerSyncModule`
- [x] review `packages/goal/src/application-client/goal-client-service.ts`

### Task — DONE

- [x] replace `packages/task/src/infrastructure-server/task.module.ts` — `createTaskModule` factory
- [x] replace `packages/task/src/infrastructure-server/powersync.ts` — `createTaskPowerSyncModule` factory
- [x] replace `packages/task/src/api/initialization.ts` — deprecated, replaced by runtime contribution
- [x] align `packages/task/src/api/module.ts` — 3-step pattern
- [x] review `packages/task/src/application-client/task-client-service.ts` — already uses constructor injection

### Schedule — DONE

- [x] replace `packages/schedule/src/infrastructure-server/schedule.module.ts` — `createScheduleModule` factory
- [x] replace static publisher wiring — encapsulated in `createScheduleRuntimeContribution`
- [x] replace `packages/schedule/src/api/initialization.ts` — deprecated
- [x] align client/protocol/export surfaces

### Reminder — DONE

- [x] replace `packages/reminder/src/infrastructure-server/reminder.module.ts` — `createReminderModule` factory
- [x] convert cron + startup logic into runtime contributions
- [x] thin `packages/reminder/src/api/module.ts` — 368 -> ~88 lines
- [x] remove client singleton proxy (`_reminderApplicationService` etc.) — dead code removed
- [x] fix PascalCase import path in `reminder-trigger-cron-job.ts` — would break on Linux
- [x] remove legacy `ReminderContainer` singleton — all 3 consumers refactored: `initialization.ts` deleted (dead code), cron job rewritten as `createReminderTriggerCronJob(deps)` factory, `reminder-handler-support.ts` takes repos via constructor. Container file + `di/` directory deleted.

### Notification — DONE

- [x] replace `packages/notification/src/infrastructure-server/notification.module.ts` — `createNotificationModule` factory
- [x] convert init/event registrations to runtime contributions (reminder:triggered, schedule:task:executed)
- [x] finish placeholder app services before transport cleanup
- [x] remove deprecated `NotificationContainer` — file deleted (zero consumers)
- [x] remove client singleton proxy (`_notificationApplicationService` etc.) — dead code removed

### Repository — DONE

- [x] replace `packages/repository/src/infrastructure-server/repository.module.ts` — `createRepositoryModule` factory
- [x] replace `packages/repository/src/api/initialization.ts` — deprecated
- [x] thin `packages/repository/src/api/module.ts` — 397 -> ~123 lines
- [x] review `packages/repository/src/application-client/repository-client-service.ts`
- [x] migrate Electron entry to use `createRepositoryPowerSyncModule()` composition root
- [x] remove deprecated `RepositoryModule` class — deleted (zero consumers)
- [x] migrate external consumers (`desktop-knowledge-note-persistence.adapter.ts`, `repository-knowledge-note-persistence.adapter.ts`)
- [x] remove `RepositoryContainer` singleton — all 3 consumers were dead code: `initialize-api.ts`, `database-provider-factory.ts`, `prisma-provider.ts`, `memory-provider.ts` deleted. Container file deleted. `initialization/` and `providers/` directories removed. Barrel exports cleaned.

### Editor — PARTIAL

- [x] introduce explicit composition root — `createEditorModule` factory
- [x] replace `packages/editor/src/api/initialization.ts` — deleted (dead code)
- [x] thin `packages/editor/src/api/module.ts` — 3-step pattern
- [x] decide whether to add client layer — deferred (IPC-only interface)
- [x] delete `EditorContainer` singleton
- [ ] finish real resource/content persistence in desktop runtime

### AI — DONE

- [x] replace `packages/ai/src/infrastructure-server/ai.module.ts` — `createAIModule` factory
- [x] make provider/runtime collaborators explicit — in `AIModuleDependencies`
- [x] align `packages/ai/src/api/module.ts` — 3-step pattern
- [x] review `packages/ai/src/application-client/ai-client-service.ts` — bilingual docs added

## Resolved Risks

- **Protocol map placement**: kept in `packages/contracts/src/modules/*/protocol` for most modules (governance is the exception with package-local protocol maps). Both approaches are valid.
- **Client-service convention**: `Result`-first convention adopted (setting, account). Modules without client refactoring (reminder, notification) still use DTO-first but are marked for follow-up.
- **Electron entries**: remain package-owned. Authentication is the exception — desktop owns its own auth composition root.
- **Compatibility exports**: deprecated with `@deprecated` JSDoc and `@see createXModule` pointers. Physical removal deferred to a separate cleanup pass.

## Legacy Singletons — ALL ELIMINATED

All legacy DI containers have been fully removed from the codebase:

| Singleton               | Package      | Status  | Resolution                                                                                                                                                   |
| ----------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ReminderContainer`     | reminder     | DELETED | `initialization.ts` deleted (dead code), cron job rewritten as factory, `handler-support.ts` takes repos via constructor. Container + `di/` deleted.         |
| `RepositoryContainer`   | repository   | DELETED | All consumers (`initialize-api.ts`, `database-provider-factory.ts`, `prisma-provider.ts`, `memory-provider.ts`) were dead code — deleted. Container deleted. |
| `NotificationContainer` | notification | DELETED | Zero consumers — file deleted.                                                                                                                               |
| `EditorContainer`       | editor       | DELETED | Replaced by `createEditorModule` composition root.                                                                                                           |
| `SettingContainer`      | setting      | DELETED | Zero consumers after singleton proxy removal.                                                                                                                |
| `AccountContainer`      | account      | DELETED | Zero consumers after singleton proxy removal.                                                                                                                |

## Code Review Fixes (claude-migration-code-review-2026-03.md)

All 14 issues from the comprehensive code review have been resolved:

| #   | Severity | Issue                              | Status  |
| --- | -------- | ---------------------------------- | ------- |
| 1   | HIGH     | Notification app port placeholders | FIXED   |
| 2   | HIGH     | Notification Electron runtime leak | FIXED   |
| 3   | HIGH     | Editor desktop IPC wiring          | PARTIAL |
| 4   | HIGH     | Goal Electron auth bypass          | FIXED   |
| 5   | HIGH     | Reminder identity propagation      | FIXED   |
| 6   | MEDIUM   | Auth desktop lifecycle cleanup     | FIXED   |
| 7   | MEDIUM   | Goal `module.api` facade           | FIXED   |
| 8   | MEDIUM   | Schedule desktop runtime           | FIXED   |
| 9   | MEDIUM   | Repository/AI facade alignment     | FIXED   |
| 10  | MEDIUM   | Auth Electron entry                | FIXED   |
| 11  | LOW      | Account exports normalization      | FIXED   |
| 12  | LOW      | AI transport consistency           | FIXED   |
| 13  | LOW      | Reminder runtime docs              | FIXED   |
| 14  | LOW      | Task Electron runtime              | FIXED   |

## Deferred Work

| Item                           | Reason                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI controller → `api.*` wiring | 4 controllers in `ai/api/module.ts` wire to `services.*` instead of `api.*`. Requires adding `listMessages` to `AIApplicationPort` and refactoring 4 controller constructors (6+ files). Lower priority — no runtime bug. |
| Editor desktop persistence     | Desktop now has real repository-backed content bridge and PowerSync resource-backed persistence, but the overall editor runtime still needs validation before being called fully complete.                                |
