---
tags:
  - repository
  - editor
  - plan
  - p1
description: P1 implementation plan for repository editor insertion UX and export flows
created: 2026-03-11T00:00:00
updated: 2026-03-11T00:00:00
---

# Repository Editor P1 Plan

## Objective

Build the user-experience layer on top of P0 so repository-backed authoring becomes easier to use, easier to share, and more flexible without changing the underlying storage strategy.

P1 focuses on:

- a unified resource insertion surface
- image reference mode handling for explicit sharing scenarios
- self-contained Markdown export
- smoother asset insertion flows that reduce friction after the core loop is closed

## Current state

### What P1 can assume after current code review

- Repository uploads are already structurally supported through `useRepository.uploadResources` and backend upload endpoints.
- The current editor toolbar in `packages/app-vue/src/modules/editor/components/EditorToolbar.vue` only supports literal markdown insertion, including a placeholder `![...](url)` action.
- There is no generalized insertion surface for images, files, notes, audio, or video.
- There is no current parsing or transform layer for path-reference versus base64 image handling.
- There is no export action in `RepositoryWorkspaceView.vue`, `EditorToolbar.vue`, or `EditorLinearView.vue`.
- `EditorPreview.vue` and current editor flows assume ordinary Markdown content, which is good for path-based storage but not yet optimized for explicit sharing/export flows.

### Existing assets that P1 should reuse

- shared repository state from `useRepository.ts`
- frontend note indexing from `useEditorLinkIndex.ts`
- direct note route in `packages/app-vue/src/modules/repository/router/index.ts`
- toolbar and split-view shells in:
  - `packages/app-vue/src/modules/editor/components/EditorToolbar.vue`
  - `packages/app-vue/src/modules/editor/components/EditorSplitView.vue`
  - `packages/app-vue/src/modules/editor/views/EditorLinearView.vue`

## Scope

### In scope

- Introduce a unified resource insertion layer and user-facing picker.
- Expand insertion beyond existing images to include at least:
  - note links
  - note links
  - media links/embed references where current viewer semantics allow it
- Add explicit image reference mode handling:
  - repository path reference as default
  - base64/self-contained as explicit option for insertion or export
- Add self-contained export for a Markdown note.
- Add recent resources / recent insertions in the insertion surface if it materially helps P1 UX.

### Non-goals

- Broken reference detection and repair UX.
- Resource reference tracing, delete impact warnings, or maintenance dashboards.
- Rich asset metadata management panel.
- Full media transformation pipeline such as image compression presets unless already required by export.
- Replacing Markdown with a different editor architecture.

## User flows

### Flow 1: Unified insertion command

1. User is editing a Markdown note.
2. User opens `Insert Resource` from toolbar, slash command, or context menu.
3. User sees searchable resources with clear type filters.
4. User chooses one of:
   - image
   - note link
   - file attachment
   - media file
5. System inserts the correct Markdown template for that resource type.

### Flow 2: Explicit self-contained image insertion

1. User chooses to insert an image.
2. System offers insertion mode where relevant:
   - `path` for normal repository-backed notes
   - `base64` for self-contained/share-oriented insertion
3. Default remains `path`.
4. If `base64` is chosen, system reads the resource bytes and inserts a data URL image reference.

### Flow 3: Export note as self-contained Markdown

1. User opens a note with repository-backed image references.
2. User clicks `Share` or `Export`.
3. System scans Markdown for image/resource references it understands.
4. User chooses self-contained export.
5. System generates a temporary Markdown output with image references rewritten to data URLs.
6. Original repository file remains unchanged.
7. User copies or downloads the generated Markdown.

### Flow 4: Insert recently used resources

1. User inserts several related images/files in sequence.
2. Insertion surface shows recently uploaded or recently inserted resources first.
3. User avoids repeated repository browsing and inserts faster.

## Architecture and design decisions

### 1. Extend the P0 insertion layer instead of creating new feature silos

P1 should grow the same insertion orchestration introduced in P0. Recommended responsibilities:

- `insertExistingResource(resource, mode, template)`
- `insertUploadedResource(file, mode)`
- `exportMarkdownAsSelfContained(resourceId | markdown)`
- `listRecentInsertions()`

The insertion layer should remain the only place that knows how to:

- convert resources into Markdown snippets
- switch between path references and data URLs
- decide insertion templates by resource type

### 2. Keep path mode canonical in persisted notes

P1 must preserve this policy:

- stored repository note content defaults to path references
- self-contained/base64 is explicit and scoped
- export should rewrite output in memory, not mutate repository content by default

### 3. Add a reference transformer utility

Introduce a focused utility layer for Markdown resource reference parsing and rewriting, for example under:

- `packages/app-vue/src/modules/editor/utils/markdownResourceReferences.ts`

Responsibilities:

- detect Markdown image/link references that point to repository resources
- normalize current supported path patterns
- transform path references into data URLs for export
- later serve as the basis for P2 broken-reference detection

### 4. Prefer one insertion UI with type-aware templates

Instead of separate image picker, note picker, and attachment picker, P1 should introduce one panel with:

- search input
- type filter chips or tabs
- recent section
- result rows with icon, type, path, tags, and preview metadata where cheap

## Affected modules and likely files

### Frontend editor and insertion UX

- `packages/app-vue/src/modules/editor/components/EditorToolbar.vue`
- `packages/app-vue/src/modules/editor/components/MarkdownEditor.vue`
- `packages/app-vue/src/modules/editor/views/EditorLinearView.vue`
- `packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`
- new insertion components under `packages/app-vue/src/modules/editor/components/`
- new insertion composables under `packages/app-vue/src/modules/editor/composables/`

### Shared parsing / transform helpers

- new markdown reference utility files under `packages/app-vue/src/modules/editor/utils/`

### Repository/frontend state

- `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`

### Contracts/backend support that may be needed

- `packages/contracts/src/modules/repository/*`
- `packages/repository/src/application-client/repository-client-service.ts`
- potentially new backend read endpoint only if export needs binary fetch by path/id and no usable route exists today

### Settings / preference hooks if adopted in scope

- `packages/contracts/src/modules/setting/preferences/schemas/editor.schema.ts`
- repository/editor preference surfaces if a user preference for insertion/export defaults is introduced

## Backend / frontend / editor split

### Backend

- Prefer reuse of existing resource retrieval/listing/upload behavior.
- Add only minimal new capability needed for export, such as fetching resource binary content in a stable way by resource id/path.
- Avoid introducing a separate attachment subsystem.

### Frontend repository

- Continue owning repository resource inventory and recent state.
- Optionally persist recent insertions locally in Pinia or browser storage first, before creating backend persistence.

### Editor

- Own insertion commands, export dialogs, and transform previews.
- Keep editor content mutation explicit and reversible from the user perspective.

## Task breakdown in execution order

### P1-A. Canonical markdown resource reference utilities

1. Define what resource references P1 officially supports.
2. Implement parser helpers for image and attachment references that point to repository resources.
3. Implement rewrite helpers for path-to-base64 transformation.
4. Add tests for mixed content, malformed links, and notes with multiple repeated assets.

### P1-B. Unified insertion panel

1. Replace isolated image-only insertion UX from P0 with a reusable panel.
2. Add resource search, type filtering, and recent section.
3. Support insertion templates for:
   - image embed
   - note link
   - attachment link
   - basic media embed/link patterns consistent with current preview behavior
4. Connect panel to toolbar and optionally slash command entry points.

### P1-C. Image insertion mode handling

1. Add `path` and `base64` mode support to insertion orchestration.
2. Keep default to `path`.
3. Only allow `base64` where binary read is available and file size is acceptable.
4. Surface clear size/error handling for unsupported large conversions.

### P1-D. Self-contained export workflow

1. Add export/share action to toolbar or note actions.
2. Parse note content for supported repository-backed references.
3. Read referenced resource binaries.
4. Produce a temporary self-contained Markdown artifact.
5. Support at least one delivery path:
   - copy to clipboard
   - download/export file
6. Ensure original note content is unchanged.

### P1-E. Recent insertion experience

1. Track recently inserted resources locally.
2. Show recent resources at top of insertion panel.
3. Refresh ordering on successful insertion or upload-and-insert flows.

### P1-F. Preference and copy polish

1. If preferences are included, add minimal defaults for export/insertion behavior without blocking the main flow.
2. Add i18n strings for mode labels, export states, conversion failures, and recent section labels.

## Parallelizable work packages

### Work package 1: Reference utility foundation

- P1-A
- parser/rewriter tests

### Work package 2: Unified insertion UI

- P1-B
- P1-E

### Work package 3: Mode switching and export

- P1-C
- P1-D

### Work package 4: Integration and polish

- P1-F
- route-level integration in repository workspace and linear editor

## Dependencies

### Hard dependencies

- P0 shared insertion orchestration must exist.
- A stable way to identify repository-backed resource references must be established.
- Binary resource read must be possible for self-contained export.

### Soft dependencies

- Recent insertion state can start local-only and later move to backend if needed.
- Slash-command integration can follow toolbar integration if time is tight.

## Risks and mitigation

### Risk: export logic mutates stored note content

- Mitigation: make export operate on a cloned string buffer and generated artifact only.

### Risk: inconsistent resource reference parsing across features

- Mitigation: all parsing must route through one markdown-resource-reference utility shared by insertion, export, and future P2 diagnostics.

### Risk: base64 mode becomes a default by accident

- Mitigation: encode default policy in one typed config constant and document it in tests.

### Risk: unified insertion panel grows too broad and delays delivery

- Mitigation: ship one panel with a limited supported-type matrix first, then widen supported templates incrementally.

### Risk: very large images create unusable self-contained exports

- Mitigation: warn on size thresholds, allow skipping failed references, and make export summary explicit.

## Acceptance criteria

- Users have one clear insertion surface for repository resources instead of multiple disconnected flows.
- Insertion surface can insert existing images and at least note/file links using repository data.
- Path references remain the default insertion behavior.
- Users can explicitly choose self-contained/base64 behavior for supported image-sharing scenarios.
- Users can export a note as self-contained Markdown without altering the stored repository note.
- Recently inserted resources are surfaced in the insertion UI if that sub-scope ships.

## Recommended tests and verification

### Unit tests

- markdown resource reference parser cases
- path-to-base64 rewrite cases
- insertion template generation by resource type
- file-size threshold and conversion fallback handling

### Component tests

- unified insertion panel search and filter behavior
- recent insertions ordering
- export dialog state transitions and failure summary display

### Integration tests

- insert image in path mode into a note and verify Markdown output
- insert image in base64 mode and verify data URL generation
- export a note with multiple repository images and verify export output is self-contained while stored note remains unchanged

### Manual verification

1. Open a note and insert an image via the unified insertion panel.
2. Insert a note link and a file attachment from the same panel.
3. Export a note with repository images as self-contained Markdown.
4. Reopen the original repository note and confirm it still uses path references.
5. Verify recent insertions appear first after repeated insert operations.

## Suggested sequencing decision

Recommended P1 order:

1. canonical reference parser/rewriter
2. unified insertion panel
3. explicit mode support
4. self-contained export
5. recent insertion polish

That order minimizes rework and sets up P2 diagnostics on the same reference model.
