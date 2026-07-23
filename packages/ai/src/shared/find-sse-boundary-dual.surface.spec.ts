import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findSSEBoundary } from './find-sse-boundary';

/**
 * Residual 963: findSSEBoundary dual retired.
 * Sole body in find-sse-boundary.ts; assistant/message HTTP adapters +
 * server chat-execution adapter import it.
 * Soft residual 974: tip focused suite numbers track Residual 974 evidence tip (278/1223).
 * Soft residual 965: getRequestId dual retired (get-request-id-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('findSSEBoundary dual retired (residual 963)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'find-sse-boundary.ts'), 'utf8');
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
  const chatExecution = readFileSync(
    resolve(
      sharedDir,
      '../server/infrastructure/chat-execution/ai-service-chat-execution.adapter.ts',
    ),
    'utf8',
  );

  it('owns sole findSSEBoundary helper body', () => {
    expect(sole).toContain('Residual 963');
    expect(sole).toMatch(/export function findSSEBoundary\b/);
    expect(sole).toContain("\\r\\n\\r\\n");
    expect(sole).toContain('\\n\\n');
  });

  it('assistant/message/chat-execution import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['assistant', assistant],
      ['message', message],
      ['chatExecution', chatExecution],
    ] as const) {
      expect(source, label).toContain('Residual 963');
      expect(source, label).toContain(
        "import { findSSEBoundary } from '../../../shared/find-sse-boundary'",
      );
      expect(source, label).not.toMatch(/function findSSEBoundary\b/);
      expect(source, label).toContain('findSSEBoundary(buffer)');
    }
  });

  it('locates CRLF and LF SSE event boundaries', () => {
    expect(findSSEBoundary('data: hi\r\n\r\nnext')).toEqual({ index: 8, length: 4 });
    expect(findSSEBoundary('data: hi\n\nnext')).toEqual({ index: 8, length: 2 });
    expect(findSSEBoundary('data: incomplete')).toBeNull();
    // Prefer first boundary in buffer; CRLF before LF fragment
    expect(findSSEBoundary('a\r\n\r\nb\n\nc')).toEqual({ index: 1, length: 4 });
  });
});
