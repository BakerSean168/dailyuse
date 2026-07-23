/**
 * Residual 957: sole vault FS guards for Local Vault + Desktop knowledge repository.
 * isMissing / isTemporaryFile duals retired from local-vault-runtime, auto-sync scheduler,
 * and knowledge-repository git runtime. isTemporarySyncFile renamed onto isTemporaryFile sole.
 */

/** True when error is a Node ENOENT-style missing path. */
export function isMissing(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

/**
 * True when a basename should be ignored as editor/OS temporary noise
 * (matches vault gitignore / sync ignore policy).
 */
export function isTemporaryFile(name: string): boolean {
  return (
    name === '.DS_Store' ||
    name === 'Thumbs.db' ||
    name.startsWith('.#') ||
    name.endsWith('~') ||
    /\.(?:swp|swo|tmp|temp)$/i.test(name)
  );
}
