/**
 * Repository Helpers — pure utility functions extracted from useRepository
 *
 * @module repository/composables/repositoryHelpers
 */

import type { ResourceClientDTO, SearchResponse } from '@dailyuse/contracts/repository';
import type { RepositoryUploadFailure } from './useRepositoryUpload';
import { getI18nGlobal } from '../../../plugins/i18n';
import { translateResultError } from '../../../shared/utils/translate-result-error';

export function buildUntitledNoteName(): string {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ];

  return `Untitled ${parts.join('-')}.md`;
}

export function normalizeNoteName(name: string): string {
  const trimmedName = name.trim() || buildUntitledNoteName();
  return trimmedName.toLowerCase().endsWith('.md') ? trimmedName : `${trimmedName}.md`;
}

export function ensureUniqueNoteName(name: string, resources: ResourceClientDTO[]): string {
  const normalizedExistingNames = new Set(resources.map((resource) => resource.name.toLowerCase()));
  if (!normalizedExistingNames.has(name.toLowerCase())) {
    return name;
  }

  const extensionIndex = name.toLowerCase().lastIndexOf('.md');
  const baseName = extensionIndex >= 0 ? name.slice(0, extensionIndex) : name;

  let suffix = 2;
  while (normalizedExistingNames.has(`${baseName} ${suffix}.md`.toLowerCase())) {
    suffix += 1;
  }

  return `${baseName} ${suffix}.md`;
}

export function isSearchResponse(value: unknown): value is SearchResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { results?: unknown[]; totalResults?: unknown };
  return Array.isArray(candidate.results) && typeof candidate.totalResults === 'number';
}

export function isUploadResponse(value: unknown): value is {
  successes: Array<{ resource: ResourceClientDTO }>;
  failures: RepositoryUploadFailure[];
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    successes?: Array<{ resource: ResourceClientDTO }>;
    failures?: RepositoryUploadFailure[];
  };
  return Array.isArray(candidate.successes) && Array.isArray(candidate.failures);
}

export function isTextLikeFile(file: File): boolean {
  if (file.type.startsWith('text/')) {
    return true;
  }

  return /\.(md|markdown|txt|json|js|jsx|ts|tsx|css|scss|html|xml|yml|yaml|csv)$/i.test(file.name);
}

export function guessMimeType(fileName: string): string {
  if (/\.md$/i.test(fileName)) {
    return 'text/markdown';
  }

  if (/\.(txt|csv|json|ya?ml|xml|html|css|scss|ts|tsx|js|jsx)$/i.test(fileName)) {
    return 'text/plain';
  }

  return 'application/octet-stream';
}

export function getResultErrorMessage(
  result: { error?: { code?: string; message?: string } },
  fallbackMessage: string,
): string {
  const t = getI18nGlobal()?.t;
  if (!t) {
    return result.error?.message || fallbackMessage;
  }

  const translated = translateResultError(result.error, t, {
    fallbackKey: 'common.operationFailed',
  });
  return translated === t('common.operationFailed') ? fallbackMessage : translated;
}
