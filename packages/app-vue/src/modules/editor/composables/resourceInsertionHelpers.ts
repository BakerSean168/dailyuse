/**
 * Pure helper functions for resource insertion.
 *
 * Extracted from useResourceInsertion.ts to reduce composable size.
 */

import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { getResourceDisplayName } from '../../repository/utils/resource-presentation';
import {
  serializeMarkdownResourceReference,
  resolveMarkdownResourceReferences,
  replaceMarkdownReferences,
} from '../utils/markdown-resource-references';
import type {
  ResourceInsertionKind,
  ResourceInsertionItem,
  ResourceInsertionMode,
  ResourceInsertionTemplate,
  ResourceInsertionFeedback,
  ResourceInsertionResult,
  SelfContainedExportFailure,
  SelfContainedExportResult,
} from './resourceInsertionTypes';

export const DEFAULT_BASE64_SIZE_LIMIT = 2 * 1024 * 1024;

export function buildResourceInsertionItems(
  resources: ResourceClientDTO[],
): ResourceInsertionItem[] {
  return [...resources]
    .map((resource) => toResourceInsertionItem(resource))
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export function toResourceInsertionItem(resource: ResourceClientDTO): ResourceInsertionItem {
  const tags = Array.isArray(resource.metadata?.tags) ? resource.metadata.tags : [];
  const searchableText = [
    getResourceDisplayName(resource),
    resource.name,
    resource.path,
    resource.mimeType,
    ...tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    resource,
    kind: classifyResourceInsertionKind(resource),
    searchableText,
    tags,
    updatedAt: toTimestamp(resource.updatedAt),
  };
}

export function classifyResourceInsertionKind(
  resource: Pick<ResourceClientDTO, 'mimeType' | 'extension' | 'name'>,
): ResourceInsertionKind {
  const mimeType = resource.mimeType || '';
  const extension = (resource.extension || '').toLowerCase();
  const name = (resource.name || '').toLowerCase();

  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(name)) {
    return 'image';
  }
  if (mimeType.startsWith('text/markdown') || extension === '.md' || name.endsWith('.md')) {
    return 'note';
  }
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return 'media';
  }
  if (
    mimeType === 'application/pdf' ||
    ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx'].includes(extension)
  ) {
    return 'file';
  }
  return 'other';
}

export function getResourceInsertionFeedback(
  result: Pick<ResourceInsertionResult, 'insertedResources' | 'failures'>,
): ResourceInsertionFeedback {
  const successCount = result.insertedResources.length;
  const failureCount = result.failures.length;
  return {
    successCount,
    failureCount,
    hasSuccess: successCount > 0,
    hasFailure: failureCount > 0,
    isPartial: successCount > 0 && failureCount > 0,
  };
}

export function isImageResource(
  resource: Pick<ResourceClientDTO, 'mimeType' | 'extension'>,
): boolean {
  if (resource.mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(resource.extension ?? '');
}

export function isImageFile(file: Pick<File, 'type' | 'name'>): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(file.name);
}

export async function buildResourceMarkdown(
  resource: ResourceClientDTO,
  options: {
    mode?: ResourceInsertionMode;
    template?: ResourceInsertionTemplate;
    readResourceAsDataUrl: (resource: ResourceClientDTO) => Promise<string>;
    maxBase64Bytes?: number;
  },
): Promise<string> {
  const mode = options.mode ?? 'path';
  const template = options.template ?? 'auto';
  const effectiveTemplate = resolveInsertionTemplate(resource, template);

  if (mode === 'base64') {
    if (effectiveTemplate !== 'image') {
      throw new Error('Base64 insertion is only supported for images.');
    }
    const maxBase64Bytes = options.maxBase64Bytes ?? DEFAULT_BASE64_SIZE_LIMIT;
    if (resource.size > maxBase64Bytes) {
      throw new Error('Resource exceeds the base64 insertion size limit.');
    }
    const dataUrl = await options.readResourceAsDataUrl(resource);
    return serializeMarkdownResourceReference({
      kind: 'image',
      label: deriveImageAltText(resource),
      destination: dataUrl,
    });
  }

  return buildPathMarkdownReference(resource, effectiveTemplate);
}

export function buildPathMarkdownReference(
  resource: Pick<ResourceClientDTO, 'name' | 'path' | 'mimeType' | 'extension'>,
  template: Exclude<ResourceInsertionTemplate, 'auto'>,
): string {
  if (!resource.path) {
    throw new Error('Repository resource is missing a path.');
  }
  if (template === 'image') {
    return serializeMarkdownResourceReference({
      kind: 'image',
      label: deriveImageAltText(resource),
      destination: resource.path,
    });
  }
  return serializeMarkdownResourceReference({
    kind: 'link',
    label: deriveResourceLabel(resource),
    destination: resource.path,
  });
}

export function deriveImageAltText(
  resource: Pick<ResourceClientDTO, 'name' | 'path'>,
): string {
  const rawName = getResourceDisplayName(resource).trim() || resource.name.trim();
  const withoutExtension = rawName.replace(/\.[^.]+$/, '').trim();
  return withoutExtension || 'image';
}

export function deriveResourceLabel(
  resource: Pick<ResourceClientDTO, 'name' | 'path'>,
): string {
  return getResourceDisplayName(resource).trim() || 'resource';
}

export function resolveInsertionTemplate(
  resource: Pick<ResourceClientDTO, 'mimeType' | 'extension' | 'name'>,
  template: ResourceInsertionTemplate,
): Exclude<ResourceInsertionTemplate, 'auto'> {
  if (template !== 'auto') return template;
  const kind = classifyResourceInsertionKind(resource);
  switch (kind) {
    case 'image': return 'image';
    case 'note': return 'note-link';
    case 'file': return 'attachment-link';
    case 'media': return 'media';
    default: return 'attachment-link';
  }
}

export function buildPastedImageFileName(input: {
  noteName?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  index: number;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  const noteSlug = slugifyNoteName(input.noteName);
  const extension =
    resolveFileExtension(input.originalName ?? undefined) ||
    resolveExtensionFromMimeType(input.mimeType ?? undefined) ||
    'png';

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const sequence = String(input.index + 1).padStart(2, '0');

  return `${noteSlug}-${date}-${time}-${sequence}.${extension}`;
}

function slugifyNoteName(noteName?: string | null): string {
  const raw = (noteName ?? 'note')
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase();
  const slug = raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'note';
}

function resolveFileExtension(fileName?: string): string | null {
  if (!fileName) return null;
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return match?.[1] ?? null;
}

function resolveExtensionFromMimeType(mimeType?: string): string | null {
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/avif': 'avif',
  };
  return mimeType ? (mimeMap[mimeType.toLowerCase()] ?? null) : null;
}

export function renameFile(file: File, nextName: string): File {
  return new File([file], nextName, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

export function toTimestamp(value: string | number | null | undefined): number {
  if (!value) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/** Converts repository image references to inline base64 data URLs. */
export async function exportMarkdownAsSelfContainedHelper(
  markdown: string,
  resources: ResourceClientDTO[],
  readResourceAsDataUrl: (resource: ResourceClientDTO) => Promise<string>,
  maxBase64Bytes: number = DEFAULT_BASE64_SIZE_LIMIT,
): Promise<SelfContainedExportResult> {
  const references = resolveMarkdownResourceReferences(markdown, resources).filter(
    (reference) => reference.kind === 'image' && reference.isRepositoryReference,
  );

  const replacements: Array<{ reference: (typeof references)[number]; destination: string }> = [];
  const failures: SelfContainedExportFailure[] = [];

  for (const reference of references) {
    if (!reference.resource) {
      failures.push({ resourceId: null, path: reference.destination, reason: 'missing-resource' });
      continue;
    }
    if (!isImageResource(reference.resource)) {
      failures.push({ resourceId: reference.resource.id, path: reference.destination, reason: 'unsupported-resource' });
      continue;
    }
    if (reference.resource.size > maxBase64Bytes) {
      failures.push({ resourceId: reference.resource.id, path: reference.destination, reason: 'too-large' });
      continue;
    }
    try {
      const dataUrl = await readResourceAsDataUrl(reference.resource);
      replacements.push({ reference, destination: dataUrl });
    } catch {
      failures.push({ resourceId: reference.resource.id, path: reference.destination, reason: 'read-failed' });
    }
  }

  return {
    markdown: replaceMarkdownReferences(markdown, replacements),
    convertedCount: replacements.length,
    skippedCount: failures.length,
    failures,
  };
}
