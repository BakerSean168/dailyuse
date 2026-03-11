import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import {
  normalizeWikiLinkValue,
  parseWikiLinks,
  stripMarkdownExtension,
  type WikiLinkMatch,
} from './wikiLinks';

export interface LinkIndexDocument {
  id: string;
  resourceId: string;
  title: string;
  name: string;
  displayName: string;
  path: string;
  type: string;
  mimeType: string;
  extension: string;
  tags: string[];
  updatedAt: number;
  content: string;
  isMarkdown: boolean;
}

export interface LinkIndexLink {
  id: string;
  sourceId: string;
  targetId: string | null;
  raw: string;
  target: string;
  alias: string | null;
  section: string | null;
  displayText: string;
  context: string;
  start: number;
  end: number;
  isBroken: boolean;
}

export interface BacklinkItem {
  link: LinkIndexLink;
  sourceDocument: LinkIndexDocument;
  context: string;
}

export interface LinkGraphNode {
  id: string;
  title: string;
  isCenter: boolean;
  isCurrent: boolean;
  linkCount: number;
  backlinkCount: number;
  depth: number;
}

export interface LinkGraphEdge {
  sourceId: string;
  targetId: string;
  source: string;
  target: string;
  linkText?: string;
}

export interface LinkGraphData {
  nodes: LinkGraphNode[];
  edges: LinkGraphEdge[];
  centerId: string;
  depth: number;
  truncated: boolean;
}

export interface EditorLinkIndex {
  documents: LinkIndexDocument[];
  documentsById: Map<string, LinkIndexDocument>;
  outgoingBySource: Map<string, LinkIndexLink[]>;
  incomingByTarget: Map<string, LinkIndexLink[]>;
  unresolvedLinks: LinkIndexLink[];
  resolveDocument(input: string): LinkIndexDocument | null;
}

export interface SearchDocumentsOptions {
  excludeId?: string;
  limit?: number;
}

export interface GraphOptions {
  maxNodes?: number;
  maxEdges?: number;
}

function isMarkdownResource(resource: ResourceClientDTO): boolean {
  return resource.mimeType?.startsWith('text/markdown') || resource.extension === '.md';
}

function toTimestamp(value: string | number | null | undefined): number {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getDocumentTitle(resource: ResourceClientDTO): string {
  return stripMarkdownExtension(resource.displayName || resource.name);
}

function getLookupKeys(document: LinkIndexDocument): string[] {
  const pathWithoutExtension = stripMarkdownExtension(document.path);
  const relativePath = pathWithoutExtension.replace(/^\/+/, '');

  return Array.from(
    new Set(
      [
        document.title,
        document.name,
        document.displayName,
        stripMarkdownExtension(document.name),
        document.path,
        pathWithoutExtension,
        relativePath,
      ]
        .filter(Boolean)
        .map((value) => normalizeWikiLinkValue(value)),
    ),
  );
}

function rankDocument(document: LinkIndexDocument): number {
  return document.tags.length * 10 + document.content.length;
}

function sortDocuments(a: LinkIndexDocument, b: LinkIndexDocument): number {
  const scoreDiff = rankDocument(b) - rankDocument(a);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  return a.path.localeCompare(b.path);
}

function extractLinkContext(content: string, match: WikiLinkMatch): string {
  const lineStart = content.lastIndexOf('\n', match.start) + 1;
  const nextLineBreak = content.indexOf('\n', match.end);
  const lineEnd = nextLineBreak === -1 ? content.length : nextLineBreak;
  return content.slice(lineStart, lineEnd).trim();
}

function buildDocument(resource: ResourceClientDTO): LinkIndexDocument {
  return {
    id: resource.id,
    resourceId: resource.id,
    title: getDocumentTitle(resource),
    name: resource.name,
    displayName: resource.displayName || resource.name,
    path: resource.path,
    type: resource.type,
    mimeType: resource.mimeType,
    extension: resource.extension,
    tags: Array.isArray(resource.metadata?.tags) ? resource.metadata.tags : [],
    updatedAt: toTimestamp(resource.updatedAt),
    content: typeof resource.content === 'string' ? resource.content : '',
    isMarkdown: isMarkdownResource(resource),
  };
}

function createResolver(
  keyMap: Map<string, LinkIndexDocument[]>,
): EditorLinkIndex['resolveDocument'] {
  return (input: string) => {
    const normalizedInput = normalizeWikiLinkValue(input);
    if (!normalizedInput) {
      return null;
    }

    const candidates = keyMap.get(normalizedInput) ?? [];

    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    return [...candidates].sort(sortDocuments)[0] ?? null;
  };
}

export function buildEditorLinkIndex(resources: ResourceClientDTO[]): EditorLinkIndex {
  const documents = resources.map(buildDocument).sort(sortDocuments);
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const keyMap = new Map<string, LinkIndexDocument[]>();

  for (const document of documents) {
    for (const key of getLookupKeys(document)) {
      const existing = keyMap.get(key) ?? [];
      existing.push(document);
      keyMap.set(key, existing);
    }
  }

  const resolveDocument = createResolver(keyMap);
  const outgoingBySource = new Map<string, LinkIndexLink[]>();
  const incomingByTarget = new Map<string, LinkIndexLink[]>();
  const unresolvedLinks: LinkIndexLink[] = [];

  for (const document of documents.filter((item) => item.isMarkdown)) {
    const links = parseWikiLinks(document.content).map((match, index) => {
      const targetDocument = resolveDocument(match.target);

      const link: LinkIndexLink = {
        id: `${document.id}:${index}:${match.start}`,
        sourceId: document.id,
        targetId: targetDocument?.id ?? null,
        raw: match.raw,
        target: match.target,
        alias: match.alias,
        section: match.section,
        displayText: match.displayText,
        context: extractLinkContext(document.content, match),
        start: match.start,
        end: match.end,
        isBroken: targetDocument == null,
      };

      if (link.targetId) {
        const incoming = incomingByTarget.get(link.targetId) ?? [];
        incoming.push(link);
        incomingByTarget.set(link.targetId, incoming);
      } else {
        unresolvedLinks.push(link);
      }

      return link;
    });

    outgoingBySource.set(document.id, links);
  }

  return {
    documents,
    documentsById,
    outgoingBySource,
    incomingByTarget,
    unresolvedLinks,
    resolveDocument,
  };
}

export function searchLinkIndexDocuments(
  index: EditorLinkIndex,
  query: string,
  options: SearchDocumentsOptions = {},
): LinkIndexDocument[] {
  const normalizedQuery = normalizeWikiLinkValue(query);
  const limit = options.limit ?? 20;

  const results = index.documents
    .filter((document) => document.id !== options.excludeId)
    .map((document) => {
      const fields = [document.title, document.displayName, document.path, ...document.tags].map(
        (field) => normalizeWikiLinkValue(field),
      );

      const score = normalizedQuery
        ? Math.max(
            ...fields.map((field) => {
              if (!field) {
                return 0;
              }

              if (field === normalizedQuery) {
                return 120;
              }

              if (field.startsWith(normalizedQuery)) {
                return 90;
              }

              if (field.includes(normalizedQuery)) {
                return 60;
              }

              return 0;
            }),
          )
        : 10;

      return {
        document,
        score: score + rankDocument(document),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.document.path.localeCompare(b.document.path))
    .slice(0, limit)
    .map((entry) => entry.document);

  return results;
}

export function getBacklinksForDocument(
  index: EditorLinkIndex,
  documentId: string,
  limit = 100,
): BacklinkItem[] {
  const links = index.incomingByTarget.get(documentId) ?? [];

  return links
    .map((link) => {
      const sourceDocument = index.documentsById.get(link.sourceId);
      if (!sourceDocument) {
        return null;
      }

      return {
        link,
        sourceDocument,
        context: link.context,
      };
    })
    .filter((item): item is BacklinkItem => item !== null)
    .sort((a, b) => b.sourceDocument.updatedAt - a.sourceDocument.updatedAt)
    .slice(0, limit);
}

function getAdjacentDocumentIds(index: EditorLinkIndex, documentId: string): string[] {
  const outgoing = (index.outgoingBySource.get(documentId) ?? [])
    .map((link) => link.targetId)
    .filter((id): id is string => Boolean(id));
  const incoming = (index.incomingByTarget.get(documentId) ?? []).map((link) => link.sourceId);

  return Array.from(new Set([...outgoing, ...incoming]));
}

export function getLinkGraphForDocument(
  index: EditorLinkIndex,
  documentId: string,
  depth: number,
  options: GraphOptions = {},
): LinkGraphData {
  const maxNodes = options.maxNodes ?? 40;
  const maxEdges = options.maxEdges ?? 80;
  const centerDocument = index.documentsById.get(documentId);

  if (!centerDocument) {
    return {
      nodes: [],
      edges: [],
      centerId: documentId,
      depth,
      truncated: false,
    };
  }

  const visited = new Set<string>([documentId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: documentId, depth: 0 }];
  const nodeDepth = new Map<string, number>([[documentId, 0]]);
  let truncated = false;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.depth >= depth) {
      continue;
    }

    const candidates = getAdjacentDocumentIds(index, current.id)
      .map((id) => index.documentsById.get(id))
      .filter((item): item is LinkIndexDocument => item !== undefined)
      .sort(sortDocuments);

    for (const candidate of candidates) {
      if (visited.has(candidate.id)) {
        continue;
      }

      if (visited.size >= maxNodes) {
        truncated = true;
        break;
      }

      visited.add(candidate.id);
      nodeDepth.set(candidate.id, current.depth + 1);
      queue.push({ id: candidate.id, depth: current.depth + 1 });
    }
  }

  const allowedNodeIds = visited;
  const edges: LinkGraphEdge[] = [];
  const seenEdges = new Set<string>();

  for (const [sourceId, links] of index.outgoingBySource.entries()) {
    if (!allowedNodeIds.has(sourceId)) {
      continue;
    }

    for (const link of links) {
      if (!link.targetId || !allowedNodeIds.has(link.targetId)) {
        continue;
      }

      const edgeKey = `${sourceId}->${link.targetId}:${link.raw}`;
      if (seenEdges.has(edgeKey)) {
        continue;
      }

      seenEdges.add(edgeKey);
      edges.push({
        sourceId,
        targetId: link.targetId,
        source: sourceId,
        target: link.targetId,
        linkText: link.displayText,
      });

      if (edges.length >= maxEdges) {
        truncated = true;
        break;
      }
    }

    if (edges.length >= maxEdges) {
      break;
    }
  }

  const nodes: LinkGraphNode[] = Array.from(allowedNodeIds)
    .map((id) => index.documentsById.get(id))
    .filter((item): item is LinkIndexDocument => item !== undefined)
    .sort(sortDocuments)
    .map((document) => ({
      id: document.id,
      title: document.title,
      isCenter: document.id === documentId,
      isCurrent: document.id === documentId,
      linkCount: (index.outgoingBySource.get(document.id) ?? []).filter((link) => link.targetId)
        .length,
      backlinkCount: (index.incomingByTarget.get(document.id) ?? []).length,
      depth: nodeDepth.get(document.id) ?? depth,
    }));

  return {
    nodes,
    edges,
    centerId: documentId,
    depth,
    truncated,
  };
}
