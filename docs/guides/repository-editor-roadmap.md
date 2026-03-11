---
tags:
  - repository
  - editor
  - roadmap
description: Repository editor roadmap index for P0 P1 and P2 planning
created: 2026-03-11T00:00:00
updated: 2026-03-11T00:00:00
---

# Repository Editor Roadmap

This roadmap turns the current repository/editor implementation into an execution-ready feature plan without changing the architectural direction already established in:

- `docs/guides/repository-editor-business-flows.md`
- `REPOSITORY_EDITOR_IMPLEMENTATION_PLAN.md`

The planning below is grounded in the current codebase state, especially:

- repository workspace in `packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`
- fixed type-grouped navigation in `packages/app-vue/src/modules/repository/components/TypedFileTree.vue`
- legacy folder UI still present under `packages/app-vue/src/modules/repository/components/FileTree*.vue` and `packages/app-vue/src/modules/repository/components/dialogs/CreateFolderDialog.vue`
- shared repository composable in `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- markdown editor in `packages/app-vue/src/modules/editor/components/MarkdownEditor.vue`
- linear editor flow in `packages/app-vue/src/modules/editor/views/EditorLinearView.vue`
- frontend link intelligence in `packages/app-vue/src/modules/editor/composables/useEditorLinkIndex.ts`
- upload contracts and server endpoint in `packages/contracts/src/modules/repository/dtos/upload-resource.api-dto.ts` and `packages/repository/src/api/routes/repository.routes.ts`

## Priority framing

- `P0`: close the must-have authoring loop for notes plus assets
- `P1`: make insertion, sharing, and export feel intentional and complete
- `P2`: make the resource library maintainable over time

## Architectural guardrails

- Keep the unified `Resource` model
- Keep `TypedFileTree` and fixed typed grouping as the main repository navigation
- Do not expose user-facing folder creation in the main repository path
- Treat folder/domain support as compatibility infrastructure, not core UX
- Default to path-based resource references in stored notes
- Add self-contained/base64 behavior as explicit insertion or export behavior, not the default persistence format

## Plan documents

- `docs/guides/repository-editor-p0-plan.md`
- `docs/guides/repository-editor-p1-plan.md`
- `docs/guides/repository-editor-p2-plan.md`

## Recommended sequencing

1. Execute P0-A first: lock the main workspace to typed grouping and remove folder creation from the primary UX.
2. Execute P0-B next: add a shared resource insertion layer before wiring paste/import/insert entry points.
3. Finish P0 with note-authoring closure: paste image into note and insert existing image resource.
4. Start P1 only after the shared insertion layer API is stable, because export and insertion mode switching should reuse the same parsing and formatting rules.
5. Start P2 reference tracing and broken-link detection only after P1 defines canonical resource reference formats.

## Cross-plan dependency map

- P0 provides the reusable insertion primitives, image markdown generation rules, and editor integration points.
- P1 depends on P0 insertion primitives and extends them with mode switching, export rewriting, and broader resource insertion UX.
- P2 depends on P0/P1 canonical reference shapes so detection and tracing logic can operate on one consistent reference model.
