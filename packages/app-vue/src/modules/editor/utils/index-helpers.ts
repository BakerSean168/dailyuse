/**
 * Shared helpers for editor index builders (link-index, resource-reference-index).
 *
 * @module editor/utils/index-helpers
 */

import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

export function isMarkdownResource(resource: ResourceClientDTO): boolean {
  return resource.mimeType?.startsWith('text/markdown') || resource.extension === '.md';
}

export function toTimestamp(value: string | number | null | undefined): number {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function stripMarkdownExtension(value: string): string {
  return value.replace(/\.md$/i, '');
}
