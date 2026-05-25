export interface WikiLinkMatch {
  raw: string;
  target: string;
  alias: string | null;
  section: string | null;
  displayText: string;
  start: number;
  end: number;
}

export interface ActiveWikiLinkRange {
  from: number;
  to: number;
  query: string;
}

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

function splitWikiLinkBody(body: string): {
  target: string;
  alias: string | null;
  section: string | null;
} {
  const [rawTarget, rawAlias] = body.split('|', 2);
  const alias = rawAlias?.trim() || null;
  const [targetPart, rawSection] = rawTarget.split('#', 2);
  const target = targetPart.trim();
  const section = rawSection?.trim() || null;

  return {
    target,
    alias,
    section,
  };
}

export function parseWikiLinks(content: string): WikiLinkMatch[] {
  const links: WikiLinkMatch[] = [];

  for (const match of content.matchAll(WIKI_LINK_PATTERN)) {
    const raw = match[0];
    const body = match[1]?.trim();
    const start = match.index ?? -1;

    if (!body || start < 0) {
      continue;
    }

    const { target, alias, section } = splitWikiLinkBody(body);

    if (!target) {
      continue;
    }

    links.push({
      raw,
      target,
      alias,
      section,
      displayText: alias || (section ? `${target}#${section}` : target),
      start,
      end: start + raw.length,
    });
  }

  return links;
}

export function normalizeWikiLinkValue(value: string): string {
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function stripMarkdownExtension(value: string): string {
  return value.replace(/\.md$/i, '');
}

export function getWikiLinkDisplayText(
  target: string,
  alias?: string | null,
  section?: string | null,
): string {
  if (alias) {
    return alias;
  }

  return section ? `${target}#${section}` : target;
}

export function formatWikiLink(
  target: string,
  alias?: string | null,
  section?: string | null,
): string {
  const sectionSuffix = section ? `#${section}` : '';
  const aliasSuffix = alias ? `|${alias}` : '';
  return `[[${target}${sectionSuffix}${aliasSuffix}]]`;
}

export function findActiveWikiLinkRange(
  content: string,
  cursor: number,
): ActiveWikiLinkRange | null {
  if (cursor < 0 || cursor > content.length) {
    return null;
  }

  const beforeCursor = content.slice(0, cursor);
  const afterCursor = content.slice(cursor);
  const openIndex = beforeCursor.lastIndexOf('[[');

  if (openIndex < 0) {
    return null;
  }

  const closingBeforeCursor = beforeCursor.lastIndexOf(']]');
  if (closingBeforeCursor > openIndex) {
    return null;
  }

  const query = content.slice(openIndex + 2, cursor);

  if (/[\[\]\n\r]/.test(query)) {
    return null;
  }

  if (afterCursor.startsWith(']]')) {
    return {
      from: openIndex,
      to: cursor + 2,
      query,
    };
  }

  const nextClose = afterCursor.indexOf(']]');
  const nextOpen = afterCursor.indexOf('[[');

  if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
    return null;
  }

  if (nextClose !== -1) {
    const suffix = afterCursor.slice(0, nextClose);
    if (/[\[\]\n\r]/.test(suffix)) {
      return null;
    }

    return {
      from: openIndex,
      to: cursor,
      query,
    };
  }

  return {
    from: openIndex,
    to: cursor,
    query,
  };
}

export function getWikiLinkQueryAtCursor(content: string, cursor: number): string | null {
  return findActiveWikiLinkRange(content, cursor)?.query ?? null;
}
