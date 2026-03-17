# Desktop IPC System Remediation Plan (2026-03)

## Scope

This document analyzes the recurring desktop-mode failures recently observed in `goal`, `task`, `notification`, and related modules, then proposes a repo-wide fix strategy.

Primary symptoms:

- Electron renderer errors like `An object could not be cloned`
- desktop guest mode validation failures caused by missing or malformed identity context
- IPC channels that exist in adapters or preload, but are missing or partially implemented in Electron main
- silent behavior drift where renderer, IPC adapter, preload, and main handler disagree on payload shape or semantics

## Executive Summary

The desktop failures are not isolated bugs.

They come from two systemic architectural gaps:

1. no shared renderer-to-IPC serialization boundary
2. no single source of truth for desktop IPC contracts

The result is predictable:

- Vue reactive proxies leak into Electron `invoke()` calls and fail structured clone
- modules hand-roll IPC payloads with inconsistent field names and argument ordering
- preload exposes channels that main never registers
- some desktop modules expect renderer-supplied `identityId`, while others inject auth context in main

The most elegant fix is not to patch each module separately forever. The right solution is to introduce:

- a shared `sanitizeForIpc()` boundary in `app-vue`
- a contract-first desktop IPC definition per module
- main-process-owned auth context injection for desktop business modules
- explicit deprecation or removal of channels that are exposed but not implemented

## What We Observed

### 1. Structured Clone Failures Are a Class of Bug

Confirmed pattern:

- Vue `reactive`, `ref`, or nested proxy-backed arrays/objects are passed into composables
- composables forward the payload unchanged to application services
- desktop DI wires those services to IPC adapters
- Electron attempts structured clone on a proxy-backed object and throws `An object could not be cloned`

Confirmed examples:

- `packages/app-vue/src/modules/goal/composables/useGoal.ts`
  - already fixed locally by converting payloads to plain objects before IPC
- `packages/app-vue/src/modules/task/composables/useTask.ts`
  - currently forwards create/update payloads raw
- `packages/app-vue/src/modules/task/components/dialogs/TaskTemplateDialog.vue`
  - emits proxy-backed template state
- `packages/app-vue/src/modules/task/views/TaskManagementView.vue`
  - forwards nested `timeConfig`, `recurrenceRule`, and `tags` from view models
- `packages/app-vue/src/modules/schedule/composables/useSchedule.ts`
  - forwards create payloads raw
- `packages/app-vue/src/modules/schedule/components/CreateScheduleDialog.vue`
  - emits nested arrays from reactive form state

Near-risk call sites also exist in modules like `setting` and `notification`, even if they have not yet produced a user-visible failure.

### 2. IPC Adapter and Main Handler Contracts Drift Independently

The current desktop stack has four layers that can diverge:

- renderer call site
- IPC adapter
- preload allowlist
- Electron `ipcMain.handle()` registration

We found multiple classes of divergence.

#### 2.1 Missing handlers for exposed channels

Examples:

- goal focus channels are exposed in preload and adapters, but not implemented in `packages/goal/src/electron-entry/index.ts`
- task dependency channels are exposed, but not registered in `packages/task/src/electron-entry/index.ts`
- schedule conflict and several schedule task channels are exposed but not fully wired in `packages/schedule/src/electron-entry/index.ts`

This is the worst category because the API surface looks available to the renderer, but fails at runtime.

#### 2.2 Argument order mismatches

Example previously confirmed and fixed in `goal`:

- adapter called `goal:update` as `(id, request)`
- main handler read a single DTO object

This class of bug often produces confusing validation failures or partial updates rather than an obvious missing-handler error.

#### 2.3 Field-name mismatches

Examples found during audit:

- repository folder move uses `targetParentId` in adapter but main reads `parentId`
- repository resource move uses `targetFolderId` in adapter but main does not fully honor it
- reminder control-mode toggles and group movement payload semantics differ between adapter and controller expectations

#### 2.4 Semantic mismatches

Examples:

- a channel exists and returns `NOT_IMPLEMENTED`, but the renderer treats it as a normal supported action
- search or list handlers accept only part of the adapter payload and silently ignore filters or pagination
- some modules require renderer-provided `identityId`, while others derive it from desktop auth state in main

This is especially dangerous because behavior appears to work but is subtly wrong.

### 3. Desktop Auth Context Is Not Consistent Across Modules

Recent guest-mode investigation showed that business modules should not rely on the renderer to pass identity context.

Better pattern:

- renderer sends only business payload
- Electron main resolves request context from desktop auth state
- main injects `identityId` into controller or use-case inputs

Where modules deviate from this, guest mode and validation are much more fragile.

## Root Cause Analysis

### Root Cause A: No Standard Renderer-to-IPC Safety Boundary

The repo currently has no required rule that says:

> Before any desktop-bound service call, payloads must be converted to structured-clone-safe plain data.

Because that rule does not exist as shared infrastructure, each module either:

- accidentally works
- breaks under Vue proxies
- or adds a one-off local fix

This is why `goal` has a bespoke de-proxy helper while `task` and `schedule` still fail.

### Root Cause B: IPC Contracts Are Spread Across Too Many Places

A module's desktop contract is effectively defined in multiple files:

- adapter implementation
- preload allowlist
- electron entrypoint
- controller parsing logic
- sometimes contracts types, sometimes not

There is no mechanism ensuring these stay aligned.

That makes drift inevitable.

### Root Cause C: Desktop Modules Mix Two Auth Models

Some desktop flows use:

- main-side auth context injection

Others still assume:

- renderer must send identity information explicitly

This inconsistency creates guest-mode breakage, duplicated validation logic, and module-specific rules.

### Root Cause D: Unimplemented Desktop Surfaces Are Still Public

Several channels are already exposed to the renderer before the main process actually supports them.

That creates a false contract:

- the UI believes an operation exists
- desktop main either does not handle it or only partially supports it

This is a product and architecture problem, not just an implementation oversight.

## Design Goals for the Fix

The remediation should aim for:

1. one safe serialization path for all desktop-bound payloads
2. one authoritative IPC contract per module
3. one auth pattern for desktop business modules
4. no renderer-visible channel without a real main-process implementation or explicit unsupported response
5. predictable tests that catch contract drift early

## Recommended Solution

## 1. Introduce `sanitizeForIpc()` in `app-vue`

Create a shared utility in the renderer layer, for example:

- `packages/app-vue/src/shared/utils/ipc/sanitizeForIpc.ts`

Responsibilities:

- unwrap Vue proxies and refs
- recursively clone arrays and plain objects
- preserve primitives and `null`
- optionally strip `undefined` fields for transport stability
- reject obviously unsupported values if necessary

This utility should replace module-specific ad hoc logic.

### Why this is the most elegant fix

- it solves the whole class of structured clone errors once
- it makes renderer behavior explicit at the transport boundary
- it avoids duplicating `toRaw()` / recursion logic across modules
- it lets module code stay focused on business mapping rather than transport quirks

### Where it should be applied first

Mandatory first wave:

- `packages/app-vue/src/modules/task/composables/useTask.ts`
- `packages/app-vue/src/modules/schedule/composables/useSchedule.ts`
- `packages/app-vue/src/modules/goal/composables/useGoal.ts` (replace local helper with shared one)
- `packages/app-vue/src/modules/setting/composables/useUserSetting.ts`
- `packages/app-vue/src/modules/notification/composables/useNotification.ts`

Recommended follow-up:

- any composable that calls a desktop-wired injected service with object or array payloads

## 2. Define a Contract-First IPC Surface Per Module

Each desktop-capable module should have one explicit map of supported IPC channels and payload/response shapes.

A practical shape would be something like:

- `packages/<module>/src/electron-entry/ipc-contract.ts`

It should define:

- channel names
- argument tuples
- return shapes
- implementation status

All of the following should reference that contract instead of redefining it independently:

- renderer IPC adapter
- preload exposure list
- Electron `ipcMain.handle()` registration

### Why this is the most elegant fix

- it removes channel drift at the source
- it makes missing implementations obvious during development
- it allows lint/test tooling to compare declared vs registered channels

## 3. Standardize Desktop Auth Injection in Main

For desktop business modules, adopt one policy:

- renderer does not send `identityId` for authenticated business operations
- Electron main resolves request context from desktop auth state
- main injects `identityId` into validated controller/use-case input

Apply this consistently to:

- notification
- goal
- task
- setting
- reminder
- any repository operation that is user-scoped

### Why this is the most elegant fix

- guest mode becomes predictable
- renderer code becomes thinner and less security-sensitive
- validation becomes consistent across modules

## 4. Remove or Explicitly Gate Unsupported Desktop Channels

For every channel exposed in preload or adapter code, do one of two things:

1. implement it in main properly
2. remove it from preload and desktop DI until it is supported

If a temporary stub must remain, it should be explicit and centralized, not accidental.

That means:

- no more adapter-only channels that appear functional from the renderer side
- no more half-supported channels that silently ignore fields

## 5. Add Desktop IPC Contract Tests

Introduce tests for two levels.

### 5.1 Serialization safety tests

Shared tests for `sanitizeForIpc()` should verify:

- Vue `reactive()` objects become plain objects
- nested arrays become plain arrays
- `ref()` contents are unwrapped properly
- transport data remains equal by value after sanitization

### 5.2 Contract alignment tests

Per module, add tests that assert:

- every channel exposed in preload is registered in main
- every adapter call uses the declared argument shape
- handlers return the declared response shape

This can start as lightweight smoke tests before becoming stricter.

## Prioritized Remediation Roadmap

### Phase 1: Stop Current User-Facing Failures

Goal: remove active desktop crashes and clone errors.

Tasks:

- introduce shared `sanitizeForIpc()`
- migrate `goal` to the shared helper
- patch `task` create/update flows to sanitize payloads
- patch `schedule` create/update flows to sanitize payloads
- verify `setting` and `notification` composables use the same boundary

Success criteria:

- no `An object could not be cloned` in goal/task/schedule common flows

### Phase 2: Repair High-Severity IPC Contract Drift

Goal: make desktop-supported surfaces real and predictable.

Priority order:

1. `task`
2. `schedule`
3. `repository`
4. `setting`
5. `reminder`
6. `goal` residual cleanup

Tasks:

- align adapter and handler argument ordering
- align field names end-to-end
- register missing handlers or remove channels from preload
- ensure list/search handlers consume the documented payload shape fully

Success criteria:

- no desktop-exposed channel is missing a handler
- no supported action ignores core renderer parameters silently

### Phase 3: Normalize Auth Semantics

Goal: make guest mode and authenticated mode behave consistently.

Tasks:

- remove renderer-side identity injection from desktop business flows
- standardize `requireRequestContext()` / `requireIdentityId()` usage in main
- document the desktop auth contract as a standard

Success criteria:

- guest mode works across goal/task/notification/setting without module-specific hacks

### Phase 4: Codify the Architecture

Goal: prevent recurrence.

Tasks:

- document desktop IPC design standard
- add per-module IPC contract tests
- optionally introduce code generation or typed helpers for IPC registration

Success criteria:

- new desktop module work cannot easily bypass the contract model

## Module-by-Module Notes

### Goal

Current state:

- structured clone risk already fixed locally
- several IPC mismatches recently surfaced and were partially repaired
- still needs cleanup around partially supported actions like pause/search semantics

Recommendation:

- migrate to shared `sanitizeForIpc()`
- finish aligning desktop search and action semantics to one contract

### Task

Current state:

- active structured clone risk on template save flows
- desktop dependency-related channels are exposed but not fully implemented

Recommendation:

- highest-priority module for next implementation pass

### Schedule

Current state:

- active structured clone risk on create flow
- contract drift in conflict/task IPC surfaces

Recommendation:

- second module to repair after task

### Repository

Current state:

- fewer structured clone issues observed
- significant semantic and field-name contract drift

Recommendation:

- prioritize adapter/main contract cleanup over renderer sanitization

### Setting

Current state:

- lower visible failure rate
- desktop identity handling is inconsistent
- vulnerable to future clone issues if reactive partials are passed through

Recommendation:

- move to main-side auth injection and shared sanitization boundary

### Reminder

Current state:

- adapter/controller semantics differ for some operations
- desktop surface contains stubbed or mismatched flows

Recommendation:

- either fully support those flows or explicitly remove them from desktop for now

## What Not To Do

Avoid these partial fixes:

- adding one-off `toRaw()` calls in random components without a shared utility
- exposing more preload channels before main support exists
- continuing to let each module invent its own auth/identity transport rule
- treating `NOT_IMPLEMENTED` as acceptable for renderer-visible flows indefinitely
- relying on manual memory of adapter signatures instead of a declared contract

## Recommended Deliverables

To complete this remediation properly, the repo should end up with:

- one shared `sanitizeForIpc()` utility in `app-vue`
- one desktop IPC contract file per desktop-capable module
- one documented desktop auth rule
- one preload-vs-main alignment test strategy
- one cleanup pass removing unsupported renderer-visible desktop channels

## Suggested Immediate Next Steps

1. implement shared `sanitizeForIpc()`
2. migrate `task`, `schedule`, and `goal` to it
3. repair `task` desktop IPC surface completely
4. repair `schedule` desktop IPC surface completely
5. create a contract audit checklist for `repository`, `setting`, and `reminder`

## Final Recommendation

The elegant solution is to treat desktop IPC as a first-class architecture boundary, not as a loose transport detail.

If we do only local patches, the repo will continue producing the same family of bugs in different modules.

If we instead add a shared serialization boundary, a single contract source per module, and main-owned auth injection, the current failures in `goal`, `task`, and guest mode become symptoms of a solved category rather than recurring incidents.
