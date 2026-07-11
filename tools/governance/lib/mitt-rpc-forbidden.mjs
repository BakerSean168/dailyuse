/**
 * mitt-RPC forbidden audit (pure logic).
 *
 * Enforces ADR-033: the same-process message-style RPC (`eventBus.invoke` /
 * `eventBus.handle`) is deprecated. Same-process request/response goes through a
 * Port; cross-process goes through @dailyuse/ipc-client / HTTP. This audit fails
 * if business code reintroduces `eventBus.invoke(` / `eventBus.handle(`.
 *
 * Scoped to the `eventBus.` receiver on purpose: bare `.invoke(` / `.handle(`
 * match legitimate Electron IPC (`ipcMain.handle`, `ipcRenderer.invoke`) which
 * are the sanctioned cross-process mechanism, not mitt-RPC.
 */

import { findPatternMatches } from './source-scan.mjs';

export const MITT_RPC_PATTERN = /\beventBus\.(invoke|handle)\s*\(/;

/**
 * Directory segments whose files are exempt (they legitimately own cross-process
 * request/response adapters). Matched against forward-slash relative paths.
 */
export const EXEMPT_PATH_SEGMENTS = [
  'packages/ipc-client/',
  '/infrastructure-server/',
  '/infrastructure-client/',
  '/infrastructure/',
];

export function isExemptPath(relPath, exemptSegments = EXEMPT_PATH_SEGMENTS) {
  return exemptSegments.some((segment) => relPath.includes(segment));
}

/**
 * Find mitt-RPC violations across the given files.
 * @param {Array<{ relPath: string, content: string }>} files
 * @param {{ exemptSegments?: string[], allowlist?: Set<string> }} [options]
 * @returns {{ violations: Array<{file:string,line:number,method:string}>, auditedFiles:number, exemptHits:number }}
 */
export function findMittRpcViolations(files, options = {}) {
  const exemptSegments = options.exemptSegments ?? EXEMPT_PATH_SEGMENTS;
  const allowlist = options.allowlist ?? new Set();
  const violations = [];
  let auditedFiles = 0;
  let exemptHits = 0;

  for (const { relPath, content } of files) {
    auditedFiles += 1;
    const matches = findPatternMatches(content, MITT_RPC_PATTERN);
    if (matches.length === 0) continue;

    if (isExemptPath(relPath, exemptSegments) || allowlist.has(relPath)) {
      exemptHits += matches.length;
      continue;
    }

    for (const match of matches) {
      violations.push({ file: relPath, line: match.line, method: match.method });
    }
  }

  return { violations, auditedFiles, exemptHits };
}

export function formatMittRpcViolation({ file, line, method }) {
  return `${file}:${line}: eventBus.${method}() is deprecated (ADR-033) — use a Port (same-process) or @dailyuse/ipc-client / HTTP (cross-process)`;
}
