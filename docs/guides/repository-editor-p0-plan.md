---
tags:
  - repository
  - editor
  - plan
  - p0
description: P0 implementation plan for repository editor workflow closure
created: 2026-03-11T00:00:00
updated: 2026-03-11T00:00:00
---

# Repository Editor P0 Plan

## Objective

Close the immediate must-have authoring workflow so a user can:

1. enter the repository without being pushed into file-manager behavior
2. create or open a Markdown note
3. import assets into the repository
4. paste an image directly into a note and get a stable repository-backed Markdown reference
5. insert an already imported image resource into a note without manually copying paths

P0 is complete when note creation plus image-backed note authoring works end to end in the main repository path.

## Current state

### Already working

- The main repository route exists in `packages/app-vue/src/modules/repository/router/index.ts`.
- The main workspace uses `TypedFileTree` in `packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`.
- `useRepository` already supports:
  - repository initialization
  - resource listing
  - note creation via `createMarkdownNote`
  - resource upload via `uploadResources`
  - bookmark APIs
- Upload contracts and server route already exist in:
  - `packages/contracts/src/modules/repository/dtos/upload-resource.api-dto.ts`
  - `packages/repository/src/api/routes/repository.routes.ts`
  - `packages/repository/src/application-server/use-cases/commands/upload-resources.ts`
- Binary-safe storage is already supported in `packages/repository/src/infrastructure-server/adapters/fs/fs-storage.adapter.ts`.

### Partially working or structurally incomplete

- The product direction is fixed-type grouping, but legacy folder-oriented UI still exists in:
  - `packages/app-vue/src/modules/repository/components/FileTree.vue`
  - `packages/app-vue/src/modules/repository/components/FileTreePanel.vue`
  - `packages/app-vue/src/modules/repository/components/FilesPanel.vue`
  - `packages/app-vue/src/modules/repository/components/dialogs/CreateFolderDialog.vue`
- The main workspace editor uses `MarkdownEditor`, but no repository-aware image insertion path exists in:
  - `packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`
  - `packages/app-vue/src/modules/editor/components/EditorToolbar.vue`
  - `packages/app-vue/src/modules/editor/components/MarkdownEditor.vue`
- Legacy `ObsidianEditor` already emits `paste-files` and `drop-files` in `packages/app-vue/src/modules/repository/components/ObsidianEditor.vue`, but that component is not the main editing path.
- `EditorLinearView` has wiki-link suggestions, backlinks, and graph, but no resource insertion support.

### Key product/architecture constraint to preserve

- Keep unified `Resource` entities.
- Keep fixed typed grouping from `repositoryStore.resourcesByType`.
- Do not expose folder creation in the main repository workflow.
- Default inserted media references must be repository path references, not base64.

## Scope

### In scope

- Remove or hide user-facing folder creation from the primary repository/editor path.
- Establish one shared resource insertion layer for repository-backed note insertion.
- Add paste-image-to-note support in the main CodeMirror-based editor path.
- Add insert-existing-image support from toolbar or equivalent primary entry point.
- Standardize generated Markdown image syntax for repository resources.
- Ensure both repository workspace editing and linear editor route can use the same insertion logic where practical.

### Non-goals

- Full generic resource insertion panel for all resource types.
- Base64 insertion mode switching.
- Self-contained export.
- Broken reference detection or repair.
- Resource reference tracing, delete impact analysis, or metadata panel.
- Reworking the unified resource model or removing folder domain support from backend.

## User flows

### Flow 1: Create note and paste image

1. User opens `/repository`.
2. User clicks `New Note` in `TypedFileTree` or empty state.
3. A new Markdown resource is created and opened.
4. User pastes a screenshot into `MarkdownEditor`.
5. Editor detects image file(s) from clipboard.
6. Shared insertion layer uploads image resource(s) through repository APIs.
7. Editor inserts `![alt](path)` at the current cursor.
8. Note remains open and editable with normal save behavior.

### Flow 2: Insert existing image into note

1. User opens an existing Markdown note.
2. User clicks an image insertion action from the editor toolbar.
3. A lightweight picker lists image resources from the current repository.
4. User selects one image.
5. Editor inserts `![alt](path)` at the cursor location.

### Flow 3: Repository navigation remains typed, not folder-first

1. User opens repository workspace.
2. Sidebar presents fixed groups from `TypedFileTree`.
3. User sees create note and import actions, not create folder actions.
4. Legacy folder UI is not reachable from the main happy path.

## Architecture and design decisions

### 1. Add a shared insertion orchestration layer

Create a dedicated composable or service for repository-backed editor insertions, for example:

- `packages/app-vue/src/modules/editor/composables/useResourceInsertion.ts`

Responsibilities:

- upload pasted image files
- upload dropped image files if drag/drop is enabled later
- select existing image resource and produce insertion text
- centralize Markdown generation for image references
- generate stable file names for pasted assets
- keep repository-specific upload concerns out of `EditorToolbar.vue` and `MarkdownEditor.vue`

This avoids duplicating insertion behavior between:

- `RepositoryWorkspaceView.vue`
- `EditorLinearView.vue`
- future slash-command or resource picker surfaces

### 2. Use repository path references as canonical storage format

P0 inserted images should always generate repository-backed path references. Example target behavior:

```md
![screenshot](/images/meeting-notes-2026-03-11-01.png)
```

Exact path shape should follow existing repository path generation from backend, not a new frontend convention.

### 3. Keep upload naming rules deterministic

Pasted images should not default to generic `image.png` if avoidable. Prefer a frontend naming helper that derives names from:

- current note title or file name
- current timestamp
- sequence number for multiple pasted images

Backend remains the source of truth for collisions and normalization.

### 4. Keep folder support internal only

Do not delete folder APIs or repositories. P0 should only remove them from main UX and planning-critical entry points.

## Affected modules and likely files

### Frontend repository workspace

- `packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`
- `packages/app-vue/src/modules/repository/components/TypedFileTree.vue`
- `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`

### Frontend editor

- `packages/app-vue/src/modules/editor/components/MarkdownEditor.vue`
- `packages/app-vue/src/modules/editor/components/EditorToolbar.vue`
- `packages/app-vue/src/modules/editor/views/EditorLinearView.vue`
- `packages/app-vue/src/modules/editor/composables/useEditorLinkIndex.ts`
- new shared insertion files under `packages/app-vue/src/modules/editor/composables/`
- new picker dialog/component under `packages/app-vue/src/modules/editor/components/`

### Legacy/visibility cleanup

- `packages/app-vue/src/modules/repository/components/FileTree.vue`
- `packages/app-vue/src/modules/repository/components/FileTreePanel.vue`
- `packages/app-vue/src/modules/repository/components/FilesPanel.vue`
- `packages/app-vue/src/modules/repository/components/dialogs/CreateFolderDialog.vue`
- `packages/app-vue/src/modules/repository/components/index.ts`

### Contracts/backend reuse or small additions

- `packages/contracts/src/modules/repository/dtos/upload-resource.api-dto.ts`
- `packages/repository/src/api/routes/repository.routes.ts`
- `packages/repository/src/application-server/use-cases/commands/upload-resources.ts`

### Localization

- `packages/app-vue/src/locales/en-US.ts`
- corresponding locale file for Chinese messages if present in the same locale directory

## Backend / frontend / editor split

### Backend

- Reuse existing upload pipeline.
- Confirm returned `ResourceClientDTO.path` is the canonical value used in inserted Markdown.
- Optionally add a small helper endpoint only if existing list/filter APIs are insufficient for image-only selection; otherwise reuse `listResources` and filter client-side.

### Frontend repository

- Keep repository workspace as the orchestrator for active note, uploads, and resource state.
- Route note-creation and upload-related refresh through `useRepository`.
- Ensure main path only advertises typed grouping plus note/import actions.

### Editor

- `MarkdownEditor.vue` should expose the event hooks needed for paste-based image insertion.
- `EditorToolbar.vue` should emit explicit insert-image-resource intent rather than only generic `![` wrapping.
- Shared insertion composable owns file upload and Markdown template generation.

## Task breakdown in execution order

### P0-A. Main-path UX closure for no-folder policy

1. Audit where folder creation is reachable from production routes.
2. Ensure `RepositoryWorkspaceView.vue` only uses `TypedFileTree` for primary navigation.
3. Remove or hide create-folder actions from any repository workspace entry point still reachable.
4. Mark legacy folder-first components as legacy in documentation or exports if still needed for stories/tests.
5. Verify no product copy in the main repository path suggests folder creation.

### P0-B. Shared resource insertion foundation

1. Create `useResourceInsertion` or equivalent orchestration composable.
2. Add helper utilities for:
   - pasted image file naming
   - image-resource filtering
   - Markdown image syntax generation
3. Define the single insertion contract used by both workspace and linear editor.
4. Decide how insertion layer gets current repository context and current note context.

### P0-C. Main editor paste-image support

1. Extend `MarkdownEditor.vue` to emit clipboard file events from the active CodeMirror path.
2. Connect `RepositoryWorkspaceView.vue` to the new paste event.
3. Use shared insertion layer to upload clipboard images via `useRepository.uploadResources`.
4. Insert returned Markdown at cursor.
5. Handle multi-image paste deterministically.
6. Show failure toast without corrupting note content.

### P0-D. Insert existing image resource

1. Add explicit toolbar action for inserting an existing image resource.
2. Build a lightweight image picker modal or popover.
3. Reuse repository state from `store.resources` or `useRepository.resources`.
4. Filter to image resources only.
5. Insert selected image reference at cursor using shared insertion logic.

### P0-E. Linear editor parity for shared authoring primitives

1. Decide whether P0 ships full parity in `EditorLinearView.vue` or only shared plumbing.
2. Minimum recommended scope: wire the same insertion composable so later rollout is trivial.
3. If time permits, enable the same insert-existing-image action in the linear editor route.

### P0-F. Existing flow verification and polish

1. Confirm note creation still auto-opens created notes.
2. Confirm import flow still works for manual asset import.
3. Add i18n strings for new toolbar labels, picker copy, upload failure states, and paste states.

## Parallelizable work packages

### Work package 1: UX closure

- P0-A
- locale and copy cleanup related to folder creation

### Work package 2: Shared insertion foundation

- P0-B
- unit tests for naming and Markdown generation helpers

### Work package 3: Paste image flow

- P0-C
- upload-result and cursor-insertion tests

### Work package 4: Existing image insertion

- P0-D
- image picker component and interaction tests

### Work package 5: Integration hardening

- P0-E
- P0-F

## Dependencies

### Hard dependencies

- Existing repository upload API must continue returning usable `ResourceClientDTO.path`.
- `useRepository.uploadResources` must remain the single app-level upload entry point.
- `MarkdownEditor.vue` must expose enough imperative APIs to insert text at cursor after async upload.

### Soft dependencies

- Existing repository state in `repositoryStore.ts` should stay fresh enough for the image picker after upload.
- Toolbar event model in `EditorToolbar.vue` can be extended without breaking existing formatting actions.

## Risks and mitigation

### Risk: paste support gets implemented twice

- Mitigation: require all note asset insertion to go through one shared insertion composable.

### Risk: legacy folder UI continues leaking into production

- Mitigation: explicitly map production routes and imports; do not rely only on component existence.

### Risk: inserted Markdown uses unstable or wrong paths

- Mitigation: only use backend-returned resource DTO values for inserted references, never guessed client paths.

### Risk: async upload breaks cursor intent

- Mitigation: capture insertion position before upload or use editor method that safely inserts at current selection after promise resolution.

### Risk: large clipboard payloads degrade UX

- Mitigation: start with images only, surface loading state, and fail fast with clear messaging for unsupported clipboard payloads.

## Acceptance criteria

- Main repository path no longer exposes user-facing create-folder entry points.
- A user can create a new Markdown note from `TypedFileTree` and immediately edit it.
- Pasting an image into the main repository note editor uploads it into repository storage and inserts a valid Markdown image reference.
- A user can insert an already imported image resource into a note from an explicit editor action.
- The inserted image reference uses repository path mode, not base64.
- Importing assets manually and then inserting them from the editor requires no path copy/paste.
- No primary P0 workflow depends on `ObsidianEditor.vue`.

## Recommended tests and verification

### Unit tests

- helper tests for pasted image naming strategy
- helper tests for Markdown image generation
- tests for image-resource filtering from mixed `ResourceClientDTO[]`

### Component tests

- `MarkdownEditor.vue` emits paste-file event for clipboard image items
- image picker lists only images and returns selected resource
- `EditorToolbar.vue` emits dedicated insert-existing-image action

### Integration tests

- `useResourceInsertion` uploads a file then inserts backend-returned path reference
- `RepositoryWorkspaceView.vue` can paste image into an open note and preserve note content around insertion

### Manual verification

1. Open `/repository` and confirm there is no create-folder action in the main workspace path.
2. Create a note and verify it opens immediately.
3. Paste a screenshot into the note and verify a new image resource appears under `images` in `TypedFileTree`.
4. Save and reload the note and verify the Markdown reference remains stable.
5. Import an image from disk, use insert-existing-image, and verify the inserted path renders in preview.
6. Repeat in the direct `/note/:id` route if parity is included in the P0 cut.

## Suggested implementation sequencing decision

Recommended cut line for P0:

- must ship: no-folder main path, paste image, insert existing image, shared insertion layer
- can slip to P1 if needed: drag-drop image, generalized asset insertion, linear editor full parity UI
