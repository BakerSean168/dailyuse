/**
 * Editor Module — Export Projections
 */

import type { ExportContext } from '../../portable-runtime';
import type { PortableEditorWorkspace, PortableEditorSession, PortableEditorGroup, PortableEditorTab } from '@dailyuse/contracts/data-portability';
import type { DataPortabilityDependencies } from '../../data-portability.dependencies';
// Residual 1017: sole resolveExportRef (local resolveRef dual retired).
import {
  parseJsonField,
  toBoolean,
  toDateString,
  toRecord,
  resolveExportRef,
} from './projection-helpers';

export async function projectEditorWorkspaces(
  workspaces: unknown[],
  ctx: ExportContext,
  deps: DataPortabilityDependencies,
): Promise<PortableEditorWorkspace[]> {
  const result: PortableEditorWorkspace[] = [];

  for (const w of workspaces) {
    const entity = w as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('editorWorkspace');
    ctx.refToIdMap.set(entity.id as string, ref);

    const sessions = await deps.editorSessionRepository.findByWorkspaceId(entity.id as string);
    const portableSessions: PortableEditorSession[] = [];

    for (const s of sessions) {
      const sessionEntity = s as Record<string, unknown>;
      const sessionRef = ctx.refAllocator.allocate('editorSession');
      ctx.refToIdMap.set(sessionEntity.id as string, sessionRef);
      const sessionLayout = parseJsonField(sessionEntity.layout, {}) as Record<string, unknown>;

      const groups = await deps.editorGroupRepository.findBySessionId(sessionEntity.id as string);
      const portableGroups: PortableEditorGroup[] = [];

      for (const g of groups) {
        const groupEntity = g as Record<string, unknown>;
        const groupRef = ctx.refAllocator.allocate('editorGroup');
        ctx.refToIdMap.set(groupEntity.id as string, groupRef);
        const layoutGroups = toRecord(sessionLayout)?.groups;
        const activeTabIndex =
          (groupEntity.activeTabIndex as number | undefined) ??
          ((Array.isArray(layoutGroups) ? layoutGroups : undefined)?.find(
            (item: Record<string, unknown>) => item.groupIndex === groupEntity.groupIndex,
          )?.activeTabIndex as number | undefined) ??
          0;

        const tabs = await deps.editorTabRepository.findByGroupId(groupEntity.id as string);
        const portableTabs: PortableEditorTab[] = tabs.map((t) => {
          const tabEntity = t as Record<string, unknown>;
          const tabRef = ctx.refAllocator.allocate('editorTab');
          ctx.refToIdMap.set(tabEntity.id as string, tabRef);
          return {
            _ref: tabRef,
            resourceRef: tabEntity.resourceId ? resolveExportRef(tabEntity.resourceId as string, ctx, 'editor') ?? undefined : undefined,
            tabIndex: (tabEntity.tabIndex as number) ?? 0,
            tabType: tabEntity.tabType as string,
            name: ((tabEntity.name as string | undefined) ?? (tabEntity.title as string | undefined)) ?? '',
            viewState: parseJsonField(tabEntity.viewState, {}),
            isPinned: toBoolean(tabEntity.isPinned, false),
            isActive: toBoolean(tabEntity.isActive, false),
            isDirty: toBoolean(tabEntity.isDirty, false),
            createdAt: toDateString(tabEntity.createdAt),
            updatedAt: toDateString(tabEntity.updatedAt),
          };
        });

        portableGroups.push({
          _ref: groupRef,
          groupIndex: (groupEntity.groupIndex as number) ?? 0,
          activeTabIndex,
          name: groupEntity.name as string | null | undefined,
          createdAt: toDateString(groupEntity.createdAt),
          updatedAt: toDateString(groupEntity.updatedAt),
          tabs: portableTabs,
        });
      }

      portableSessions.push({
        _ref: sessionRef,
        name: sessionEntity.name as string,
        description: sessionEntity.description as string | null | undefined,
        layout: sessionLayout,
        isActive: toBoolean(sessionEntity.isActive, false),
        activeGroupIndex:
          ((sessionEntity.activeGroupIndex as number | undefined) ??
            (sessionLayout.activeGroupIndex as number | undefined)) ??
          0,
        createdAt: toDateString(sessionEntity.createdAt),
        updatedAt: toDateString(sessionEntity.updatedAt),
        groups: portableGroups,
      });
    }

    const layout = parseJsonField(entity.layout, {});
    result.push({
      _ref: ref,
      name: entity.name as string,
      description: entity.description as string | null | undefined,
      projectPath: entity.projectPath as string,
      projectType: entity.projectType as string,
      layout,
      settings: parseJsonField(entity.settings ?? entity.setting, {}),
      isActive: toBoolean(entity.isActive, false),
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
      sessions: portableSessions,
    });
  }

  return result;
}

// Residual 1017: resolveExportRef elevated to projection-helpers.
