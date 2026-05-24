import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

export type MarkdownResourceReferenceKind = 'image' | 'link';

export interface MarkdownResourceReference {
  kind: MarkdownResourceReferenceKind;
  raw: string;
  label: string;
  destination: string;
  title: string | null;
  start: number;
  end: number;
  normalizedPath: string | null;
  isRepositoryReference: boolean;
}

export interface ResolvedMarkdownResourceReference extends MarkdownResourceReference {
  resource: ResourceClientDTO | null;
  resourceId: string | null;
  isBroken: boolean;
}

const MARKDOWN_REFERENCE_PATTERN = /(!?)\[([^\]]*)\]\(([^\n)]*)\)/g;

export function parseMarkdownResourceReferences(markdown: string): MarkdownResourceReference[] {
  const references: MarkdownResourceReference[] = [];

  for (const match of markdown.matchAll(MARKDOWN_REFERENCE_PATTERN)) {
    const raw = match[0] ?? '';
    const kind = match[1] === '!' ? 'image' : 'link';
    const label = match[2] ?? '';
    const target = splitMarkdownDestinationAndTitle(match[3] ?? '');
    const start = match.index ?? 0;
    const end = start + raw.length;
    const normalizedPath = normalizeMarkdownResourcePath(target.destination);
    const isRepositoryReference = isRepositoryMarkdownReferenceDestination(target.destination);

    references.push({
      kind,
      raw,
      label,
      destination: target.destination,
      title: target.title,
      start,
      end,
      normalizedPath,
      isRepositoryReference,
    });
  }

  return references;
}

export function resolveMarkdownResourceReferences(
  markdown: string,
  resources: ResourceClientDTO[],
): ResolvedMarkdownResourceReference[] {
  const resourceMap = buildResourcePathMap(resources);

  return parseMarkdownResourceReferences(markdown).map((reference) => {
    const resource = reference.normalizedPath
      ? (resourceMap.get(reference.normalizedPath) ?? null)
      : null;

    return {
      ...reference,
      resource,
      resourceId: resource?.id ?? null,
      isBroken: reference.isRepositoryReference && resource == null,
    };
  });
}

export function rewriteMarkdownResourceReference(
  markdown: string,
  reference: MarkdownResourceReference,
  next: {
    destination?: string;
    label?: string;
    title?: string | null;
  },
): string {
  const replacement = serializeMarkdownResourceReference({
    kind: reference.kind,
    label: next.label ?? reference.label,
    destination: next.destination ?? reference.destination,
    title: next.title === undefined ? reference.title : next.title,
  });

  return markdown.slice(0, reference.start) + replacement + markdown.slice(reference.end);
}

export function replaceMarkdownReferences(
  markdown: string,
  replacements: Array<{
    reference: MarkdownResourceReference;
    destination?: string;
    label?: string;
    title?: string | null;
  }>,
): string {
  const sorted = [...replacements].sort(
    (left, right) => right.reference.start - left.reference.start,
  );
  let nextMarkdown = markdown;

  for (const replacement of sorted) {
    nextMarkdown = rewriteMarkdownResourceReference(
      nextMarkdown,
      replacement.reference,
      replacement,
    );
  }

  return nextMarkdown;
}

export function serializeMarkdownResourceReference(input: {
  kind: MarkdownResourceReferenceKind;
  label: string;
  destination: string;
  title?: string | null;
}): string {
  const prefix = input.kind === 'image' ? '!' : '';
  const encodedDestination = encodeMarkdownDestination(input.destination);
  const title = input.title ? ` ${quoteMarkdownTitle(input.title)}` : '';

  return `${prefix}[${escapeMarkdownLabel(input.label)}](${encodedDestination}${title})`;
}

export function normalizeMarkdownResourcePath(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  const unwrapped = unwrapMarkdownDestination(trimmed);
  const decoded = decodeMarkdownDestination(unwrapped);
  const normalized = decoded.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');

  return normalized || null;
}

export function isRepositoryMarkdownReferenceDestination(
  destination: string | null | undefined,
): boolean {
  if (!destination) {
    return false;
  }

  const normalized = unwrapMarkdownDestination(destination.trim()).toLowerCase();
  if (!normalized) {
    return false;
  }

  return !(
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('#')
  );
}

export function encodeMarkdownDestination(destination: string): string {
  if (!destination.startsWith('data:')) {
    const normalized = destination.replace(/\\/g, '/');
    const encoded = encodeURI(normalized).replace(/\(/g, '%28').replace(/\)/g, '%29');
    return /\s/.test(encoded) ? `<${encoded}>` : encoded;
  }

  return destination;
}

export function buildResourcePathMap(
  resources: ResourceClientDTO[],
): Map<string, ResourceClientDTO> {
  const map = new Map<string, ResourceClientDTO>();

  for (const resource of resources) {
    const normalizedPath = normalizeMarkdownResourcePath(resource.path);
    if (normalizedPath) {
      map.set(normalizedPath, resource);
    }
  }

  return map;
}

function splitMarkdownDestinationAndTitle(value: string): {
  destination: string;
  title: string | null;
} {
  const trimmed = value.trim();
  const titleMatch = trimmed.match(/^(.*?)(?:\s+((?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*')))?$/);
  const destinationPart = titleMatch?.[1]?.trim() ?? trimmed;
  const titlePart = titleMatch?.[2]?.trim() ?? '';

  return {
    destination: unwrapMarkdownDestination(destinationPart),
    title: titlePart ? unquoteMarkdownTitle(titlePart) : null,
  };
}

function unwrapMarkdownDestination(value: string): string {
  if (value.startsWith('<') && value.endsWith('>')) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function decodeMarkdownDestination(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

function unquoteMarkdownTitle(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function quoteMarkdownTitle(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function escapeMarkdownLabel(value: string): string {
  return value.replace(/([\[\]\\])/g, '\\$1');
}

export const __test__ = {
  buildResourcePathMap,
  encodeMarkdownDestination,
  isRepositoryMarkdownReferenceDestination,
  normalizeMarkdownResourcePath,
  parseMarkdownResourceReferences,
  replaceMarkdownReferences,
  resolveMarkdownResourceReferences,
  rewriteMarkdownResourceReference,
  serializeMarkdownResourceReference,
};
