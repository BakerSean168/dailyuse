import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isAbortLikeError } from './is-abort-like-error';

/**
 * Residual 967: isAbortLikeError dual retired (client HTTP adapters).
 * Sole body in is-abort-like-error.ts; assistant + message HTTP adapters import it.
 * Soft residual 963: findSSEBoundary dual retired (find-sse-boundary-dual.surface.spec.ts).
 * Soft residual 965: getRequestId dual retired (get-request-id-dual.surface.spec.ts).
 * Soft residual 970: tip focused suite numbers track Residual 970 evidence tip (276/1216).
 * Soft residual 969: knowledge-index value helpers dual retired (adapters/knowledge-index-value-helpers-dual.surface.spec.ts).
 * Keep-boundary: server ai-chat-helpers and app-vue useAIChatSession keep distinct
 * abort predicates (category / DOMException / ABORTED code).
 * Does not flip §13.2 checkboxes.
 */
describe('isAbortLikeError dual retired (residual 967)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'is-abort-like-error.ts'), 'utf8');
  const assistant = readFileSync(
    resolve(
      sharedDir,
      '../infrastructure-client/adapters/http/ai-assistant-http.adapter.ts',
    ),
    'utf8',
  );
  const message = readFileSync(
    resolve(
      sharedDir,
      '../infrastructure-client/adapters/http/ai-message-http.adapter.ts',
    ),
    'utf8',
  );
  const serverHelpers = readFileSync(
    resolve(
      sharedDir,
      '../server/application/use-cases/commands/ai-chat-helpers.ts',
    ),
    'utf8',
  );

  it('owns sole isAbortLikeError helper body for client HTTP adapters', () => {
    expect(sole).toContain('Residual 967');
    expect(sole).toMatch(/export function isAbortLikeError\b/);
    expect(sole).toContain("error.name === 'AbortError'");
    expect(sole).toContain("message.includes('abort')");
    expect(sole).toContain("message.includes('cancel')");
  });

  it('assistant/message adapters import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['assistant', assistant],
      ['message', message],
    ] as const) {
      expect(source, label).toContain('Residual 967');
      expect(source, label).toContain(
        "import { isAbortLikeError } from '../../../shared/is-abort-like-error'",
      );
      expect(source, label).not.toMatch(/function isAbortLikeError\b/);
      expect(source, label).toContain('isAbortLikeError(error)');
    }
  });

  it('keeps server ai-chat-helpers abort predicate as distinct keep-boundary', () => {
    expect(serverHelpers).toMatch(/export function isAbortLikeError\b/);
    expect(serverHelpers).toContain("category === 'aborted'");
    expect(serverHelpers).not.toContain('is-abort-like-error');
  });

  it('detects AbortError name and abort/cancel message fragments', () => {
    expect(isAbortLikeError(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isAbortLikeError({ name: 'AbortError' })).toBe(true);
    expect(isAbortLikeError({ message: 'Request aborted by user' })).toBe(true);
    expect(isAbortLikeError({ message: 'Operation cancelled' })).toBe(true);
    expect(isAbortLikeError({ message: 'network failed' })).toBe(false);
    expect(isAbortLikeError(null)).toBe(false);
    expect(isAbortLikeError('abort')).toBe(false);
  });
});
