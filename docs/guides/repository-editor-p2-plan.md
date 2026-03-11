---
tags:
  - repository
  - editor
  - plan
  - p2
description: P2 implementation plan for repository editor maintenance and resource library quality
created: 2026-03-11T00:00:00
updated: 2026-03-11T00:00:00
---

# Repository Editor P2 Plan

## Objective

Turn the repository from a place that can store and insert resources into a resource library that stays trustworthy over time.

P2 focuses on maintenance and quality features:

- broken resource reference detection
- resource reference tracing across notes
- delete impact awareness
- lightweight resource details and maintenance surfaces
- recent and reference-aware insertion helpers where they improve long-term usability

## Current state

### Existing foundations

- The repository already uses a unified `ResourceClientDTO` with metadata, stats, path, mime type, and timestamps in `packages/contracts/src/modules/repository/aggregates/resource-client.ts`.
- Typed grouping already separates notes, images, videos, audio, documents, and other in `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`.
- Frontend link intelligence already builds a derived Markdown document graph in:
  - `packages/app-vue/src/modules/editor/composables/useEditorLinkIndex.ts`
  - `packages/app-vue/src/modules/editor/utils/linkIndex.ts`
- `linkIndex.ts` already models unresolved wiki-links, backlinks, and graph traversal, which is an important precedent for P2 resource diagnostics.

### Missing for long-term maintainability

- No parser exists yet for repository-backed image or attachment references.
- No UI surfaces show which notes reference an image/document resource.
- No workflow warns users before removing a resource that is still referenced.
- No broken attachment/image state is surfaced during editing or browsing.
- No lightweight resource detail panel exists in the main typed-grouped workflow.

## Scope

### In scope

- Detect broken repository-backed image/attachment references in Markdown notes.
- Trace inbound references for non-note resources, especially images.
- Show delete impact warnings before resource deletion.
- Add a lightweight resource detail panel with maintenance-relevant fields.
- Add fast access to recent and highly referenced resources if useful for maintenance flows.

### Non-goals

- Full digital asset management system.
- Arbitrary folder management UI.
- Full-text indexing redesign.
- OCR, AI tagging, auto-captioning, or content-derived semantic search.
- Permissions/sharing model changes.

## User flows

### Flow 1: Broken reference detection while editing

1. User opens a Markdown note.
2. System parses supported repository-backed references in the note.
3. A referenced resource path or id no longer resolves.
4. Editor preview and/or diagnostics surface marks that reference as broken.
5. User can inspect the broken item and choose a repair action.

### Flow 2: Repair broken reference

1. User opens a broken image or attachment reference issue.
2. System offers candidate replacement resources from the repository.
3. User picks the intended replacement.
4. Markdown reference is rewritten to the new canonical target.

### Flow 3: Trace resource usage before deletion

1. User opens an image or attachment resource from the repository.
2. Resource detail panel shows which notes currently reference it.
3. User attempts deletion.
4. System warns about impacted notes and reference count.
5. User can cancel, inspect impacted notes, or continue knowingly.

### Flow 4: Inspect resource details

1. User selects a resource in typed grouping.
2. User opens details.
3. System shows path, size, type, tags, created date, updated date, and reference count.
4. For images/documents/media, system also shows where they are used.

## Architecture and design decisions

### 1. Extend the P1 reference utility into a canonical resource reference index

P2 should build on the P1 markdown-resource-reference parser and introduce a derived reference index analogous to the existing wiki-link index.

Recommended abstraction:

- `buildResourceReferenceIndex(resources)`

Responsibilities:

- scan Markdown notes for supported repository-backed image and attachment references
- resolve references to existing `ResourceClientDTO` records
- record unresolved references
- provide inbound/outbound lookup APIs
- expose delete-impact summaries and repair candidates

### 2. Prefer derived indexing first, backend services later if scale demands it

The current editor wiki-link graph is frontend-derived from repository resources. P2 should follow the same pattern first to reduce scope and stay aligned with current architecture.

Only move to backend indexing if:

- repository size causes unacceptable frontend cost
- cross-device consistency for diagnostics becomes a hard requirement

### 3. Use canonical identifiers wherever possible, but support path matching for existing notes

Because current authoring direction stores path-based Markdown references, P2 diagnostics must support:

- exact path resolution
- normalized path resolution
- future extension if resource ids are embedded in syntax later

### 4. Keep repair UI focused and lightweight

P2 repair should be constrained to:

- detect broken reference
- pick replacement resource
- rewrite markdown reference

Do not overbuild a migration framework in the first pass.

## Affected modules and likely files

### New reference indexing and diagnostics utilities

- new utility/composable files under `packages/app-vue/src/modules/editor/utils/`
- new composables under `packages/app-vue/src/modules/editor/composables/`

### Existing editor surfaces likely to change

- `packages/app-vue/src/modules/editor/components/EditorPreview.vue`
- `packages/app-vue/src/modules/editor/components/MarkdownEditor.vue`
- `packages/app-vue/src/modules/editor/views/EditorLinearView.vue`
- `packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`

### Existing repository surfaces likely to change

- `packages/app-vue/src/modules/repository/components/TypedFileTree.vue`
- `packages/app-vue/src/modules/repository/components/ResourceCard.vue`
- `packages/app-vue/src/modules/repository/components/ResourceList.vue`
- new lightweight detail panel component under `packages/app-vue/src/modules/repository/components/`
- `packages/app-vue/src/modules/repository/composables/useRepository.ts`

### Shared store/state

- `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`

### Backend additions that may become necessary

- delete safeguards or reference lookup endpoints only if frontend-derived indexing proves insufficient
- otherwise reuse existing resource list/read/update/delete contracts

## Backend / frontend / editor split

### Backend

- Continue exposing resources and deletes through current APIs.
- Optionally add resource-content read helpers only if the frontend cannot obtain enough data for diagnostics from existing DTOs.
- If delete-preflight is implemented server-side later, keep it additive and based on the same canonical reference model.

### Frontend repository

- Own detail-panel display, delete confirmation UX, and repository resource browsing.
- Surface reference counts and impacted-note lists in resource-centric flows.

### Editor

- Own broken-reference highlighting, repair actions, and note-level diagnostics.
- Reuse the shared reference index instead of implementing editor-only heuristics.

## Task breakdown in execution order

### P2-A. Canonical resource reference index

1. Define supported repository-backed Markdown reference patterns.
2. Build derived index over repository notes and resources.
3. Produce APIs for:
   - outbound references for a note
   - inbound references for a resource
   - unresolved references
   - impacted notes for deletion preflight
4. Add unit tests with mixed note/image/document scenarios.

### P2-B. Broken reference detection UX

1. Add note-level diagnostics for unresolved image/document references.
2. Surface broken state in preview and/or side panel.
3. Decide how much inline decoration is feasible in CodeMirror for first pass.
4. Add clear empty/loading/error states.

### P2-C. Broken reference repair flow

1. Add repair action from diagnostics entry.
2. Open a scoped resource picker with candidate replacements.
3. Rewrite Markdown using canonical formatting rules from P0/P1.
4. Re-run diagnostics after repair.

### P2-D. Resource inbound reference tracing

1. Add a resource references section in a lightweight detail panel.
2. Show list of referencing notes with title and path.
3. Allow navigation to the source note.
4. Show counts in list rows or badges where helpful.

### P2-E. Delete impact awareness

1. Intercept resource deletion in repository UI.
2. Query reference index for impacted notes.
3. Show warning dialog when references exist.
4. Allow delete confirmation only after user sees impact summary.

### P2-F. Lightweight resource detail panel

1. Add details surface for selected resource.
2. Include:
   - path
   - size
   - type
   - tags
   - created time
   - updated time
   - reference count
3. Keep it lightweight and compatible with typed grouping workflow.

### P2-G. Maintenance-oriented insertion helpers

1. Promote recent/highly referenced resources in insertion UI where useful.
2. Optionally add "used by current note" or "recently inserted" quick filters.

## Parallelizable work packages

### Work package 1: Reference indexing foundation

- P2-A

### Work package 2: Editor diagnostics and repair

- P2-B
- P2-C

### Work package 3: Repository maintenance surfaces

- P2-D
- P2-E
- P2-F

### Work package 4: UX polish and optimization

- P2-G
- i18n and empty-state polish

## Dependencies

### Hard dependencies

- P0/P1 must already define canonical repository-backed Markdown reference behavior.
- A shared reference parser/rewriter must exist.
- Resource deletion must route through UI surfaces where warnings can be injected.

### Soft dependencies

- Inline CodeMirror decorations for broken refs can be deferred if preview/sidebar diagnostics deliver earlier value.
- Backend preflight delete API can remain optional if frontend index is accurate enough.

## Risks and mitigation

### Risk: reference detection misses real-world Markdown variants

- Mitigation: explicitly document supported syntax and add corpus-style tests from representative repository notes.

### Risk: frontend-derived index becomes slow on large repositories

- Mitigation: design the index behind a composable/service boundary so backend migration is possible later.

### Risk: repair rewrites the wrong reference when the same path appears multiple times

- Mitigation: track exact match spans and rewrite targeted ranges, not blind global string replacement.

### Risk: delete warnings are bypassed from alternative UI paths

- Mitigation: identify all delete entry points and route them through one delete orchestrator before shipping.

### Risk: detail panel becomes a second repository UI paradigm

- Mitigation: keep it lightweight, contextual, and subordinate to typed grouping rather than creating a new asset-management screen.

## Acceptance criteria

- Notes with broken repository-backed image or attachment references can be detected from the current repository state.
- Users can see which notes reference a given image or attachment resource.
- Deleting a referenced resource shows impacted-note warning before completion.
- Users can repair a broken reference by rebinding it to another resource.
- A lightweight resource detail surface exposes maintenance-relevant metadata and reference count.

## Recommended tests and verification

### Unit tests

- resource reference parser coverage across supported Markdown syntaxes
- inbound/outbound/unresolved index generation
- targeted reference rewrite on repair
- delete-impact summary generation

### Component tests

- broken reference diagnostics states
- repair picker workflow
- resource detail panel rendering for referenced and unreferenced resources
- delete warning dialog behavior

### Integration tests

- remove or rename an image resource, reopen note, and verify broken state surfaces
- repair a broken reference and verify note content plus preview recover
- inspect an image resource and verify referencing notes are listed correctly

### Manual verification

1. Create a note with one inserted repository image.
2. Break the image reference by removing or renaming the target resource in a controlled test scenario.
3. Reopen the note and confirm broken status is visible.
4. Repair the reference using the replacement picker.
5. Open the target image resource details and verify inbound note references are listed.
6. Attempt deletion of a referenced resource and confirm impact warning appears.

## Suggested sequencing decision

Recommended P2 order:

1. canonical resource reference index
2. resource reference tracing
3. delete impact warnings
4. broken reference diagnostics
5. repair workflow
6. lightweight detail panel polish

Reason: reference tracing and delete impact rely on the same index, and once that exists, diagnostics and repair can build on a proven data model rather than inventing one-off note parsing flows.
