/**
 * Repository-wide GitHub Action pinning helpers.
 *
 * Third-party actions are executable supply-chain inputs. MemoFlow requires
 * immutable 40-hex commit SHAs plus an inline version comment so updates stay
 * reviewable without restoring mutable tag authority.
 */

export const FULL_COMMIT_SHA = /^[0-9a-f]{40}$/u;
export const VERSION_COMMENT = /^v\d+(?:[.-][0-9A-Za-z.-]+)?$/u;

/**
 * Inspect one workflow/composite-action source for third-party `uses:` refs.
 * Local actions (`./...`) are repository-owned and intentionally exempt.
 * @param {{ file: string, content: string }} input
 * @returns {Array<{file:string,line:number,action:string,ref:string,reason:string}>}
 */
export function findUnpinnedActionUses({ file, content }) {
  const violations = [];
  const lines = content.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/\buses:\s*(.+?)\s*$/u);
    if (!match) continue;

    const raw = match[1].trim();
    const commentMatch = raw.match(/^(.*?)\s+#\s*(.*)$/u);
    const rawSpec = (commentMatch?.[1] ?? raw).trim();
    const versionComment = (commentMatch?.[2] ?? '').trim().split(/\s+/u)[0] ?? '';
    const quoted = rawSpec.match(/^(['"])(.*)\1$/u);
    const spec = quoted?.[2] ?? rawSpec;
    if (spec.startsWith('./')) continue;

    const separator = spec.lastIndexOf('@');
    if (separator <= 0 || separator === spec.length - 1) {
      violations.push({
        file,
        line: index + 1,
        action: spec,
        ref: '',
        reason: 'third-party action must use owner/repository@<40-hex-sha>',
      });
      continue;
    }

    const action = spec.slice(0, separator);
    const ref = spec.slice(separator + 1);
    if (!FULL_COMMIT_SHA.test(ref)) {
      violations.push({
        file,
        line: index + 1,
        action,
        ref,
        reason: 'third-party action ref is mutable; pin an immutable 40-hex commit SHA',
      });
      continue;
    }

    if (!VERSION_COMMENT.test(versionComment)) {
      violations.push({
        file,
        line: index + 1,
        action,
        ref,
        reason: 'immutable action pin must retain an inline version comment such as # v6',
      });
    }
  }

  return violations;
}
