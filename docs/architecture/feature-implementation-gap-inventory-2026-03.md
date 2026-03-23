# Feature Implementation Gap Inventory (2026-03)

This file tracks functionality that exists in the product surface but is still incomplete in one or more of these layers:

- core backend/domain behavior
- HTTP transport
- desktop IPC transport
- persistence adapter implementation

The goal is to use this as the working checklist for the next implementation pass.

## Current State

Most previously documented gaps are now closed across backend, HTTP, and desktop IPC.

## Remaining Intentional Exclusions

### Authentication

- Phone-related auth flows remain intentionally excluded from this pass:
  - phone registration
  - phone login
  - SMS verification

## Closed In This Pass

### Schedule

- Schedule conflict detection is now wired through the canonical module composition root instead of controller-local optional behavior.
- HTTP and Electron IPC both use the same `eventApi` application surface for:
  - conflict detection
  - create with conflict detection
  - conflict resolution

### Editor

- Editor search now exists as a canonical module capability instead of desktop-only fallback logic.
- HTTP route added for editor resource search.
- Electron IPC search now delegates to the same backend/module search use case.
- Current implementation is pragmatic workspace-wide resource search, not a dedicated indexed search engine.

### Notification

- Notification Prisma repositories are implemented.
- Notification preference and template Prisma repositories are implemented.
- Backward-compatible notification facade exports now delegate to real repositories/use cases instead of acting as placeholders.

## Remaining Non-Blocking Limitations

### Notification Delivery / Runtime

- SSE notification delivery is still marked TODO in `packages/notification/src/application-server/use-cases/commands/create-notification.ts`.

### Editor Search Depth

- Editor search is now fully available through canonical backend and IPC surfaces, but it is still a direct repository-backed content search rather than a dedicated search-index runtime.

## Notes

- No phone-related auth flows were implemented.
- This document now reflects the feature-gap status after the current implementation pass.
