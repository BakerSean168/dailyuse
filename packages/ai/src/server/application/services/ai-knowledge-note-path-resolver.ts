/**
 * Resolves the repository path for generated AI knowledge notes.
 *
 * The logic is pure string normalization and filename generation, so it
 * belongs to the application layer rather than infrastructure.
 */
export class AIKnowledgeNotePathResolver {
  resolve(
    subpath: string,
    title: string,
  ): { directoryPath: string; fileName: string; path: string } {
    const normalizedSubpath = subpath
      .replace(/\\/g, '/')
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('/');

    const safeTitle = this.slugify(title || 'AI Note');
    const directoryPath = normalizedSubpath ? `/notes/${normalizedSubpath}` : '/notes';
    const fileName = `${safeTitle}.md`;
    return {
      directoryPath,
      fileName,
      path: `${directoryPath}/${fileName}`,
    };
  }

  private slugify(input: string): string {
    const trimmed = input.trim();
    const sanitized = trimmed.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
    return sanitized || 'AI-Note';
  }
}
