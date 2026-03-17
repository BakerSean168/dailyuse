# Desktop IPC Not Implemented Inventory (2026-03)

## Purpose

This document lists desktop-facing IPC capabilities that are still explicitly unimplemented, partially stubbed, or backed by placeholder repositories.

The goal is to make the remaining gaps actionable and help decide which items should be:

- implemented soon
- removed from the desktop contract
- or kept as explicit low-priority placeholders

## A. Should Be Removed Or Hidden If Not Planned Soon

These items currently present a desktop-facing capability shape, but do not offer meaningful behavior yet.

### 1. Goal Pause

- File: `packages/goal/src/infrastructure-client/adapters/ipc/goal-ipc.adapter.ts:74`
- Current behavior: returns `NOT_IMPLEMENTED`
- Recommendation:
  - implement a real pause flow end-to-end, or
  - remove/hide the pause action from desktop UI and contract until supported

### 2. Goal AI Key Result Generation

- File: `packages/goal/src/infrastructure-client/adapters/ipc/goal-ipc.adapter.ts:227`
- Current behavior: returns `NOT_IMPLEMENTED`
- Notes:
  - this previously pointed to a nonexistent IPC channel
  - it now fails explicitly, which is safer, but still not a real feature
- Recommendation:
  - either wire this to a supported AI desktop flow, or
  - remove it from desktop capability surfaces for now

### 3. Editor Search

- File: `packages/editor/src/electron-entry/index.ts:219`
- Current behavior: handler exists but returns `NOT_IMPLEMENTED`
- Recommendation:
  - either implement the search path, or
  - remove the contract entry and any UI affordance that depends on it

## B. Should Be Implemented If The Related Screens Are Intended To Work

These items are more dangerous because they sit behind existing business surfaces and may cause partial failures later.

### 4. Notification Update

- File: `packages/notification/src/infrastructure-server/notification.module.ts:284`
- Current behavior: returns `NOT_IMPLEMENTED`
- Reason: no dedicated use case exists yet
- Recommendation:
  - implement a real `updateNotification` use case, or
  - remove the operation from desktop/API contracts if editing notifications is not supported

### 5. Notification Preference Update

- File: `packages/notification/src/infrastructure-server/notification.module.ts:349`
- Current behavior: returns `NOT_IMPLEMENTED`
- Reason: no dedicated use case exists yet
- Recommendation:
  - implement preference update end-to-end, or
  - remove desktop support for editing notification preferences

### 6. Notification PowerSync `countByCategory`

- File: `packages/notification/src/infrastructure-server/adapters/powersync/notification-powersync.repository.ts:244`
- Current behavior: throws `Not implemented - extract from apps/desktop`
- Risk:
  - future stats/category features will fail at runtime if they reach this repository
- Recommendation:
  - implement before exposing category-based notification stats in desktop

## C. Repository-Level Placeholders That Need A Product Decision

These are lower-level persistence gaps. They may not break current core flows, but they mean the desktop notification stack is still incomplete.

### 7. Notification Preference PowerSync Repository

- File: `packages/notification/src/infrastructure-server/adapters/powersync/notification-preference-powersync.repository.ts`
- Current behavior: multiple methods still throw `Not implemented - extract from apps/desktop`
- Recommendation:
  - implement if desktop will support reading/updating notification preferences from PowerSync-backed storage
  - otherwise mark this repository unsupported and remove dependent contract paths

### 8. Notification Template PowerSync Repository

- File: `packages/notification/src/infrastructure-server/adapters/powersync/notification-template-powersync.repository.ts`
- Current behavior: multiple methods still throw `Not implemented - extract from apps/desktop`
- Recommendation:
  - implement if desktop needs template-backed notification generation or template management
  - otherwise avoid exposing related flows in desktop

## D. Not Strictly Desktop IPC Gaps, But Still Product Gaps

These are not contract-drift bugs anymore, but they remain intentionally unimplemented in the authentication module.

### 9. Authentication Server Features Still Stubbed

- File: `packages/authentication/src/infrastructure-server/authentication.module.ts:255`
  - phone registration not implemented
- File: `packages/authentication/src/infrastructure-server/authentication.module.ts:274`
  - phone login not implemented
- File: `packages/authentication/src/infrastructure-server/authentication.module.ts:280`
  - SMS verification not implemented
- File: `packages/authentication/src/infrastructure-server/authentication.module.ts:309`
  - forgot password not implemented
- File: `packages/authentication/src/infrastructure-server/authentication.module.ts:315`
  - password reset not implemented

Recommendation:

- treat these as product/backend roadmap items rather than IPC cleanup items
- do not expose UI paths that suggest these are fully supported unless they are intentionally disabled or labeled

## Priority Recommendation

### High Priority

- `goal:pause`
- goal AI key result generation
- notification update
- notification preference update
- notification `countByCategory`

### Medium Priority

- editor search
- notification preference PowerSync repository
- notification template PowerSync repository

### Separate Product Track

- auth phone login/register
- SMS verification
- forgot/reset password

## Recommended Next Actions

1. Remove or hide desktop UI affordances for features that are still explicit placeholders.
2. Pick one path per item: implement fully or remove from desktop contract.
3. For notification, decide whether desktop truly needs preference/template management now; if yes, finish the PowerSync repositories.
4. Keep this file updated as placeholder items are implemented or retired.
