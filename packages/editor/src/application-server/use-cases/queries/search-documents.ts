import type { SearchRequest, SearchResponse } from '@dailyuse/contracts/editor';
import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import type { IDocumentRepository } from '../../../domain-server/repositories/IDocumentRepository';

export class SearchDocumentsUseCase {
  constructor(
    private readonly workspaceRepository: IEditorWorkspaceRepository,
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(identityId: string, request: SearchRequest): Promise<SearchResponse> {
    const query = request.query.trim();
    if (!query) {
      return { results: [], total: 0 };
    }

    const workspaces = await this.workspaceRepository.findByIdentityId(identityId);
    const allowedWorkspaceIds = new Set(workspaces.map((workspace) => String(workspace.id)));
    const workspaceIds = request.workspaceId
      ? allowedWorkspaceIds.has(String(request.workspaceId))
        ? [String(request.workspaceId)]
        : []
      : [...allowedWorkspaceIds];

    if (workspaceIds.length === 0) {
      return { results: [], total: 0 };
    }

    const documents = (
      await Promise.all(
        workspaceIds.map((workspaceId) => this.documentRepository.findByWorkspaceId(workspaceId)),
      )
    ).flat();

    const normalizedQuery = query.toLowerCase();
    const results = documents
      .map((document) => {
        const lines = document.content.split(/\r?\n/);
        const matchingHighlights = lines
          .map((text, index) => ({ line: index + 1, text }))
          .filter((line) => line.text.toLowerCase().includes(normalizedQuery))
          .slice(0, 5);
        const haystack = `${document.name}\n${document.path}\n${document.content}`.toLowerCase();
        const matchIndex = haystack.indexOf(normalizedQuery);

        if (matchIndex < 0 && matchingHighlights.length === 0) {
          return null;
        }

        const firstHighlight = matchingHighlights[0]?.text ?? document.content;
        const highlightIndex = firstHighlight.toLowerCase().indexOf(normalizedQuery);
        const snippetStart = Math.max(highlightIndex - 60, 0);
        const snippetEnd =
          highlightIndex >= 0 ? highlightIndex + normalizedQuery.length + 120 : 180;
        const snippetSource = firstHighlight || document.content;

        return {
          documentId: String(document.id),
          documentPath: document.path,
          documentName: document.name,
          snippet: snippetSource.slice(snippetStart, snippetEnd),
          score: document.name.toLowerCase().includes(normalizedQuery)
            ? 1
            : document.path.toLowerCase().includes(normalizedQuery)
              ? 0.9
              : 0.8,
          highlights: matchingHighlights,
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort(
        (left, right) =>
          right.score - left.score || left.documentName.localeCompare(right.documentName),
      );

    const offset = request.offset ?? 0;
    const limit = request.limit ?? 20;

    return {
      results: results.slice(offset, offset + limit),
      total: results.length,
    };
  }
}
