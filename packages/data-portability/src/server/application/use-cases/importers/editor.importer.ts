/**
 * Editor module importer — handles workspaces, sessions, groups, and tabs.
 */

import type { ImportContext } from '../../portable-runtime';
import type { PortableEditorData } from '@memoflow/contracts/data-portability';
import type { TxClient } from './import-helpers';
import { allocateId, optRef, inc, rec, timestamps } from './import-helpers';

export async function importEditor(
  tx: TxClient, ctx: ImportContext, data: PortableEditorData,
): Promise<void> {
  for (const workspace of data.workspaces) {
    const w = rec(workspace);
    const wsId = allocateId(ctx, w._ref as string);
    const originalPath = w.projectPath as string;
    const projectPath = `/imported/workspaces/${ctx.batchId.slice(0, 8)}/${w.name as string}`;
    if (originalPath) {
      ctx.warnings.push(`EditorWorkspace "${w.name}" projectPath renamed from "${originalPath}" to "${projectPath}"`);
    }
    await tx.createEditorWorkspace({
      id: wsId, identityId: ctx.identityId,
      name: w.name as string, description: w.description as string | null ?? null,
      projectPath,
      projectType: (w.projectType as string) ?? 'unknown',
      layout: w.layout ?? {}, setting: w.settings ?? {},
      isActive: (w.isActive as boolean) ?? false,
      ...timestamps(w),
    });

    for (const session of (w.sessions as unknown[] ?? [])) {
      const s = rec(session);
      const sessId = allocateId(ctx, s._ref as string);
      await tx.createEditorSession({
        id: sessId, workspaceId: wsId, identityId: ctx.identityId,
        name: s.name as string, layout: s.layout ?? {},
        isActive: (s.isActive as boolean) ?? false,
        ...timestamps(s),
      });

      for (const group of (s.groups as unknown[] ?? [])) {
        const g = rec(group);
        const grpId = allocateId(ctx, g._ref as string);
        await tx.createEditorGroup({
          id: grpId, sessionId: sessId, workspaceId: wsId,
          identityId: ctx.identityId,
          groupIndex: (g.groupIndex as number) ?? 0,
          name: g.name as string | null ?? null,
          splitDirection: 'horizontal',
          ...timestamps(g),
        });

        for (const tab of (g.tabs as unknown[] ?? [])) {
          const t = rec(tab);
          const tabId = allocateId(ctx, t._ref as string);
          await tx.createEditorTab({
            id: tabId, groupId: grpId, sessionId: sessId,
            workspaceId: wsId, identityId: ctx.identityId,
            tabIndex: (t.tabIndex as number) ?? 0,
            tabType: (t.tabType as string) ?? 'text',
            title: t.name as string, viewState: t.viewState ?? {},
            isPinned: (t.isPinned as boolean) ?? false,
            isActive: (t.isActive as boolean) ?? false,
            resourceId: optRef(t.resourceRef as string | null, ctx),
            ...timestamps(t),
          });
        }
      }
    }
    inc(ctx, 'editorWorkspaces');
  }
}
