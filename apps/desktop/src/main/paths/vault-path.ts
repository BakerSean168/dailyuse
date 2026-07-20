/**
 * Local vault path helpers for Desktop profiles.
 * Desktop profile 的本地 Vault 路径辅助。
 */

import path from 'node:path';
import type { ProfilePathResolver } from './types';

/**
 * Default suggested vault directory inside a profile (user may still pick any folder).
 * profile 内默认建议的 vault 目录（用户仍可选择任意文件夹）。
 */
export function getDefaultVaultSuggestionPath(profileResolver: ProfilePathResolver): string {
  return path.join(profileResolver.storageDir, 'obsidian-vault');
}

/**
 * Build an Obsidian URI to open a file or vault root.
 * 构建打开文件或 vault 根目录的 Obsidian URI。
 *
 * @see https://help.obsidian.md/Extending+Obsidian/Obsidian+URI
 */
export function buildObsidianUri(params: {
  vaultName?: string | null;
  filePath?: string | null;
}): string {
  const search = new URLSearchParams();
  if (params.vaultName) {
    search.set('vault', params.vaultName);
  }
  if (params.filePath) {
    search.set('file', params.filePath);
  }
  const query = search.toString();
  return query ? `obsidian://open?${query}` : 'obsidian://open';
}

/**
 * Reject path traversal when resolving a note path under a vault root.
 * 在 vault 根下解析笔记路径时拒绝路径穿越。
 */
export function resolvePathInsideVault(vaultRoot: string, relativePath: string): string {
  const root = path.resolve(vaultRoot);
  const candidate = path.resolve(root, relativePath);
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path escapes vault root');
  }
  return candidate;
}
