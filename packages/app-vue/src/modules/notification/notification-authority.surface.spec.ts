/**
 * Notification pilot authority surface (fail closed; plan §5.6).
 *
 * 失败即门的 authority surface：Notification Pinia store 一旦重新出现 server DTO / count /
 * loading / error，或事件源直接 import store / 直接 setQueryData / invalidateQueries，本 spec
 * 必须失败。
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleRoot = dirname(fileURLToPath(import.meta.url));

/** Strip block + line comments so prose in JSDoc never trips authority checks. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\/.*$/g, '');
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (/\.(ts|vue)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const storeSource = code(readFileSync(resolve(moduleRoot, 'stores/notification-store.ts'), 'utf8'));
const initSource = code(readFileSync(resolve(moduleRoot, 'initialization/index.ts'), 'utf8'));
const sseSource = code(
  readFileSync(
    resolve(moduleRoot, 'initialization/notification-sse-invalidation-source.ts'),
    'utf8',
  ),
);

describe('Notification pilot authority surface (fail closed)', () => {
  it('keeps the Notification store UI-only (no server DTO / count / loading / error)', () => {
    expect(storeSource).not.toContain('NotificationClientDTO');
    expect(storeSource).not.toMatch(/notifications:\s*\[/);
    expect(storeSource).not.toMatch(/unreadCount:/);
    expect(storeSource).not.toMatch(/isLoading:/);
    expect(storeSource).not.toMatch(/error:\s*string/);
    expect(storeSource).not.toMatch(/isInitialized:/);
  });

  it('does not let the eventBus startup hook import the Notification store or construct DTOs', () => {
    expect(initSource).not.toContain('../stores/notification-store');
    expect(initSource).not.toContain('NotificationClientDTO');
    expect(initSource).not.toContain('.addNotification(');
    expect(initSource).not.toContain('incrementUnread');
    expect(initSource).toContain('dispatcher.invalidate');
  });

  it('does not let SSE / eventBus sources patch or invalidate the cache directly', () => {
    for (const source of [initSource, sseSource]) {
      expect(source).not.toContain('setQueryData');
      expect(source).not.toContain('invalidateQueries');
      expect(source).not.toContain('getQueryData');
    }
  });

  it('keeps the sole `invalidateQueries` / `setQueryData` owners inside the allowed files', () => {
    // invalidateQueries 只允许出现在 platform/server-state/invalidation-dispatcher.ts；
    // setQueryData 只允许出现在两个模块内部的 cache-patch helper。
    const disallowed: string[] = [];
    for (const file of walkFiles(moduleRoot)) {
      const relativePath = relative(moduleRoot, file);
      if (relativePath.includes('.spec.') || relativePath.includes('notificationCache.ts'))
        continue;
      const source = code(readFileSync(file, 'utf8'));
      if (source.includes('invalidateQueries('))
        disallowed.push(`${relativePath}: invalidateQueries`);
      if (source.includes('setQueryData(')) disallowed.push(`${relativePath}: setQueryData`);
    }
    expect(disallowed).toEqual([]);
  });
});
