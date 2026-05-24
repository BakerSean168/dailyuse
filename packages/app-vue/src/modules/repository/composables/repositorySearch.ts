import type {
  ResourceClientDTO,
  SearchMatch,
  SearchRequest,
  SearchResponse,
  SearchResultItem,
} from '@dailyuse/contracts/repository';
import { getResourceDisplayName } from '../utils/resource-presentation';

export interface HighlightOptions {
  caseSensitive?: boolean;
  useRegex?: boolean;
  wholeWord?: boolean;
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

const MAX_MATCHES_PER_RESULT = 20;

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildSearchRegExp(query: string, options: HighlightOptions = {}): RegExp | null {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  const source = options.useRegex ? normalizedQuery : escapeRegExp(normalizedQuery);
  const wrappedSource = options.wholeWord ? `\\b(?:${source})\\b` : source;
  const flags = `g${options.caseSensitive ? '' : 'i'}`;

  try {
    return new RegExp(wrappedSource, flags);
  } catch {
    return null;
  }
}

export function buildHighlightSegments(
  text: string,
  query: string,
  options: HighlightOptions = {},
): HighlightSegment[] {
  const regex = buildSearchRegExp(query, options);

  if (!regex || !text) {
    return [{ text, match: false }];
  }

  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let currentMatch = regex.exec(text);

  while (currentMatch) {
    const matchText = currentMatch[0] ?? '';
    const startIndex = currentMatch.index;
    const endIndex = startIndex + matchText.length;

    if (startIndex > lastIndex) {
      segments.push({ text: text.slice(lastIndex, startIndex), match: false });
    }

    if (matchText) {
      segments.push({ text: matchText, match: true });
      lastIndex = endIndex;
    } else {
      const nextIndex = startIndex + 1;
      if (nextIndex > lastIndex) {
        segments.push({ text: text.slice(lastIndex, nextIndex), match: false });
        lastIndex = nextIndex;
      }
      regex.lastIndex = nextIndex;
    }

    currentMatch = regex.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), match: false });
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}

export function buildIndexedHighlightSegments(
  text: string,
  startIndex: number,
  endIndex: number,
): HighlightSegment[] {
  const safeStart = Math.max(0, Math.min(startIndex, text.length));
  const safeEnd = Math.max(safeStart, Math.min(endIndex, text.length));

  if (safeStart === safeEnd) {
    return [{ text, match: false }];
  }

  const segments: HighlightSegment[] = [];

  if (safeStart > 0) {
    segments.push({ text: text.slice(0, safeStart), match: false });
  }

  segments.push({ text: text.slice(safeStart, safeEnd), match: true });

  if (safeEnd < text.length) {
    segments.push({ text: text.slice(safeEnd), match: false });
  }

  return segments;
}

export function searchRepositoryResources(
  resources: ResourceClientDTO[],
  request: SearchRequest,
): SearchResponse {
  const startedAt = now();
  const regex = buildSearchRegExp(request.query, request);

  if (!regex) {
    return buildEmptySearchResponse(request, now() - startedAt);
  }

  const results = resources
    .map((resource) => searchSingleResource(resource, regex, request))
    .filter((result): result is SearchResultItem => result !== null)
    .sort((left, right) => {
      if (right.matchCount !== left.matchCount) {
        return right.matchCount - left.matchCount;
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  const totalMatches = results.reduce((sum, result) => sum + result.matchCount, 0);

  return {
    results,
    totalResults: results.length,
    totalMatches,
    searchTime: Math.round(now() - startedAt),
    query: request.query,
    mode: request.mode,
  };
}

function searchSingleResource(
  resource: ResourceClientDTO,
  regex: RegExp,
  request: SearchRequest,
): SearchResultItem | null {
  const resourceName = getResourceDisplayName(resource);
  const tags = Array.isArray(resource.metadata?.tags)
    ? resource.metadata.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];
  const content = resource.content ?? '';

  let matchType: SearchResultItem['matchType'] | null = null;
  let matchCount = 0;
  const matches: SearchMatch[] = [];

  const addFieldMatches = (
    text: string,
    nextMatchType: SearchResultItem['matchType'],
    lineNumber?: number,
  ) => {
    const fieldMatches = collectMatches(text, regex, lineNumber);
    if (fieldMatches.length === 0) {
      return;
    }

    if (!matchType) {
      matchType = nextMatchType;
    }

    matchCount += fieldMatches.length;

    if (typeof lineNumber === 'number' && matches.length < MAX_MATCHES_PER_RESULT) {
      matches.push(...fieldMatches.slice(0, MAX_MATCHES_PER_RESULT - matches.length));
    }
  };

  const mode = request.mode;

  if (mode === 'all' || mode === 'file') {
    addFieldMatches(resourceName, 'filename');
  }

  if (mode === 'all' || mode === 'path') {
    addFieldMatches(resource.path || '', 'path');
  }

  if (mode === 'all' || mode === 'tag') {
    for (const tag of tags) {
      addFieldMatches(tag, 'tag');
    }
  }

  if (content && shouldSearchContent(mode)) {
    const lines = content.split(/\r?\n/);

    lines.forEach((lineContent, index) => {
      if (!shouldIncludeLineForMode(mode, lineContent)) {
        return;
      }

      const lineMatches = collectMatches(lineContent, regex, index + 1);

      if (lineMatches.length === 0) {
        return;
      }

      if (!matchType) {
        matchType = mode === 'section' ? 'section' : mode === 'property' ? 'property' : 'content';
      }

      matchCount += lineMatches.length;

      if (matches.length < MAX_MATCHES_PER_RESULT) {
        matches.push(...lineMatches.slice(0, MAX_MATCHES_PER_RESULT - matches.length));
      }
    });
  }

  if (!matchType || matchCount === 0) {
    return null;
  }

  return {
    resourceId: resource.id,
    resourceName,
    resourcePath: resource.path,
    resourceType: resource.type,
    matchType,
    matches,
    matchCount,
    createdAt: String(resource.createdAt),
    updatedAt: String(resource.updatedAt),
    size: resource.size,
  };
}

function shouldSearchContent(mode: SearchRequest['mode']): boolean {
  return mode === 'all' || mode === 'line' || mode === 'section' || mode === 'property';
}

function shouldIncludeLineForMode(mode: SearchRequest['mode'], lineContent: string): boolean {
  if (mode === 'section') {
    return /^\s*#{1,6}\s+/.test(lineContent);
  }

  if (mode === 'property') {
    return /^\s*[A-Za-z0-9_.-]+\s*:\s*/.test(lineContent);
  }

  return true;
}

function collectMatches(text: string, regex: RegExp, lineNumber?: number): SearchMatch[] {
  if (!text) {
    return [];
  }

  const matches: SearchMatch[] = [];
  const matcher = new RegExp(regex.source, regex.flags);
  let currentMatch = matcher.exec(text);

  while (currentMatch) {
    const matchedText = currentMatch[0] ?? '';
    const startIndex = currentMatch.index;
    const endIndex = startIndex + matchedText.length;

    if (matchedText) {
      matches.push({
        lineNumber: lineNumber ?? 1,
        lineContent: text,
        startIndex,
        endIndex,
      });
    } else {
      matcher.lastIndex = startIndex + 1;
    }

    currentMatch = matcher.exec(text);
  }

  return matches;
}

function buildEmptySearchResponse(request: SearchRequest, elapsedMs: number): SearchResponse {
  return {
    results: [],
    totalResults: 0,
    totalMatches: 0,
    searchTime: Math.round(elapsedMs),
    query: request.query,
    mode: request.mode,
  };
}

function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}
