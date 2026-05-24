import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { getResourceDisplayName } from '../../repository/utils/resource-presentation';
import {
  normalizeWikiLinkValue,
  parseWikiLinks,
  stripMarkdownExtension,
  type WikiLinkMatch,
} from './wiki-links';

export interface LinkIndexNote {
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
  sourceNote: LinkIndexNote;
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
  notes: LinkIndexNote[];
  notesById: Map<string, LinkIndexNote>;
  outgoingBySource: Map<string, LinkIndexLink[]>;
  incomingByTarget: Map<string, LinkIndexLink[]>;
  unresolvedLinks: LinkIndexLink[];
  resolveNote(input: string): LinkIndexNote | null;
}

export interface SearchNotesOptions {
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

function getNoteTitle(resource: ResourceClientDTO): string {
  return stripMarkdownExtension(getResourceDisplayName(resource));
}

function getLookupKeys(note: LinkIndexNote): string[] {
  const pathWithoutExtension = stripMarkdownExtension(note.path);
  const relativePath = pathWithoutExtension.replace(/^\/+/, '');

  return Array.from(
    new Set(
      [
        note.title,
        note.name,
        note.displayName,
        stripMarkdownExtension(note.name),
        note.path,
        pathWithoutExtension,
        relativePath,
      ]
        .filter(Boolean)
        .map((value) => normalizeWikiLinkValue(value)),
    ),
  );
}

function rankNote(note: LinkIndexNote): number {
  return note.tags.length * 10 + note.content.length;
}

function sortNotes(a: LinkIndexNote, b: LinkIndexNote): number {
  const scoreDiff = rankNote(b) - rankNote(a);
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

function buildNote(resource: ResourceClientDTO): LinkIndexNote {
  const displayName = getResourceDisplayName(resource);

  return {
    id: resource.id,
    resourceId: resource.id,
    title: getNoteTitle(resource),
    name: resource.name,
    displayName,
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

function createResolver(keyMap: Map<string, LinkIndexNote[]>): EditorLinkIndex['resolveNote'] {
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

    return [...candidates].sort(sortNotes)[0] ?? null;
  };
}

export function buildEditorLinkIndex(resources: ResourceClientDTO[]): EditorLinkIndex {
  const notes = resources.map(buildNote).sort(sortNotes);
  const notesById = new Map(notes.map((note) => [note.id, note]));
  const keyMap = new Map<string, LinkIndexNote[]>();

  for (const note of notes) {
    for (const key of getLookupKeys(note)) {
      const existing = keyMap.get(key) ?? [];
      existing.push(note);
      keyMap.set(key, existing);
    }
  }

  const resolveNote = createResolver(keyMap);
  const outgoingBySource = new Map<string, LinkIndexLink[]>();
  const incomingByTarget = new Map<string, LinkIndexLink[]>();
  const unresolvedLinks: LinkIndexLink[] = [];

  for (const note of notes.filter((item) => item.isMarkdown)) {
    const links = parseWikiLinks(note.content).map((match, index) => {
      const targetNote = resolveNote(match.target);

      const link: LinkIndexLink = {
        id: `${note.id}:${index}:${match.start}`,
        sourceId: note.id,
        targetId: targetNote?.id ?? null,
        raw: match.raw,
        target: match.target,
        alias: match.alias,
        section: match.section,
        displayText: match.displayText,
        context: extractLinkContext(note.content, match),
        start: match.start,
        end: match.end,
        isBroken: targetNote == null,
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

    outgoingBySource.set(note.id, links);
  }

  return {
    notes,
    notesById,
    outgoingBySource,
    incomingByTarget,
    unresolvedLinks,
    resolveNote,
  };
}

export function searchLinkIndexNotes(
  index: EditorLinkIndex,
  query: string,
  options: SearchNotesOptions = {},
): LinkIndexNote[] {
  const normalizedQuery = normalizeWikiLinkValue(query);
  const limit = options.limit ?? 20;

  const results = index.notes
    .filter((note) => note.id !== options.excludeId)
    .map((note) => {
      const fields = [note.title, note.displayName, note.path, ...note.tags].map((field) =>
        normalizeWikiLinkValue(field),
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
        note,
        score: score + rankNote(note),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.note.path.localeCompare(b.note.path))
    .slice(0, limit)
    .map((entry) => entry.note);

  return results;
}

export function getBacklinksForNote(
  index: EditorLinkIndex,
  noteId: string,
  limit = 100,
): BacklinkItem[] {
  const links = index.incomingByTarget.get(noteId) ?? [];

  return links
    .map((link) => {
      const sourceNote = index.notesById.get(link.sourceId);
      if (!sourceNote) {
        return null;
      }

      return {
        link,
        sourceNote,
        context: link.context,
      };
    })
    .filter((item): item is BacklinkItem => item !== null)
    .sort((a, b) => b.sourceNote.updatedAt - a.sourceNote.updatedAt)
    .slice(0, limit);
}

function getAdjacentNoteIds(index: EditorLinkIndex, noteId: string): string[] {
  const outgoing = (index.outgoingBySource.get(noteId) ?? [])
    .map((link) => link.targetId)
    .filter((id): id is string => Boolean(id));
  const incoming = (index.incomingByTarget.get(noteId) ?? []).map((link) => link.sourceId);

  return Array.from(new Set([...outgoing, ...incoming]));
}

export function getLinkGraphForNote(
  index: EditorLinkIndex,
  noteId: string,
  depth: number,
  options: GraphOptions = {},
): LinkGraphData {
  const maxNodes = options.maxNodes ?? 40;
  const maxEdges = options.maxEdges ?? 80;
  const centerNote = index.notesById.get(noteId);

  if (!centerNote) {
    return {
      nodes: [],
      edges: [],
      centerId: noteId,
      depth,
      truncated: false,
    };
  }

  const visited = new Set<string>([noteId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: noteId, depth: 0 }];
  const nodeDepth = new Map<string, number>([[noteId, 0]]);
  let truncated = false;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.depth >= depth) {
      continue;
    }

    const candidates = getAdjacentNoteIds(index, current.id)
      .map((id) => index.notesById.get(id))
      .filter((item): item is LinkIndexNote => item !== undefined)
      .sort(sortNotes);

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
    .map((id) => index.notesById.get(id))
    .filter((item): item is LinkIndexNote => item !== undefined)
    .sort(sortNotes)
    .map((note) => ({
      id: note.id,
      title: note.title,
      isCenter: note.id === noteId,
      isCurrent: note.id === noteId,
      linkCount: (index.outgoingBySource.get(note.id) ?? []).filter((link) => link.targetId).length,
      backlinkCount: (index.incomingByTarget.get(note.id) ?? []).length,
      depth: nodeDepth.get(note.id) ?? depth,
    }));

  return {
    nodes,
    edges,
    centerId: noteId,
    depth,
    truncated,
  };
}
