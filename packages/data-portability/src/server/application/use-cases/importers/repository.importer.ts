/**
 * Repository module importer — handles repositories, folders, and resources.
 *
 * Conflict strategy: all paths get a batch suffix to avoid unique constraint violations.
 */

import type { ImportContext } from '../../portable-runtime';
import type { PortableRepositoryData } from '@dailyuse/contracts/data-portability';
import type { TxClient } from './import-helpers';
import { allocateId, resolveRef, optRef, inc, rec, timestamps } from './import-helpers';

/** Append batch suffix to a path to avoid identityId+path unique constraint */
function conflictSafePath(originalPath: string | null | undefined, fallback: string, batchId: string): string {
  const base = originalPath ?? fallback;
  return `${base}-imported-${batchId.slice(0, 8)}`;
}

export async function importRepositories(
  tx: TxClient, ctx: ImportContext, data: PortableRepositoryData,
): Promise<void> {
  for (const repo of data.repositories) {
    const r = rec(repo);
    const id = allocateId(ctx, r._ref as string);
    const path = conflictSafePath(r.path as string | null, `/imported/${id}`, ctx.batchId);
    if (r.path) {
      ctx.warnings.push(`Repository "${r.name}" path renamed from "${r.path}" to "${path}"`);
    }
    await tx.createRepository({
      id, identityId: ctx.identityId,
      name: r.name as string, type: r.type as string,
      path,
      description: r.description as string | null ?? null,
      config: r.config ?? {}, status: (r.status as string) ?? 'ACTIVE',
      ...timestamps(r),
    });
    inc(ctx, 'repositories');
  }

  for (const folder of data.folders) {
    const f = rec(folder);
    const id = allocateId(ctx, f._ref as string);
    const name = f.name as string;
    const path = conflictSafePath(f.path as string | null, `/${name}`, ctx.batchId);
    await tx.createResourceFolder({
      id, identityId: ctx.identityId,
      repositoryId: resolveRef(f.repositoryRef as string, ctx),
      parentId: optRef(f.parentRef as string | null, ctx),
      name, path,
      order: (f.order as number) ?? 0,
      isExpanded: (f.isExpanded as boolean) ?? false,
      metadata: f.metadata ?? {},
      ...timestamps(f),
    });
    inc(ctx, 'resourceFolders');
  }

  for (const resource of data.resources) {
    const r = rec(resource);
    const id = allocateId(ctx, r._ref as string);
    const path = conflictSafePath(r.path as string | null, `/imported/${id}`, ctx.batchId);
    await tx.createResource({
      id, identityId: ctx.identityId,
      repositoryId: resolveRef(r.repositoryRef as string, ctx),
      folderId: optRef(r.folderRef as string | null, ctx),
      name: r.name as string, type: r.type as string,
      path,
      size: (r.size as number) ?? 0,
      content: r.content as string | null ?? null,
      metadata: r.metadata ?? {},
      status: (r.status as string) ?? 'ACTIVE',
      ...timestamps(r),
    });
    inc(ctx, 'resources');
  }
}
