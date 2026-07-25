/**
 * Repository Module — Export Projections
 */

import type { ExportContext } from '../../portable-runtime';
import type { PortableRepository, PortableResourceFolder, PortableResource } from '@dailyuse/contracts/data-portability';
// Residual 1003: sole resolveExportRef/OrThrow (local dual retired).
import { parseJsonField, toBoolean, toDateString, resolveExportRef, resolveExportRefOrThrow } from './projection-helpers';

const SENSITIVE_CONFIG_KEYS = ['token', 'password', 'secret', 'apiKey', 'sshKey', 'privateKey', 'credential', 'auth'];

function sanitizeConfig(config: unknown): unknown {
  const parsed = parseJsonField(config);
  if (!parsed || typeof parsed !== 'object') return parsed;
  const obj = { ...(parsed as Record<string, unknown>) };
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_CONFIG_KEYS.some((s) => key.toLowerCase().includes(s))) {
      obj[key] = '[REDACTED]';
    }
  }
  return obj;
}

export function projectRepositories(repos: unknown[], ctx: ExportContext): PortableRepository[] {
  return repos.map((r) => {
    const entity = r as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('repository');
    ctx.refToIdMap.set(entity.id as string, ref);
    return {
      _ref: ref,
      name: entity.name as string,
      type: entity.type as string,
      path: entity.path as string | null | undefined,
      description: entity.description as string | null | undefined,
      config: sanitizeConfig(entity.config),
      status: entity.status as string,
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

export function projectResourceFolders(folders: unknown[], ctx: ExportContext): PortableResourceFolder[] {
  return folders.map((f) => {
    const entity = f as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('resourceFolder');
    ctx.refToIdMap.set(entity.id as string, ref);
    return {
      _ref: ref,
      repositoryRef: resolveExportRefOrThrow(entity.repositoryId as string, ctx, 'repository'),
      parentRef: resolveExportRef(entity.parentId as string | null, ctx, 'repository'),
      name: entity.name as string,
      path: entity.path as string,
      order: (entity.order as number) ?? 0,
      isExpanded: toBoolean(entity.isExpanded, false),
      metadata: parseJsonField(entity.metadata, {}),
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

export function projectResources(resources: unknown[], ctx: ExportContext): PortableResource[] {
  const mapped: (PortableResource | null)[] = resources.map((r) => {
    const entity = r as Record<string, unknown>;

    // Skip binary resources before allocating ref
    const type = entity.type as string;
    const isBinary = type === 'image' || type === 'pdf' || type === 'video' || type === 'audio' || type === 'binary';
    if (isBinary) {
      ctx.warnings.push(`Skipped binary resource: ${entity.name} (${type})`);
      return null;
    }

    const ref = ctx.refAllocator.allocate('resource');
    ctx.refToIdMap.set(entity.id as string, ref);

    return {
      _ref: ref,
      repositoryRef: resolveExportRefOrThrow(entity.repositoryId as string, ctx, 'repository'),
      folderRef: resolveExportRef(entity.folderId as string | null, ctx, 'repository') ?? undefined,
      type,
      name: entity.name as string,
      path: entity.path as string,
      size: entity.size as number | null | undefined,
      content: entity.content as string | null | undefined,
      metadata: parseJsonField(entity.metadata, {}),
      status: entity.status as string,
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    } satisfies PortableResource;
  });
  return mapped.filter((r): r is PortableResource => r !== null);
}

// Residual 1003: resolveExportRef/OrThrow elevated to projection-helpers.
