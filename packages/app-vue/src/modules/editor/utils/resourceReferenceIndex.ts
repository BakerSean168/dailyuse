import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { getResourceDisplayName } from '../../repository/utils/resourcePresentation';
import {
  buildResourcePathMap,
  resolveMarkdownResourceReferences,
  rewriteMarkdownResourceReference,
  type MarkdownResourceReference,
  type ResolvedMarkdownResourceReference,
} from './markdownResourceReferences';

export interface ResourceReferenceNote {
  id: string;
  resourceId: string;
  title: string;
  name: string;
  displayName: string;
  path: string;
  content: string;
  updatedAt: number;
}

export interface ResourceReferenceUsage {
  noteId: string;
  noteResourceId: string;
  noteTitle: string;
  notePath: string;
  reference: ResolvedMarkdownResourceReference;
}

export interface ResourceReferenceIndex {
  notes: ResourceReferenceNote[];
  notesById: Map<string, ResourceReferenceNote>;
  notesByResourceId: Map<string, ResourceReferenceNote>;
  referencesByNoteId: Map<string, ResolvedMarkdownResourceReference[]>;
  inboundByResourceId: Map<string, ResourceReferenceUsage[]>;
  unresolvedByNoteId: Map<string, ResolvedMarkdownResourceReference[]>;
  unresolvedReferences: ResourceReferenceUsage[];
  resourcesByPath: Map<string, ResourceClientDTO>;
  getNoteReferences(noteId: string): ResolvedMarkdownResourceReference[];
  getInboundReferences(resourceId: string): ResourceReferenceUsage[];
  getUnresolvedReferences(noteId?: string): ResourceReferenceUsage[];
  getDeleteImpact(resourceId: string): {
    resourceId: string;
    referenceCount: number;
    notes: ResourceReferenceNote[];
    usages: ResourceReferenceUsage[];
  };
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

function stripMarkdownExtension(value: string): string {
  return value.replace(/\.md$/i, '');
}

function buildNote(resource: ResourceClientDTO): ResourceReferenceNote {
  const displayName = getResourceDisplayName(resource);

  return {
    id: resource.id,
    resourceId: resource.id,
    title: stripMarkdownExtension(displayName),
    name: resource.name,
    displayName,
    path: resource.path,
    content: typeof resource.content === 'string' ? resource.content : '',
    updatedAt: toTimestamp(resource.updatedAt),
  };
}

function buildUsage(
  note: ResourceReferenceNote,
  reference: ResolvedMarkdownResourceReference,
): ResourceReferenceUsage {
  return {
    noteId: note.id,
    noteResourceId: note.resourceId,
    noteTitle: note.title,
    notePath: note.path,
    reference,
  };
}

export function buildResourceReferenceIndex(
  resources: ResourceClientDTO[],
): ResourceReferenceIndex {
  const notes = resources
    .filter(isMarkdownResource)
    .map(buildNote)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const notesById = new Map(notes.map((note) => [note.id, note]));
  const notesByResourceId = new Map(notes.map((note) => [note.resourceId, note]));
  const resourcesByPath = buildResourcePathMap(resources);
  const referencesByNoteId = new Map<string, ResolvedMarkdownResourceReference[]>();
  const inboundByResourceId = new Map<string, ResourceReferenceUsage[]>();
  const unresolvedByNoteId = new Map<string, ResolvedMarkdownResourceReference[]>();
  const unresolvedReferences: ResourceReferenceUsage[] = [];

  for (const note of notes) {
    const references = resolveMarkdownResourceReferences(note.content, resources).filter(
      (reference) => reference.isRepositoryReference,
    );

    referencesByNoteId.set(note.id, references);

    const unresolved: ResolvedMarkdownResourceReference[] = [];

    for (const reference of references) {
      const usage = buildUsage(note, reference);

      if (reference.resourceId) {
        const inbound = inboundByResourceId.get(reference.resourceId) ?? [];
        inbound.push(usage);
        inboundByResourceId.set(reference.resourceId, inbound);
      }

      if (reference.isBroken) {
        unresolved.push(reference);
        unresolvedReferences.push(usage);
      }
    }

    unresolvedByNoteId.set(note.id, unresolved);
  }

  return {
    notes,
    notesById,
    notesByResourceId,
    referencesByNoteId,
    inboundByResourceId,
    unresolvedByNoteId,
    unresolvedReferences,
    resourcesByPath,
    getNoteReferences(noteId) {
      return referencesByNoteId.get(noteId) ?? [];
    },
    getInboundReferences(resourceId) {
      return inboundByResourceId.get(resourceId) ?? [];
    },
    getUnresolvedReferences(noteId) {
      if (!noteId) {
        return unresolvedReferences;
      }

      const note = notesById.get(noteId);
      if (!note) {
        return [];
      }

      return (unresolvedByNoteId.get(noteId) ?? []).map((reference) => buildUsage(note, reference));
    },
    getDeleteImpact(resourceId) {
      const usages = inboundByResourceId.get(resourceId) ?? [];
      const noteIds = new Set(usages.map((usage) => usage.noteId));
      const impactedNotes = Array.from(noteIds)
        .map((noteId) => notesById.get(noteId) ?? null)
        .filter((note): note is ResourceReferenceNote => note !== null)
        .sort((left, right) => right.updatedAt - left.updatedAt);

      return {
        resourceId,
        referenceCount: usages.length,
        notes: impactedNotes,
        usages,
      };
    },
  };
}

export function repairBrokenMarkdownReference(input: {
  markdown: string;
  reference: MarkdownResourceReference;
  replacement: Pick<ResourceClientDTO, 'path'>;
}): string {
  return rewriteMarkdownResourceReference(input.markdown, input.reference, {
    destination: input.replacement.path,
  });
}

export const __test__ = {
  buildResourceReferenceIndex,
  repairBrokenMarkdownReference,
};
