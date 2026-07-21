/**
 * Resolves the repository path for generated AI knowledge notes.
 *
 * The logic is pure string normalization and filename generation, so it
 * belongs to the application layer rather than infrastructure.
 *
 * Defense in depth: rejects absolute, drive-relative, and `.` / `..` segments
 * even if an upstream contract parse is bypassed.
 */
export class AIKnowledgeNotePathResolver {
  resolve(
    subpath: string,
    title: string,
  ): { directoryPath: string; fileName: string; path: string } {
    const normalizedInput = subpath.replace(/\\/g, '/').trim();
    if (/^[A-Za-z]:/.test(normalizedInput) || normalizedInput.startsWith('/')) {
      throw new Error('Knowledge note path must be vault-relative');
    }

    const segments = normalizedInput
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.some((segment) => segment === '.' || segment === '..')) {
      throw new Error('Knowledge note path cannot contain . or .. segments');
    }
    if (segments.some((segment) => /[<>:"|?*]/.test(segment))) {
      throw new Error('Knowledge note path contains invalid characters');
    }

    const directoryPath = segments.join('/');
    const safeTitle = this.slugify(title || 'AI Note');
    const fileName = `${safeTitle}.md`;
    return {
      directoryPath,
      fileName,
      path: directoryPath ? `${directoryPath}/${fileName}` : fileName,
    };
  }

  private slugify(input: string): string {
    const trimmed = input.trim();
    const sanitized = trimmed.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
    return sanitized || 'AI-Note';
  }
}
